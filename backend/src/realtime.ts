import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/env';
import { query } from './database/db';

type StaffRole = 'admin' | 'cashier';

interface StaffClaims {
  id: number;
  username: string;
  role: StaffRole;
  full_name: string;
}

interface AccessClaims {
  scope: 'customer' | 'order:read';
  tableNumber?: string;
  reference?: string;
}

interface RealtimeSocket extends Socket {
  data: {
    staff?: StaffClaims;
    orderReference?: string;
    customerTable?: string;
  };
}

let realtimeServer: Server | null = null;

function normalizeReference(reference: string): string {
  return reference.trim().toLowerCase();
}

function verifyToken(token: unknown): StaffClaims | AccessClaims | null {
  if (typeof token !== 'string' || token.length === 0) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (!decoded || typeof decoded === 'string') return null;

    if (
      typeof decoded.id === 'number' &&
      typeof decoded.username === 'string' &&
      typeof decoded.full_name === 'string' &&
      (decoded.role === 'admin' || decoded.role === 'cashier')
    ) {
      return decoded as StaffClaims;
    }

    if (
      decoded.scope === 'customer' &&
      typeof decoded.tableNumber === 'string' &&
      decoded.tableNumber.length > 0
    ) {
      return decoded as AccessClaims;
    }

    if (
      decoded.scope === 'order:read' &&
      typeof decoded.reference === 'string' &&
      decoded.reference.length > 0
    ) {
      return decoded as AccessClaims;
    }
  } catch {
    return null;
  }
  return null;
}

export function createCustomerAccessToken(tableNumber: string): string {
  return jwt.sign({ scope: 'customer', tableNumber }, config.jwtSecret, { expiresIn: '24h' });
}

export function createOrderAccessToken(reference: string): string {
  return jwt.sign({ scope: 'order:read', reference: normalizeReference(reference) }, config.jwtSecret, { expiresIn: '24h' });
}

export function initializeRealtime(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: false },
    transports: ['websocket', 'polling'],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false
    }
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const claims = verifyToken(token);
    if (!claims) {
      next(new Error('Unauthorized realtime connection.'));
      return;
    }

    const authenticatedSocket = socket as RealtimeSocket;
    if ('role' in claims) {
      try {
        const userResult = await query(
          'SELECT id, username, full_name, role, is_active FROM users WHERE id = $1',
          [(claims as StaffClaims).id]
        );
        const user = userResult.rows[0];
        if (!user || !user.is_active || user.role !== (claims as StaffClaims).role) {
          next(new Error('Unauthorized realtime connection.'));
          return;
        }
        authenticatedSocket.data.staff = user as StaffClaims;
      } catch {
        next(new Error('Realtime authentication is temporarily unavailable.'));
        return;
      }
    } else if (claims.scope === 'order:read') {
      authenticatedSocket.data.orderReference = normalizeReference(claims.reference!);
    } else {
      authenticatedSocket.data.customerTable = claims.tableNumber;
    }
    next();
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as RealtimeSocket;
    if (socket.data.staff) {
      socket.join(`role:${socket.data.staff.role}`);
      socket.join('staff');
    }
    if (socket.data.customerTable) socket.join('customers');
    if (socket.data.orderReference) {
      socket.join('customers');
      socket.join(`order:${socket.data.orderReference}`);
    }

    socket.on('order.status.request', async () => {
      if (!socket.data.orderReference) return;
      try {
        const result = await query(
          `SELECT id, reference_no, status, payment_status, table_number
           FROM orders o JOIN tables t ON t.id = o.table_id
           WHERE LOWER(reference_no) = $1
           LIMIT 1`,
          [socket.data.orderReference]
        );
        const order = result.rows[0];
        if (!order) return;
        socket.emit('order.status', {
          orderId: order.id,
          referenceNo: order.reference_no,
          status: order.status,
          paymentStatus: order.payment_status,
          tableNumber: order.table_number
        });
      } catch (error) {
        console.error('[Realtime] status request failed:', error);
      }
    });
  });

  realtimeServer = io;
  return io;
}

export function emitOrderCreated(payload: {
  orderId: number;
  referenceNo: string;
  tableNumber: string;
}): void {
  realtimeServer?.to('staff').emit('order.created', payload);
}

export function emitOrderStatusChanged(payload: {
  orderId: number;
  referenceNo: string;
  status: string;
  paymentStatus: string;
  tableNumber?: string;
}): void {
  realtimeServer?.to('staff').emit('order.status.changed', payload);
  realtimeServer?.to(`order:${normalizeReference(payload.referenceNo)}`).emit('order.status.changed', payload);
}

export function emitInventoryUpdated(payload: {
  entity: 'product' | 'category';
  entityId?: number;
  action: 'created' | 'updated' | 'deactivated' | 'deleted';
}): void {
  realtimeServer?.to('staff').emit('inventory.updated', payload);
  realtimeServer?.to('customers').emit('inventory.updated', payload);
}

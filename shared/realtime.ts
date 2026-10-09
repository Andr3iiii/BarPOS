
import { io, Socket } from 'socket.io-client';

interface RealtimeOptions {
  apiBase: string;
  token: string;
  onUnauthorized?: () => void;
}

function resolveSocketUrl(apiBase: string): string {
  if (typeof window === 'undefined') {
    return apiBase;
  }

  if (apiBase.startsWith('/')) {
    if (window.location.protocol === 'file:' || window.location.origin === 'null') {
      return 'http://localhost:4000';
    }
    return window.location.origin;
  }

  try {
    const parsed = new URL(apiBase);
    if (parsed.origin === 'null') {
      return 'http://localhost:4000';
    }
    return parsed.origin;
  } catch {
    return window.location.origin;
  }
}

export function connectRealtime({
  apiBase,
  token,
  onUnauthorized,
}: RealtimeOptions): Socket {
  const socket = io(resolveSocketUrl(apiBase), {
    path: '/socket.io/',
    auth: { token },
    transports: ['websocket', 'polling'],
    tryAllTransports: true,
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.25,
  });

  socket.on('connect_error', (error) => {
    console.warn('[Realtime] Socket.IO connection issue:', error.message);

    if (/unauthorized|invalid token|expired token/i.test(error.message)) {
      onUnauthorized?.();
    }
  });

  return socket;
}


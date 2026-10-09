import { io, Socket } from 'socket.io-client';

interface RealtimeOptions {
  apiBase: string;
  token: string;
  onUnauthorized?: () => void;
}

function resolveSocketUrl(apiBase: string): string {
  if (typeof window === 'undefined') return apiBase;
  if (apiBase.startsWith('/')) return window.location.origin;
  try {
    return new URL(apiBase).origin;
  } catch {
    return window.location.origin;
  }
}

export function connectRealtime({ apiBase, token, onUnauthorized }: RealtimeOptions): Socket {
  const socket = io(resolveSocketUrl(apiBase), {
    auth: { token },
    transports: ['websocket', 'polling'],
    timeout: 8000,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.25
  });

  socket.on('connect_error', (error) => {
    if (/unauthorized/i.test(error.message)) onUnauthorized?.();
  });

  return socket;
}

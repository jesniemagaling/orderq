import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not defined');
}

const SOCKET_URL = API_URL
  ? API_URL.replace(/\/api$/, '')
  : 'https://orderq-backend.onrender.com';

export const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true,
  auth: () => ({
    token: localStorage.getItem('sessionToken'),
  }),
});

// Debug logs
socket.on('connect', () => {
  console.log('[Socket] Connected with id:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('[Socket] Connection error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.warn('[Socket] Disconnected:', reason);
});

socket.onAny((event, ...args) => {
  console.log(`[Socket] Event received: ${event}`, args);
});

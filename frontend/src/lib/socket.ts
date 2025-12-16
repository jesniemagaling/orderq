import { io } from 'socket.io-client';

const token = localStorage.getItem('sessionToken');

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true,
  auth: { token },
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

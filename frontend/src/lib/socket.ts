import { io } from 'socket.io-client';

const token = localStorage.getItem('sessionToken');

export const socket = io('http://192.168.10.1:5000', {
  transports: ['websocket'],
  withCredentials: true,
  auth: {
    token,
  },
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

// log all events for debugging
socket.onAny((event, ...args) => {
  console.log(`[Socket] Event received: ${event}`, args);
});

import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not defined');
}

const SOCKET_URL = API_URL
  ? API_URL.replace(/\/api$/, '')
  : 'https://orderq-backend.onrender.com';

export const adminSocket: Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

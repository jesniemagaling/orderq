import { io, Socket } from 'socket.io-client';

export const adminSocket: Socket = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

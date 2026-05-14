import { io, type Socket } from 'socket.io-client';

let socket: null | Socket = null;
let socketToken: null | string = null;

function resolveSocketUrl() {
  return (
    import.meta.env.VITE_WS_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim() ||
    window.location.origin
  );
}

export function getSocket() {
  return socket;
}

export function connectSocket(token: string) {
  if (socket && socketToken === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketToken = token;
  socket = io(resolveSocketUrl(), {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketToken = null;
}

import { io } from 'socket.io-client';

// OLD: const BACKEND_URL = "http://localhost:5000";

// NEW:
const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
export const socket = io(BACKEND_URL, {
    autoConnect: false,
    transports: ['websocket'] 
});
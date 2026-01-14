import { io, Socket } from 'socket.io-client';
import api from './api';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    const token = api.getToken();

    // In production use current origin, in development use localhost:3000
    const baseUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:3000';

    this.socket = io(baseUrl, {
      auth: { token },
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket.io connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket.io disconnected');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();

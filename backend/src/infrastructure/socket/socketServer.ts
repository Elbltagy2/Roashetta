import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role: 'doctor' | 'assistant';
  doctorId: string;
}

export const initializeSocketServer = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
      credentials: true,
    },
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const { doctorId, email, role } = socket.data.user;

    console.log(`User connected: ${email} (${role}) - Socket ID: ${socket.id}`);

    // Join doctor-specific room
    socket.join(`doctor:${doctorId}`);
    console.log(`User ${email} joined room: doctor:${doctorId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${email} - Socket ID: ${socket.id}`);
    });
  });

  return io;
};

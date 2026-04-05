import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';

type Listener = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  connected = false;

  connect(token: string) {
    if (this.socket?.connected) return;
    if (!token) return;

    this.socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.emit('connection_status', 'connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.emit('connection_status', 'disconnected');
    });

    this.socket.on('connect_error', () => {
      this.connected = false;
      this.emit('connection_status', 'error');
    });

    this.socket.on('new_message',   (d) => this.emit('new_message', d));
    this.socket.on('room_message',  (d) => this.emit('room_message', d));
    this.socket.on('user_typing',   (d) => this.emit('user_typing', d));
    this.socket.on('online_users',  (d) => this.emit('online_users', d));
    this.socket.on('quiz_started',  (d) => this.emit('quiz_started', d));
    this.socket.on('quiz_ended',    (d) => this.emit('quiz_ended', d));
    this.socket.on('error',         (d) => this.emit('socket_error', d));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
    this.listeners.clear();
  }

  joinConversation(conversationId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('leave_conversation', conversationId);
  }

  sendMessage(conversationId: number, message: string) {
    if (!this.socket?.connected) return false;
    this.socket.emit('send_message', { conversationId, message });
    return true;
  }

  joinRoom(roomId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('join_room', roomId);
  }

  leaveRoom(roomId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('leave_room', roomId);
  }

  sendRoomMessage(roomId: number, message: string, aiEnabled: boolean) {
    if (!this.socket?.connected) return false;
    this.socket.emit('send_room_message', {
      roomId,
      message,
      type: aiEnabled ? 'ai_discussion' : 'user',
      aiEnabled,
    });
    return true;
  }

  sendTyping(conversationId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { conversationId });
  }

  sendStopTyping(conversationId: number) {
    if (!this.socket?.connected) return;
    this.socket.emit('stop_typing', { conversationId });
  }

  isConnected() {
    return this.connected && !!this.socket?.connected;
  }

  on(event: string, cb: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  off(event: string, cb: Listener) {
    this.listeners.get(event)?.delete(cb);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => {
      try { cb(data); } catch {}
    });
  }
}

export const socketService = new SocketService();
export default socketService;

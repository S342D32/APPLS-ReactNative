import api from './api';

// ── Types ──────────────────────────────────────────────────────────────────────
export type Conversation = {
  id: number;
  title?: string;
  is_group?: boolean;
  last_message?: string;
  last_time_active?: string;
  participants?: { id: number; name: string; email: string; profile_image?: string }[];
};

export type Message = {
  id: string | number;
  conversation_id?: number;
  room_id?: number;
  sender_id?: number;
  sender?: { id: number; name: string; profile_image?: string };
  sender_name?: string;
  sender_image?: string;
  message: string;
  type?: string;
  created_at?: string;
  sending?: boolean;
};

export type Room = {
  id: number;
  name: string;
  topic?: string;
  description?: string;
  color?: string;
  tags?: string[];
  member_count?: number;
};

export type AppUser = {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
};

// ── Chat Service ───────────────────────────────────────────────────────────────
export const ChatService = {
  getConversations: () =>
    api.get('/api/messages').then((r) => r.data),

  createConversation: (data: { participantIds: number[]; title?: string; isGroup?: boolean }) =>
    api.post('/api/messages', data).then((r) => r.data),

  getMessages: (conversationId: number) =>
    api.get(`/api/messages/${conversationId}/messages`).then((r) => r.data),

  sendMessage: (conversationId: number, message: string) =>
    api.post(`/api/messages/${conversationId}/messages`, { message }).then((r) => r.data),

  deleteConversation: (conversationId: number) =>
    api.delete(`/api/messages/${conversationId}`).then((r) => r.data),
};

// ── User Service ───────────────────────────────────────────────────────────────
export const UserService = {
  getAllUsers: () =>
    api.get('/api/users/all').then((r) => r.data),

  searchUsers: (q: string) =>
    api.get(`/api/users/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};

// ── Community Service ──────────────────────────────────────────────────────────
export const CommunityService = {
  getRooms: () =>
    api.get('/api/community-rooms').then((r) => r.data),

  createRoom: (data: { name: string; topic: string; description?: string; color?: string; tags?: string[] }) =>
    api.post('/api/community-rooms', data).then((r) => r.data),

  joinRoom: (roomId: number) =>
    api.post(`/api/community-rooms/${roomId}/join`).then((r) => r.data),

  getRoomMessages: (roomId: number, params: { limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return api.get(`/api/community-rooms/${roomId}/messages${qs ? `?${qs}` : ''}`).then((r) => r.data);
  },

  sendRoomMessage: (roomId: number, data: { message: string; type?: string }) =>
    api.post(`/api/community-rooms/${roomId}/messages`, data).then((r) => r.data),

  startQuiz: (roomId: number, data: object) =>
    api.post(`/api/community-rooms/${roomId}/quiz`, data).then((r) => r.data),

  submitAnswer: (roomId: number, quizId: number, data: object) =>
    api.post(`/api/community-rooms/${roomId}/quiz/${quizId}/answer`, data).then((r) => r.data),
};

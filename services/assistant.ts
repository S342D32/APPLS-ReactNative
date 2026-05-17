import api from './api';

export type AssistantRole = {
  id: number;
  name: string;
  description: string;
  system_prompt: string;
  icon: string;
  is_default: boolean;
};

export type AssistantMessage = {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export const AssistantService = {
  // Get all available roles (built-in + user custom)
  getRoles: () => api.get('/api/assistant/roles').then(r => r.data.roles as AssistantRole[]),

  // Create a custom role
  createRole: (data: { name: string; description?: string; system_prompt: string; icon?: string }) =>
    api.post('/api/assistant/roles', data).then(r => r.data.role as AssistantRole),

  // Start a new session for a role
  createSession: (role_id: number) =>
    api.post('/api/assistant/sessions', { role_id }).then(r => r.data.session),

  // Load messages for a session
  getMessages: (sessionId: number) =>
    api.get(`/api/assistant/sessions/${sessionId}/messages`).then(r => r.data.messages as AssistantMessage[]),

  // Send a message and get AI reply (with memory)
  chat: (sessionId: number, message: string) =>
    api.post(`/api/assistant/sessions/${sessionId}/chat`, { message }).then(r => r.data.response as string),
};

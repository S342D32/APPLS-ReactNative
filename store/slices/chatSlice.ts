import { createSlice, createSelector, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

// Types

type Message = {
  id: string;
  text?: string;
  senderId?: string;
  createdAt?: string;
};
type Conversation = {
  id: string;
  name?: string;
};
type TypingUser = {
  userId: string;
  userName?: string;
  isTyping: boolean;
};
type ChatState = {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  connectionStatus: "connected" | "disconnected" | "error";
  typingUsers: Record<string, TypingUser>;
  isLoading: boolean;
  error: string | null;
};

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  connectionStatus: "disconnected",
  typingUsers: {},
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setConnectionStatus(
      state,
      action: PayloadAction<ChatState["connectionStatus"]>,
    ) {
      state.connectionStatus = action.payload;
    },
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload;
    },

    addConversation(state, action: PayloadAction<Conversation>) {
      state.conversations.unshift(action.payload);
    },

    setCurrentConversation(state, action: PayloadAction<Conversation | null>) {
      state.currentConversation = action.payload;
    },
    updateConversation(
      state,
      action: PayloadAction<Partial<Conversation> & { id: string }>,
    ) {
      const index = state.conversations.findIndex(
        (c) => c.id === action.payload.id,
      );
      if (index !== -1) {
        state.conversations[index] = {
          ...state.conversations[index],
          ...action.payload,
        };
      }
    },
    removeConversation(state, action: PayloadAction<string>) {
      state.conversations = state.conversations.filter(
        (c) => c.id !== action.payload,
      );

      if (state.currentConversation?.id === action.payload) {
        state.currentConversation = null;
        state.messages = [];
      }
    },
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
    },

    addMessage(state, action: PayloadAction<Message>) {
      // Replace a matching temp message (same text + sender) or skip exact duplicate
      const tempIndex = state.messages.findIndex(
        (m) =>
          m.id.startsWith('temp-') &&
          m.text === action.payload.text &&
          m.senderId === action.payload.senderId,
      );
      if (tempIndex !== -1) {
        state.messages[tempIndex] = action.payload;
        return;
      }
      if (!state.messages.some((m) => m.id === action.payload.id)) {
        state.messages.push(action.payload);
      }
    },
    clearMessages(state) {
      state.messages = [];
    },
    setTypingStatus(
      state,
      action: PayloadAction<{
        userId: string;
        isTyping: boolean;
        userName?: string;
      }>,
    ) {
      const { userId, isTyping, userName } = action.payload;

      if (isTyping) {
        state.typingUsers[userId] = { userId, userName, isTyping: true };
      } else {
        delete state.typingUsers[userId];
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setConnectionStatus,
  setConversations,
  addConversation,
  setCurrentConversation,
  updateConversation,
  removeConversation,
  setMessages,
  addMessage,
  clearMessages,
  setTypingStatus,
  setLoading,
  setError,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;

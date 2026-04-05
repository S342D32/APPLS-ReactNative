import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addConversation,
  addMessage,
  setConnectionStatus,
  setConversations,
  setCurrentConversation,
  setMessages,
  setTypingStatus,
  updateConversation,
} from '@/store/slices/chatSlice';
import { ChatService, UserService } from '@/services/chat';
import type { AppUser, Conversation, Message } from '@/services/chat';
import { socketService } from '@/services/socket';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (d?: string) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatLastActive = (d?: string) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  return new Date(d).toLocaleDateString();
};

const initials = (name?: string) => (name ? name.charAt(0).toUpperCase() : '?');

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{initials(name)}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const dispatch = useAppDispatch();
  const { backendUser, jwtToken } = useAppSelector((s) => s.auth);
  const { conversations, currentConversation, messages, connectionStatus, typingUsers } =
    useAppSelector((s) => s.chat);

  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isConnected = connectionStatus === 'connected';
  const isTyping = Object.keys(typingUsers).length > 0;
  const insets = useSafeAreaInsets();
  // Tab bar is 60px (from _layout.tsx tabBarStyle height)
  const TAB_BAR_HEIGHT = 60;
  const kvOffset = TAB_BAR_HEIGHT + insets.bottom;

  // ── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jwtToken) return;

    socketService.connect(jwtToken);

    const onStatus = (s: string) =>
      dispatch(setConnectionStatus(s as 'connected' | 'disconnected' | 'error'));

    const onNewMessage = (msg: Message) => {
      if (currentConversation && msg.conversation_id === Number(currentConversation.id)) {
        dispatch(addMessage({ id: String(msg.id), text: msg.message, senderId: String(msg.sender_id), createdAt: msg.created_at }));
      }
      dispatch(
        updateConversation({
          id: String(msg.conversation_id),
          name: undefined,
        } as any)
      );
    };

    const onTyping = (data: { conversationId: number; userId: number; isTyping: boolean }) => {
      if (currentConversation && data.conversationId === Number(currentConversation.id) && data.userId !== backendUser?.id) {
        dispatch(setTypingStatus({ userId: String(data.userId), isTyping: data.isTyping }));
      }
    };

    const onOnlineUsers = (ids: number[]) => setOnlineUsers(ids ?? []);

    socketService.on('connection_status', onStatus);
    socketService.on('new_message', onNewMessage);
    socketService.on('user_typing', onTyping);
    socketService.on('online_users', onOnlineUsers);

    return () => {
      socketService.off('connection_status', onStatus);
      socketService.off('new_message', onNewMessage);
      socketService.off('user_typing', onTyping);
      socketService.off('online_users', onOnlineUsers);
    };
  }, [jwtToken, currentConversation?.id, backendUser?.id]);

  // ── Join / leave conversation room ──────────────────────────────────────────
  useEffect(() => {
    if (!currentConversation) return;
    loadMessages(Number(currentConversation.id));
    if (isConnected) socketService.joinConversation(Number(currentConversation.id));
    return () => {
      if (socketService.isConnected()) socketService.leaveConversation(Number(currentConversation.id));
    };
  }, [currentConversation?.id, isConnected]);

  // ── Initial data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
    loadUsers();
  }, []);

  // ── API calls ────────────────────────────────────────────────────────────────
  const loadConversations = async () => {
    try {
      const data = await ChatService.getConversations();
      dispatch(setConversations((data.conversations ?? []).map((c: Conversation) => ({ ...c, id: String(c.id), name: getConvTitle(c) }))));
    } catch {}
  };

  const loadUsers = async () => {
    try {
      const data = await UserService.getAllUsers();
      setAllUsers((data.users ?? []).filter((u: AppUser) => u.id !== backendUser?.id));
    } catch {}
  };

  const loadMessages = async (convId: number) => {
    try {
      setIsLoading(true);
      const data = await ChatService.getMessages(convId);
      dispatch(
        setMessages(
          (data.messages ?? []).map((m: Message) => ({
            id: String(m.id),
            text: m.message,
            senderId: String(m.sender_id),
            createdAt: m.created_at,
          }))
        )
      );
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const startConversation = async (selectedUser: AppUser) => {
    const existing = (conversations as any[]).find((c: any) =>
      c.participants?.some((p: any) => p.id === selectedUser.id)
    );
    if (existing) {
      dispatch(setCurrentConversation(existing));
      setSearchQuery('');
      return;
    }
    try {
      const data = await ChatService.createConversation({ participantIds: [selectedUser.id], title: selectedUser.name, isGroup: false });
      if (data.conversation) {
        const conv = { ...data.conversation, id: String(data.conversation.id), name: selectedUser.name };
        dispatch(addConversation(conv));
        dispatch(setCurrentConversation(conv));
      }
    } catch {}
    setSearchQuery('');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;
    const text = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    setNewMessage('');

    dispatch(addMessage({ id: tempId, text, senderId: String(backendUser?.id), createdAt: new Date().toISOString() }));

    if (socketService.isConnected()) {
      socketService.sendMessage(Number(currentConversation.id), text);
      socketService.sendStopTyping(Number(currentConversation.id));
    } else {
      try {
        await ChatService.sendMessage(Number(currentConversation.id), text);
      } catch {}
    }
  };

  const handleTyping = (val: string) => {
    setNewMessage(val);
    if (currentConversation && socketService.isConnected()) {
      socketService.sendTyping(Number(currentConversation.id));
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => socketService.sendStopTyping(Number(currentConversation.id)), 2000);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getConvTitle = (conv: any) => {
    if (conv.name) return conv.name;
    if (conv.title) return conv.title;
    const others = (conv.participants ?? []).filter((p: any) => p.id !== backendUser?.id);
    return others.map((p: any) => p.name).join(', ') || 'Chat';
  };

  const getOtherParticipant = (conv: any) =>
    (conv.participants ?? []).find((p: any) => p.id !== backendUser?.id);

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Render: conversation list ─────────────────────────────────────────────
  if (!currentConversation) {
    return (
      <View style={styles.container}>
        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Online strip */}
        {!searchQuery && onlineUsers.filter((id) => id !== backendUser?.id).length > 0 && (
          <View style={styles.onlineSection}>
            <Text style={styles.sectionLabel}>Online</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {allUsers
                .filter((u) => onlineUsers.includes(u.id))
                .slice(0, 8)
                .map((u) => (
                  <TouchableOpacity key={u.id} style={styles.onlineUser} onPress={() => startConversation(u)}>
                    <View style={styles.onlineAvatarWrap}>
                      <Avatar name={u.name} size={40} />
                      <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.onlineUserName} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* List */}
        {searchQuery ? (
          <FlatList
            data={filteredUsers}
            keyExtractor={(u) => String(u.id)}
            renderItem={({ item: u }) => (
              <TouchableOpacity style={styles.convItem} onPress={() => startConversation(u)}>
                <Avatar name={u.name} />
                <View style={styles.convInfo}>
                  <Text style={styles.convName}>{u.name}</Text>
                  <Text style={styles.convSub}>{u.email}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No users found</Text>}
          />
        ) : (
          <FlatList
            data={conversations as any[]}
            keyExtractor={(c) => String(c.id)}
            renderItem={({ item: conv }) => {
              const other = getOtherParticipant(conv);
              const isOnline = other && onlineUsers.includes(other.id);
              return (
                <TouchableOpacity style={styles.convItem} onPress={() => dispatch(setCurrentConversation(conv))}>
                  <View>
                    <Avatar name={getConvTitle(conv)} />
                    {isOnline && <View style={styles.onlineDotConv} />}
                  </View>
                  <View style={styles.convInfo}>
                    <View style={styles.convRow}>
                      <Text style={styles.convName} numberOfLines={1}>{getConvTitle(conv)}</Text>
                      <Text style={styles.convTime}>{formatLastActive((conv as any).last_time_active)}</Text>
                    </View>
                    <Text style={styles.convSub} numberOfLines={1}>{(conv as any).last_message || 'No messages'}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyCenter}>
                <Ionicons name="chatbubble-outline" size={40} color="#d1d5db" />
                <Text style={styles.empty}>No conversations yet</Text>
              </View>
            }
          />
        )}
      </View>
    );
  }

  // ── Render: chat view ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Chat header — outside KAV so it never moves */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => { dispatch(setCurrentConversation(null)); dispatch(setMessages([])); }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Avatar name={getConvTitle(currentConversation)} size={36} />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{getConvTitle(currentConversation)}</Text>
          <Text style={[styles.chatHeaderStatus, { color: isConnected ? '#22c55e' : '#9ca3af' }]}>
            {isConnected ? 'Online' : 'Connecting...'}
          </Text>
        </View>
      </View>

      {/* KAV wraps only messages + input so header stays fixed */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={kvOffset}
      >
        {/* Messages */}
        {isLoading ? (
          <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages as any[]}
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item: msg }) => {
              const isOwn = msg.senderId === String(backendUser?.id);
              return (
                <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
                  <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                    <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{msg.text}</Text>
                    <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>{formatTime(msg.createdAt)}</Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.msgRowOther}>
                  <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
                    <Text style={styles.typingDots}>• • •</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={newMessage}
            onChangeText={handleTyping}
            multiline
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 42, color: '#111827', fontSize: 14 },

  // Online strip
  onlineSection: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 },
  onlineUser: { alignItems: 'center', marginRight: 16, width: 52 },
  onlineAvatarWrap: { position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#f9fafb' },
  onlineUserName: { fontSize: 10, color: '#6b7280', marginTop: 4, textAlign: 'center' },

  // Conversation list
  convItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  convInfo: { flex: 1, marginLeft: 12 },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  convSub: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  convTime: { fontSize: 11, color: '#9ca3af', marginLeft: 8 },
  onlineDotConv: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },

  // Empty states
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 32, fontSize: 14 },
  emptyCenter: { alignItems: 'center', marginTop: 60 },

  // Avatar
  avatar: { backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Chat header
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { marginRight: 8 },
  chatHeaderInfo: { marginLeft: 10, flex: 1 },
  chatHeaderName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  chatHeaderStatus: { fontSize: 12, marginTop: 1 },

  // Messages
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 8, flexDirection: 'row' },
  msgRowOwn: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  bubbleOwn: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  bubbleText: { fontSize: 15, color: '#111827', lineHeight: 20 },
  bubbleTextOwn: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' },
  bubbleTimeOwn: { color: '#bfdbfe' },
  typingBubble: { paddingVertical: 12 },
  typingDots: { fontSize: 18, color: '#9ca3af', letterSpacing: 4 },

  // Input
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', maxHeight: 120, marginRight: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#93c5fd' },
});

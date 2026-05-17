// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity, ScrollView,
//   SafeAreaView, Animated, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import * as Speech from 'expo-speech';
// import { Audio } from 'expo-av';
// import { AssistantService, AssistantRole } from '@/services/assistant';
// import api from '@/services/api';

// // ── Types ─────────────────────────────────────────────────────────────────────
// type LocalMessage = { role: 'user' | 'assistant'; content: string };

// export default function AssistantScreen() {
//   const [roles, setRoles] = useState<AssistantRole[]>([]);
//   const [selectedRole, setSelectedRole] = useState<AssistantRole | null>(null);
//   const [sessionId, setSessionId] = useState<number | null>(null);
//   const [messages, setMessages] = useState<LocalMessage[]>([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [speaking, setSpeaking] = useState(false);
//   const [recording, setRecording] = useState(false);
//   const [showRolePicker, setShowRolePicker] = useState(false);
//   const [showAddRole, setShowAddRole] = useState(false);

//   // New role form state
//   const [newRoleName, setNewRoleName] = useState('');
//   const [newRolePrompt, setNewRolePrompt] = useState('');
//   const [newRoleIcon, setNewRoleIcon] = useState('🤖');

//   const scrollRef = useRef<ScrollView>(null);
//   const recordingRef = useRef<Audio.Recording | null>(null);

//   // ── Avatar animation (pulse when speaking/thinking) ───────────────────────
//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const floatAnim = useRef(new Animated.Value(0)).current;

//   // Idle floating animation
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
//         Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
//       ])
//     ).start();
//   }, []);

//   // Pulse when active (speaking or loading)
//   useEffect(() => {
//     if (speaking || loading) {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
//           Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
//         ])
//       ).start();
//     } else {
//       pulseAnim.stopAnimation();
//       Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
//     }
//   }, [speaking, loading]);

//   // ── Load roles on mount ───────────────────────────────────────────────────
//   useEffect(() => {
//     AssistantService.getRoles().then((r) => {
//       setRoles(r);
//       const def = r.find(x => x.is_default) ?? r[0];
//       if (def) startSession(def);
//     }).catch(() => Alert.alert('Error', 'Could not load assistant roles'));
//   }, []);

//   // ── Start a new session for a role ───────────────────────────────────────
//   const startSession = async (role: AssistantRole) => {
//     setSelectedRole(role);
//     setMessages([]);
//     setSessionId(null);
//     try {
//       const session = await AssistantService.createSession(role.id);
//       setSessionId(session.id);
//       // Greet the user
//       setMessages([{ role: 'assistant', content: `Hi! I'm your ${role.name}. How can I help you today?` }]);
//     } catch {
//       Alert.alert('Error', 'Could not start session');
//     }
//   };

//   // ── Send a text message ───────────────────────────────────────────────────
//   const sendMessage = useCallback(async (text: string) => {
//     if (!text.trim() || !sessionId) return;
//     const userMsg: LocalMessage = { role: 'user', content: text.trim() };
//     setMessages(prev => [...prev, userMsg]);
//     setInput('');
//     setLoading(true);

//     try {
//       const response = await AssistantService.chat(sessionId, text.trim());
//       const assistantMsg: LocalMessage = { role: 'assistant', content: response };
//       setMessages(prev => [...prev, assistantMsg]);
//       // Auto-speak the response
//       speakText(response);
//     } catch {
//       setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
//     } finally {
//       setLoading(false);
//     }
//   }, [sessionId]);

//   // ── TTS: speak assistant response ─────────────────────────────────────────
//   const speakText = (text: string) => {
//     Speech.stop();
//     setSpeaking(true);
//     Speech.speak(text, {
//       language: 'en',
//       rate: 0.95,
//       onDone: () => setSpeaking(false),
//       onError: () => setSpeaking(false),
//     });
//   };

//   const stopSpeaking = () => {
//     Speech.stop();
//     setSpeaking(false);
//   };

//   // ── STT: record and transcribe ────────────────────────────────────────────
//   const startRecording = async () => {
//     try {
//       const { granted } = await Audio.requestPermissionsAsync();
//       if (!granted) return Alert.alert('Permission needed', 'Microphone access is required');

//       await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
//       const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
//       recordingRef.current = recording;
//       setRecording(true);
//     } catch {
//       Alert.alert('Error', 'Could not start recording');
//     }
//   };

//   const stopRecording = async () => {
//     if (!recordingRef.current) return;
//     setRecording(false);
//     try {
//       await recordingRef.current.stopAndUnloadAsync();
//       const uri = recordingRef.current.getURI();
//       recordingRef.current = null;
//       if (!uri) return;

//       // Send audio to backend STT endpoint
//       setLoading(true);
//       const formData = new FormData();
//       formData.append('audio', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);

//       const res = await api.post('/api/speech-to-text', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       const transcribed = res.data?.text;
//       if (transcribed) sendMessage(transcribed);
//     } catch {
//       setLoading(false);
//       Alert.alert('Error', 'Could not transcribe audio');
//     }
//   };

//   // ── Add custom role ───────────────────────────────────────────────────────
//   const addCustomRole = async () => {
//     if (!newRoleName.trim() || !newRolePrompt.trim()) return Alert.alert('Required', 'Name and prompt are required');
//     try {
//       const role = await AssistantService.createRole({
//         name: newRoleName.trim(),
//         system_prompt: newRolePrompt.trim(),
//         icon: newRoleIcon,
//       });
//       setRoles(prev => [...prev, role]);
//       setShowAddRole(false);
//       setNewRoleName(''); setNewRolePrompt(''); setNewRoleIcon('🤖');
//     } catch {
//       Alert.alert('Error', 'Could not create role');
//     }
//   };

//   // Auto-scroll to bottom on new messages
//   useEffect(() => {
//     setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
//   }, [messages]);

//   return (
//     <SafeAreaView className="flex-1 bg-gray-50">
//       <KeyboardAvoidingView
//         className="flex-1"
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={90}
//       >
//         {/* ── Role selector bar ── */}
//         <View className="flex-row items-center px-4 py-2 bg-white border-b border-gray-100">
//           <TouchableOpacity
//             className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2"
//             onPress={() => setShowRolePicker(true)}
//           >
//             <Text className="text-lg mr-2">{selectedRole?.icon ?? '🤖'}</Text>
//             <Text className="flex-1 font-semibold text-gray-800">{selectedRole?.name ?? 'Select Role'}</Text>
//             <Ionicons name="chevron-down" size={16} color="#6b7280" />
//           </TouchableOpacity>
//           {/* Add new role button */}
//           <TouchableOpacity
//             className="ml-2 bg-blue-600 rounded-xl p-2"
//             onPress={() => setShowAddRole(true)}
//           >
//             <Ionicons name="add" size={20} color="white" />
//           </TouchableOpacity>
//         </View>

//         {/* ── Animated avatar ── */}
//         <View className="items-center py-4">
//           <Animated.View
//             style={{ transform: [{ translateY: floatAnim }, { scale: pulseAnim }] }}
//             className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center shadow-lg"
//           >
//             <Text style={{ fontSize: 36 }}>{selectedRole?.icon ?? '🤖'}</Text>
//           </Animated.View>
//           {/* Status indicator */}
//           <Text className="text-xs text-gray-400 mt-2 font-medium">
//             {loading ? '⏳ Thinking...' : speaking ? '🔊 Speaking...' : recording ? '🎙️ Listening...' : '● Ready'}
//           </Text>
//         </View>

//         {/* ── Messages ── */}
//         <ScrollView
//           ref={scrollRef}
//           className="flex-1 px-4"
//           showsVerticalScrollIndicator={false}
//         >
//           {messages.map((msg, i) => (
//             <View
//               key={i}
//               className={`mb-3 max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
//             >
//               <View
//                 className={`rounded-2xl px-4 py-3 ${
//                   msg.role === 'user' ? 'bg-blue-600' : 'bg-white border border-gray-100'
//                 }`}
//               >
//                 <Text className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
//                   {msg.content}
//                 </Text>
//               </View>
//               {/* Tap to re-speak assistant messages */}
//               {msg.role === 'assistant' && (
//                 <TouchableOpacity onPress={() => speakText(msg.content)} className="mt-1 ml-1">
//                   <Text className="text-xs text-gray-400">🔊 Replay</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           ))}
//           {/* Typing indicator */}
//           {loading && (
//             <View className="self-start bg-white border border-gray-100 rounded-2xl px-4 py-3 mb-3">
//               <ActivityIndicator size="small" color="#2563eb" />
//             </View>
//           )}
//         </ScrollView>

//         {/* ── Input bar ── */}
//         <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-100 gap-2">
//           {/* Mic button */}
//           <TouchableOpacity
//             className={`w-11 h-11 rounded-full items-center justify-center ${recording ? 'bg-red-500' : 'bg-gray-100'}`}
//             onPress={recording ? stopRecording : startRecording}
//           >
//             <Ionicons name={recording ? 'stop' : 'mic'} size={20} color={recording ? 'white' : '#374151'} />
//           </TouchableOpacity>

//           <TextInput
//             className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-800"
//             placeholder="Type a message..."
//             value={input}
//             onChangeText={setInput}
//             multiline
//             maxLength={500}
//             onSubmitEditing={() => sendMessage(input)}
//           />

//           {/* Stop speaking / Send */}
//           {speaking ? (
//             <TouchableOpacity className="w-11 h-11 rounded-full bg-orange-500 items-center justify-center" onPress={stopSpeaking}>
//               <Ionicons name="volume-mute" size={20} color="white" />
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity
//               className={`w-11 h-11 rounded-full items-center justify-center ${input.trim() ? 'bg-blue-600' : 'bg-gray-200'}`}
//               onPress={() => sendMessage(input)}
//               disabled={!input.trim() || loading}
//             >
//               <Ionicons name="send" size={18} color={input.trim() ? 'white' : '#9ca3af'} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </KeyboardAvoidingView>

//       {/* ── Role picker modal ── */}
//       <Modal visible={showRolePicker} transparent animationType="slide">
//         <TouchableOpacity className="flex-1 bg-black/40" onPress={() => setShowRolePicker(false)} />
//         <View className="bg-white rounded-t-3xl p-5 max-h-[60%]">
//           <Text className="text-lg font-bold text-gray-900 mb-4">Choose Assistant Role</Text>
//           <ScrollView>
//             {roles.map(role => (
//               <TouchableOpacity
//                 key={role.id}
//                 className={`flex-row items-center p-4 rounded-2xl mb-2 ${selectedRole?.id === role.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
//                 onPress={() => { startSession(role); setShowRolePicker(false); }}
//               >
//                 <Text className="text-2xl mr-3">{role.icon}</Text>
//                 <View className="flex-1">
//                   <Text className="font-semibold text-gray-900">{role.name}</Text>
//                   {role.description ? <Text className="text-xs text-gray-400 mt-0.5">{role.description}</Text> : null}
//                 </View>
//                 {selectedRole?.id === role.id && <Ionicons name="checkmark-circle" size={20} color="#2563eb" />}
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
//       </Modal>

//       {/* ── Add custom role modal ── */}
//       <Modal visible={showAddRole} transparent animationType="slide">
//         <TouchableOpacity className="flex-1 bg-black/40" onPress={() => setShowAddRole(false)} />
//         <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
//           <View className="bg-white rounded-t-3xl p-5">
//             <Text className="text-lg font-bold text-gray-900 mb-4">Create Custom Assistant</Text>

//             <View className="flex-row items-center gap-3 mb-3">
//               <TextInput
//                 className="w-14 h-14 bg-gray-100 rounded-2xl text-center text-2xl"
//                 value={newRoleIcon}
//                 onChangeText={setNewRoleIcon}
//                 maxLength={2}
//               />
//               <TextInput
//                 className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm"
//                 placeholder="Assistant name (e.g. Chef Assistant)"
//                 value={newRoleName}
//                 onChangeText={setNewRoleName}
//               />
//             </View>

//             <TextInput
//               className="bg-gray-100 rounded-2xl px-4 py-3 text-sm mb-4"
//               placeholder="System prompt — describe how this assistant should behave..."
//               value={newRolePrompt}
//               onChangeText={setNewRolePrompt}
//               multiline
//               numberOfLines={4}
//               style={{ minHeight: 90, textAlignVertical: 'top' }}
//             />

//             <TouchableOpacity className="bg-blue-600 rounded-2xl py-4 items-center" onPress={addCustomRole}>
//               <Text className="text-white font-bold">Create Assistant</Text>
//             </TouchableOpacity>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </SafeAreaView>
//   );
// }

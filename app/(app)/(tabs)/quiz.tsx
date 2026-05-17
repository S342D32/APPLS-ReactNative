import { QuizService } from '@/services/quiz';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Types
type Topic = { id: number; name: string };

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const QUESTION_COUNTS = [5, 10, 15, 20, 25];

export default function QuizSetupScreen() {
  const router = useRouter();

  // Data
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Topic[]>([]);

  // Selection
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Topic | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);

  // Search
  const [topicSearch, setTopicSearch] = useState('');
  const [subtopicSearch, setSubtopicSearch] = useState('');

  // Modals
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [subtopicModalOpen, setSubtopicModalOpen] = useState(false);
  const [addTopicModalOpen, setAddTopicModalOpen] = useState(false);
  const [addSubtopicModalOpen, setAddSubtopicModalOpen] = useState(false);
  const [newName, setNewName] = useState('');

  // Loading
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  // Fetch subtopics when topic changes
  useEffect(() => {
    if (selectedTopic) fetchSubtopics(selectedTopic.id);
    else setSubtopics([]);
    setSelectedSubtopic(null);
  }, [selectedTopic]);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const data = await QuizService.getTopics();
      setTopics(data.topics || []);
    } catch {
      setError('Failed to load topics.');
    } finally {
      setLoadingTopics(false);
    }
  };

  const fetchSubtopics = async (topicId: number) => {
    setLoadingSubtopics(true);
    try {
      const data = await QuizService.getSubtopics(topicId);
      setSubtopics(data.subtopics || []);
    } finally {
      setLoadingSubtopics(false);
    }
  };

  const handleAddTopic = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const topic = await QuizService.addTopic(newName.trim());
      setTopics((prev) => [...prev, topic]);
      setSelectedTopic(topic);
      setAddTopicModalOpen(false);
      setNewName('');
    } catch {
      setError('Failed to add topic.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubtopic = async () => {
    if (!newName.trim() || !selectedTopic) return;
    setSubmitting(true);
    try {
      const sub = await QuizService.addSubtopic(selectedTopic.id, newName.trim());
      setSubtopics((prev) => [...prev, sub]);
      setSelectedSubtopic(sub);
      setAddSubtopicModalOpen(false);
      setNewName('');
    } catch {
      setError('Failed to add subtopic.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = () => {
    if (!selectedTopic || !selectedSubtopic) {
      setError('Please select a topic and subtopic.');
      return;
    }
    setError('');
    // Pass params via router query
    router.push({
      pathname: '/(app)/quiz-play',
      params: {
        topic: selectedTopic.name,
        topicId: selectedTopic.id,
        subtopic: selectedSubtopic.name,
        subtopicId: selectedSubtopic.id,
        difficulty,
        count: questionCount,
      },
    });
  };

  const filteredTopics = useMemo(
    () => topics.filter((t) => t.name.toLowerCase().includes(topicSearch.toLowerCase())),
    [topics, topicSearch]
  );

  const filteredSubtopics = useMemo(
    () => subtopics.filter((s) => s.name.toLowerCase().includes(subtopicSearch.toLowerCase())),
    [subtopics, subtopicSearch]
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900">MCQ Quiz</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Configure your assessment below
          </Text>
        </View>

        {/* PDF Quiz entry card */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/pdf-quiz' as any)}
          activeOpacity={0.8}
          className="bg-blue-600 rounded-2xl p-4 mb-6 flex-row items-center gap-4"
          style={{ elevation: 3, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8 }}
        >
          <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center">
            <Text style={{ fontSize: 24 }}>📄</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-base">Doc Intelligence</Text>
            <Text className="text-blue-100 text-xs mt-0.5">Upload a PDF and generate an AI quiz</Text>
          </View>
          <Text className="text-white text-xl">›</Text>
        </TouchableOpacity>

        {/* Error */}
        {!!error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        {/* Topic Picker */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Subject
        </Text>
        <TouchableOpacity
          className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-5 flex-row items-center justify-between"
          onPress={() => setTopicModalOpen(true)}
        >
          <Text className={selectedTopic ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {selectedTopic ? selectedTopic.name : 'Select a subject...'}
          </Text>
          {loadingTopics ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text className="text-gray-400 text-lg">›</Text>
          )}
        </TouchableOpacity>

        {/* Subtopic Picker */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Subtopic
        </Text>
        <TouchableOpacity
          className={`bg-white border border-gray-200 rounded-xl px-4 py-4 mb-5 flex-row items-center justify-between ${!selectedTopic ? 'opacity-40' : ''}`}
          onPress={() => selectedTopic && setSubtopicModalOpen(true)}
          disabled={!selectedTopic}
        >
          <Text className={selectedSubtopic ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {selectedSubtopic
              ? selectedSubtopic.name
              : selectedTopic
              ? 'Select a subtopic...'
              : 'Select a subject first'}
          </Text>
          {loadingSubtopics ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Text className="text-gray-400 text-lg">›</Text>
          )}
        </TouchableOpacity>

        {/* Difficulty */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Difficulty
        </Text>
        <View className="flex-row gap-3 mb-5">
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDifficulty(d)}
              className={`flex-1 py-3 rounded-xl items-center border ${
                difficulty === d
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-bold capitalize ${
                  difficulty === d ? 'text-white' : 'text-gray-500'
                }`}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Question Count */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
          Number of Questions
        </Text>
        <View className="flex-row gap-2 mb-8 flex-wrap">
          {QUESTION_COUNTS.map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setQuestionCount(n)}
              className={`w-14 h-14 rounded-xl items-center justify-center border ${
                questionCount === n
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-base font-bold ${
                  questionCount === n ? 'text-white' : 'text-gray-600'
                }`}
              >
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={!selectedTopic || !selectedSubtopic}
          className={`w-full py-4 rounded-xl items-center ${
            selectedTopic && selectedSubtopic ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white font-bold text-base">
            Generate Assessment
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Topic Picker Modal */}
      <PickerModal
        visible={topicModalOpen}
        title="Select Subject"
        items={filteredTopics}
        search={topicSearch}
        onSearch={setTopicSearch}
        onSelect={(item) => {
          setSelectedTopic(item);
          setTopicModalOpen(false);
          setTopicSearch('');
        }}
        onClose={() => { setTopicModalOpen(false); setTopicSearch(''); }}
        onAddNew={() => { setTopicModalOpen(false); setAddTopicModalOpen(true); }}
        selectedId={selectedTopic?.id}
      />

      {/* Subtopic Picker Modal */}
      <PickerModal
        visible={subtopicModalOpen}
        title="Select Subtopic"
        items={filteredSubtopics}
        search={subtopicSearch}
        onSearch={setSubtopicSearch}
        onSelect={(item) => {
          setSelectedSubtopic(item);
          setSubtopicModalOpen(false);
          setSubtopicSearch('');
        }}
        onClose={() => { setSubtopicModalOpen(false); setSubtopicSearch(''); }}
        onAddNew={() => { setSubtopicModalOpen(false); setAddSubtopicModalOpen(true); }}
        selectedId={selectedSubtopic?.id}
      />

      {/* Add Topic Modal */}
      <AddModal
        visible={addTopicModalOpen}
        title="Add New Subject"
        value={newName}
        onChange={setNewName}
        onConfirm={handleAddTopic}
        onClose={() => { setAddTopicModalOpen(false); setNewName(''); }}
        loading={submitting}
        placeholder="e.g. Artificial Intelligence"
      />

      {/* Add Subtopic Modal */}
      <AddModal
        visible={addSubtopicModalOpen}
        title="Add New Subtopic"
        value={newName}
        onChange={setNewName}
        onConfirm={handleAddSubtopic}
        onClose={() => { setAddSubtopicModalOpen(false); setNewName(''); }}
        loading={submitting}
        placeholder="e.g. Machine Learning"
      />
    </SafeAreaView>
  );
}

// ─── Reusable Picker Modal ────────────────────────────────────────────────────
function PickerModal({
  visible, title, items, search, onSearch, onSelect, onClose, onAddNew, selectedId,
}: {
  visible: boolean;
  title: string;
  items: Topic[];
  search: string;
  onSearch: (v: string) => void;
  onSelect: (item: Topic) => void;
  onClose: () => void;
  onAddNew: () => void;
  selectedId?: number;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white">
        {/* Modal Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-blue-600 font-semibold">Done</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="px-5 py-3 border-b border-gray-100">
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-sm"
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={onSearch}
          />
        </View>

        {/* List */}
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-5 py-4 border-b border-gray-50 flex-row items-center justify-between ${
                selectedId === item.id ? 'bg-blue-50' : ''
              }`}
              onPress={() => onSelect(item)}
            >
              <Text
                className={`text-base ${
                  selectedId === item.id
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-800'
                }`}
              >
                {item.name}
              </Text>
              {selectedId === item.id && (
                <Text className="text-blue-600 font-bold">✓</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-400 py-10">No results found</Text>
          }
        />

        {/* Add New */}
        <TouchableOpacity
          className="mx-5 mb-6 mt-3 py-4 bg-gray-50 border border-gray-200 rounded-xl items-center"
          onPress={onAddNew}
        >
          <Text className="text-blue-600 font-semibold">+ Add New</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Add New Modal ────────────────────────────────────────────────────────────
function AddModal({
  visible, title, value, onChange, onConfirm, onClose, loading, placeholder,
}: {
  visible: boolean;
  title: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
  placeholder: string;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/50 justify-center px-6">
        <View className="bg-white rounded-2xl p-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">{title}</Text>
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-sm mb-5"
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={onChange}
            autoFocus
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
              onPress={onClose}
            >
              <Text className="text-gray-600 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl items-center ${
                value.trim() ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onPress={onConfirm}
              disabled={!value.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

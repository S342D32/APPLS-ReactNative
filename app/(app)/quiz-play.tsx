import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { QuizService } from '@/services/quiz';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string; // e.g. "A"
  explanation: string;
};

export default function QuizPlayScreen() {
  const router = useRouter();
  // Read backendUser from Redux store (persisted via redux-persist)
  const backendUser = useAppSelector((state) => state.auth.backendUser);
  const params = useLocalSearchParams<{
    topic: string;
    subtopic: string;
    difficulty: string;
    count: string;
  }>();

  const totalCount = Number(params.count) || 10;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fade animation for question transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    generateInitialBatch();
  }, []);

  // Fetch first batch (max 10 at a time, same as frontend)
  const generateInitialBatch = async () => {
    setLoading(true);
    setError('');
    try {
      const batchSize = Math.min(totalCount, 10);
      const res = await QuizService.generateMCQ({
        topic: params.topic,
        subTopic: params.subtopic,
        numberOfQuestions: batchSize,
        difficulty: params.difficulty,
        previousQuestions: [],
      });
      if (res?.questions?.length) {
        setQuestions(res.questions);
        setSelectedAnswers(new Array(totalCount).fill(null));
      } else {
        setError('No questions returned. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate questions.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch more questions in background when nearing end of current batch
  const fetchMoreIfNeeded = async (index: number) => {
    if (loadingMore || questions.length >= totalCount) return;
    if (index < questions.length - 3) return; // not near end yet

    setLoadingMore(true);
    try {
      const remaining = totalCount - questions.length;
      const res = await QuizService.generateMCQ({
        topic: params.topic,
        subTopic: params.subtopic,
        numberOfQuestions: Math.min(remaining, 10),
        difficulty: params.difficulty,
        previousQuestions: questions.map((q) => q.question),
      });
      if (res?.questions?.length) {
        setQuestions((prev) => [...prev, ...res.questions]);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    callback();
  };

  const handleSelect = (option: string) => {
    const updated = [...selectedAnswers];
    updated[currentIndex] = option;
    setSelectedAnswers(updated);
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      animateTransition(() => setCurrentIndex((i) => i + 1));
      fetchMoreIfNeeded(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      animateTransition(() => setCurrentIndex((i) => i - 1));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Calculate score
      const score = selectedAnswers.reduce((acc, ans, i) => {
        if (!ans || !questions[i]) return acc;
        const letter = ans.includes(')') ? ans.split(')')[0].trim() : ans;
        return letter.toUpperCase() === questions[i].correctAnswer.toUpperCase()
          ? acc + 1
          : acc;
      }, 0);

      // Build history for results screen
      const history = questions.map((q, i) => {
        const ans = selectedAnswers[i];
        const letter = ans?.includes(')') ? ans.split(')')[0].trim() : ans;
        const isCorrect =
          !!letter && letter.toUpperCase() === q.correctAnswer.toUpperCase();
        const correctOption =
          q.options.find((o) => o.startsWith(q.correctAnswer)) ?? q.correctAnswer;
        return {
          question: q.question,
          userAnswer: ans || 'Not answered',
          correctAnswer: correctOption,
          isCorrect,
          explanation: q.explanation,
        };
      });

      // Save attempt to backend using numeric DB user id (not Firebase UID)
      if (backendUser?.id) {
        await QuizService.saveQuizAttempt({
          userId: backendUser.id,
          topic: params.topic,
          subTopic: params.subtopic,
          difficulty: params.difficulty,
          score,
          totalQuestions: questions.length,
          questions: questions.map((q, i) => {
            const ans = selectedAnswers[i];
            const letter = ans?.includes(')') ? ans.split(')')[0].trim() : ans;
            return {
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              userAnswer: ans || 'Not answered',
              isCorrect:
                !!letter &&
                letter.toUpperCase() === q.correctAnswer.toUpperCase(),
            };
          }),
        });
      }

      // Navigate to results
      router.replace({
        pathname: '/(app)/quiz-results',
        params: {
          score: String(score),
          total: String(questions.length),
          topic: params.topic,
          subtopic: params.subtopic,
          history: JSON.stringify(history),
        },
      });
    } catch (e) {
      console.error('Save attempt failed:', e);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-500 mt-4 text-sm">Generating questions...</Text>
      </SafeAreaView>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-xl"
          onPress={generateInitialBatch}
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  // Show loading placeholder if we haven't fetched this question yet
  if (!currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-500 mt-4 text-sm">Loading next question...</Text>
      </SafeAreaView>
    );
  }

  const answeredCount = selectedAnswers.filter((a) => a !== null).length;
  const isLastQuestion = currentIndex === totalCount - 1;
  const allAnswered = answeredCount === questions.length;
  const progress = ((currentIndex + 1) / totalCount) * 100;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Progress Bar */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-gray-700">
            {params.topic} · {params.subtopic}
          </Text>
          <Text className="text-sm font-bold text-blue-600">
            {answeredCount}/{totalCount}
          </Text>
        </View>
        <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-xs text-gray-400 mt-1">
          Question {currentIndex + 1} of {totalCount}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="bg-white rounded-2xl p-5 mt-3 shadow-sm border border-gray-100">
            {/* Badge */}
            <View className="bg-blue-50 self-start px-3 py-1 rounded-lg mb-3">
              <Text className="text-blue-600 text-xs font-bold uppercase tracking-wider">
                Question {currentIndex + 1}
              </Text>
            </View>
            <Text className="text-base font-semibold text-gray-900 leading-relaxed">
              {currentQuestion.question}
            </Text>
          </View>

          {/* Options */}
          <View className="mt-4 gap-3">
            {currentQuestion.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = selectedAnswers[currentIndex] === option;

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelect(option)}
                  className={`flex-row items-center gap-4 p-4 rounded-2xl border-2 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 bg-white'
                  }`}
                  activeOpacity={0.7}
                >
                  {/* Letter Badge */}
                  <View
                    className={`w-9 h-9 rounded-xl items-center justify-center ${
                      isSelected ? 'bg-blue-600' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`font-bold text-sm ${
                        isSelected ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {letter}
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-sm leading-relaxed ${
                      isSelected ? 'text-blue-700 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </Text>
                  {isSelected && (
                    <Text className="text-blue-600 font-bold text-base">✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Navigation Footer */}
      <View className="px-5 pb-6 pt-3 bg-white border-t border-gray-100 flex-row gap-3">
        {/* Previous */}
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentIndex === 0}
          className={`flex-1 py-4 rounded-xl items-center border ${
            currentIndex === 0
              ? 'border-gray-100 bg-gray-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <Text
            className={`font-semibold ${
              currentIndex === 0 ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            ← Prev
          </Text>
        </TouchableOpacity>

        {/* Next or Submit */}
        {isLastQuestion ? (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            className="flex-2 flex-1 py-4 rounded-xl items-center bg-green-600"
            style={{ flex: 2 }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold">Submit Quiz</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            className="flex-1 py-4 rounded-xl items-center bg-blue-600"
            style={{ flex: 2 }}
          >
            {loadingMore && currentIndex >= questions.length - 3 ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold">Next →</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

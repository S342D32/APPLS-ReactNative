import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AIService, PDFQuestion, QuizService } from '@/services/quiz';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AnalyticsService } from '@/services/quiz';
import { setAttempts } from '@/store/slices/analyticsSlice';

type Phase = 'upload' | 'quiz' | 'results';

type PickedFile = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;
type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];

const QUESTION_COUNTS = [5, 10, 15, 20] as const;

export default function PDFQuizScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const backendUser = useAppSelector((s) => s.auth.backendUser);

  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [questions, setQuestions] = useState<PDFQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // ── Pick PDF ──────────────────────────────────────────────────────────────
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setFile({ name: asset.name, uri: asset.uri, mimeType: asset.mimeType, size: asset.size });
      setError(null);
    } catch {
      Alert.alert('Error', 'Could not pick file');
    }
  };

  // ── Upload & generate questions ───────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return setError('Please select a PDF file first');
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/pdf' } as any);
      formData.append('numQuestions', String(Math.min(numQuestions, 10)));
      formData.append('difficulty', difficulty);

      const response = await AIService.processPDF(formData);
      if (!response?.questions?.length) throw new Error('No questions returned');

      setQuestions(response.questions);
      setAnswers({});
      setCurrentIndex(0);
      setPhase('quiz');
    } catch (e: any) {
      setError(e.message || 'Failed to process PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Answer selection ──────────────────────────────────────────────────────
  const selectAnswer = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  // ── Submit quiz ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      return Alert.alert('Incomplete', `Please answer all questions (${unanswered} remaining)`);
    }

    setIsSubmitting(true);
    try {
      let correct = 0;
      const gradedQuestions = questions.map((q, i) => {
        const isCorrect = answers[i] === q.correctAnswer ||
          answers[i]?.split(')')[0].trim() === q.correctAnswer;
        if (isCorrect) correct++;
        return { ...q, userAnswer: answers[i], isCorrect };
      });

      const finalScore = Math.round((correct / questions.length) * 100);
      setScore(finalScore);
      setPhase('results');

      // Save to backend
      if (backendUser?.id) {
        try {
          await QuizService.saveQuizAttempt({
            userId: backendUser.id,
            topic: 'PDF Upload Quiz',
            subTopic: file?.name ?? 'Unknown PDF',
            questions: gradedQuestions,
            score: correct,
            totalQuestions: questions.length,
            difficulty,
            status: 'completed',
          });
          // Refresh Redux analytics
          const response = await AnalyticsService.getQuizAttempts(String(backendUser.id));
          dispatch(setAttempts(response.quizAttempts || []));
        } catch { /* non-blocking */ }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setPhase('upload');
    setFile(null);
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setScore(0);
    setError(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === 'upload') return <UploadPhase {...{ file, numQuestions, difficulty, isLoading, error, pickFile, setNumQuestions, setDifficulty, handleUpload }} />;
  if (phase === 'quiz') return <QuizPhase {...{ questions, currentIndex, answers, isSubmitting, setCurrentIndex, selectAnswer, handleSubmit }} />;
  return <ResultsPhase score={score} total={questions.length} questions={questions} answers={answers} fileName={file?.name} onReset={resetAll} onHome={() => router.replace('/(app)/(tabs)' as any)} />;
}

// ── Upload Phase ─────────────────────────────────────────────────────────────
function UploadPhase({ file, numQuestions, difficulty, isLoading, error, pickFile, setNumQuestions, setDifficulty, handleUpload }: any) {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* Hero */}
      <View className="rounded-2xl overflow-hidden mb-6" style={{ backgroundColor: '#2563eb' }}>
        <View className="p-6 items-center">
          <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mb-3">
            <Text style={{ fontSize: 28 }}>📄</Text>
          </View>
          <Text className="text-white text-2xl font-black">Doc Intelligence</Text>
          <Text className="text-blue-100 text-sm text-center mt-1">
            Upload a document and generate an AI-powered assessment
          </Text>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex-row items-center gap-2">
          <Text className="text-red-500 text-base">⚠️</Text>
          <Text className="text-red-600 text-sm flex-1">{error}</Text>
        </View>
      )}

      {/* File picker */}
      <Text className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Document Source</Text>
      <TouchableOpacity
        onPress={pickFile}
        className={`border-2 border-dashed rounded-2xl p-6 items-center mb-6 ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
        activeOpacity={0.7}
      >
        {file ? (
          <View className="items-center gap-2">
            <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center">
              <Text style={{ fontSize: 24 }}>✅</Text>
            </View>
            <Text className="text-gray-800 font-bold text-sm text-center" numberOfLines={2}>{file.name}</Text>
            <Text className="text-blue-500 text-xs font-semibold">
              {file.size ? `${(file.size / 1024).toFixed(0)} KB` : ''} · Tap to change
            </Text>
          </View>
        ) : (
          <View className="items-center gap-2">
            <Text style={{ fontSize: 36 }}>📂</Text>
            <Text className="text-gray-500 font-semibold text-sm">Select Document</Text>
            <Text className="text-gray-400 text-xs">PDF · DOCX · TXT · Max 10MB</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Question count */}
      <Text className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Number of Questions</Text>
      <View className="flex-row gap-2 mb-6">
        {[5, 10, 15, 20].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setNumQuestions(n)}
            className={`flex-1 py-3 rounded-xl items-center border-2 ${numQuestions === n ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'}`}
          >
            <Text className={`font-bold text-sm ${numQuestions === n ? 'text-white' : 'text-gray-500'}`}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Difficulty */}
      <Text className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Difficulty</Text>
      <View className="flex-row bg-gray-100 rounded-xl p-1 mb-8">
        {(['easy', 'medium', 'hard'] as const).map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDifficulty(d)}
            className={`flex-1 py-2.5 rounded-lg items-center ${difficulty === d ? 'bg-blue-600' : ''}`}
          >
            <Text className={`text-xs font-black uppercase tracking-wider ${difficulty === d ? 'text-white' : 'text-gray-400'}`}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Generate button */}
      <TouchableOpacity
        onPress={handleUpload}
        disabled={isLoading || !file}
        className={`py-4 rounded-2xl items-center flex-row justify-center gap-2 ${isLoading || !file ? 'bg-gray-300' : 'bg-blue-600'}`}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <>
            <ActivityIndicator color="white" size="small" />
            <Text className="text-white font-bold text-base">Extracting Intelligence...</Text>
          </>
        ) : (
          <Text className="text-white font-bold text-base">Generate Assessment →</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Quiz Phase ────────────────────────────────────────────────────────────────
function QuizPhase({ questions, currentIndex, answers, isSubmitting, setCurrentIndex, selectAnswer, handleSubmit }: any) {
  const q: PDFQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === questions.length - 1;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Progress */}
      <View className="bg-white px-5 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm font-semibold text-gray-600">
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <Text className={`text-sm font-bold ${answeredCount === questions.length ? 'text-green-600' : 'text-blue-600'}`}>
            {answeredCount}/{questions.length} answered
          </Text>
        </View>
        <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <View className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Question card */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 }}>
          <View className="bg-blue-50 self-start px-3 py-1 rounded-lg mb-3">
            <Text className="text-blue-600 text-xs font-black uppercase tracking-wider">
              Knowledge Extraction {currentIndex + 1}
            </Text>
          </View>
          <Text className="text-gray-900 text-base font-semibold leading-relaxed">{q.question}</Text>
        </View>

        {/* Options */}
        <View className="gap-3">
          {q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = answers[currentIndex] === opt;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => selectAnswer(opt)}
                activeOpacity={0.7}
                className={`flex-row items-center gap-4 p-4 rounded-2xl border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}
              >
                <View className={`w-9 h-9 rounded-xl items-center justify-center ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}`}>
                  <Text className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-500'}`}>{letter}</Text>
                </View>
                <Text className={`flex-1 text-sm leading-relaxed ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>{opt}</Text>
                {isSelected && <Text className="text-blue-600 font-bold">✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View className="flex-row gap-3 px-5 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={() => setCurrentIndex((i: number) => i - 1)}
          disabled={currentIndex === 0}
          className={`flex-1 py-4 rounded-xl items-center border ${currentIndex === 0 ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'}`}
        >
          <Text className={`font-semibold ${currentIndex === 0 ? 'text-gray-300' : 'text-gray-600'}`}>← Prev</Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 rounded-xl items-center justify-center py-4"
            style={{ flex: 2 }}
          >
            {isSubmitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Complete ✓</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setCurrentIndex((i: number) => i + 1)}
            className="bg-blue-600 rounded-xl items-center py-4"
            style={{ flex: 2 }}
          >
            <Text className="text-white font-bold">Continue →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Results Phase ─────────────────────────────────────────────────────────────
function ResultsPhase({ score, total, questions, answers, fileName, onReset, onHome }: any) {
  const correct = questions.filter((q: PDFQuestion, i: number) => answers[i] === q.correctAnswer || answers[i]?.split(')')[0].trim() === q.correctAnswer).length;
  const passed = score >= 70;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Score hero */}
      <View className={`px-6 pt-10 pb-8 items-center ${passed ? 'bg-green-600' : 'bg-blue-600'}`}>
        <View className="w-28 h-28 rounded-full bg-white/20 items-center justify-center mb-4 border-2 border-white/30">
          <Text className="text-4xl font-black text-white">{score}%</Text>
          <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">Score</Text>
        </View>
        <Text className="text-2xl font-black text-white mb-1">
          {passed ? 'Intelligence Mastery! 🎉' : 'Session Complete'}
        </Text>
        <Text className="text-white/80 text-sm text-center">
          {correct} of {total} correct · {fileName}
        </Text>

        {/* Stats row */}
        <View className="flex-row gap-3 mt-5">
          {[
            { label: 'Correct', value: String(correct) },
            { label: 'Wrong', value: String(total - correct) },
            { label: 'Accuracy', value: `${score}%` },
          ].map((s) => (
            <View key={s.label} className="bg-white/20 rounded-xl px-4 py-2 items-center min-w-16">
              <Text className="text-white font-black text-base">{s.value}</Text>
              <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Question review */}
      <View className="px-5 pt-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">Question Review</Text>
        <View className="gap-4">
          {questions.map((q: PDFQuestion, i: number) => {
            const userAns = answers[i];
            const isCorrect = userAns === q.correctAnswer || userAns?.split(')')[0].trim() === q.correctAnswer;
            return (
              <View key={i} className={`bg-white rounded-2xl p-4 border-2 ${isCorrect ? 'border-green-100' : 'border-red-100'}`}>
                <View className="flex-row items-center gap-2 mb-2">
                  <View className={`w-7 h-7 rounded-lg items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    <Text className="text-white text-xs font-bold">{i + 1}</Text>
                  </View>
                  <Text className={`text-xs font-bold uppercase tracking-wider ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900 mb-3 leading-relaxed">{q.question}</Text>

                <View className="gap-2 mb-2">
                  <View className="bg-gray-50 rounded-xl px-3 py-2">
                    <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Your Answer</Text>
                    <Text className={`text-sm font-semibold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{userAns || 'Not answered'}</Text>
                  </View>
                  {!isCorrect && (
                    <View className="bg-green-50 rounded-xl px-3 py-2">
                      <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Correct Answer</Text>
                      <Text className="text-sm font-semibold text-green-600">
                        {q.options.find((o) => o.startsWith(q.correctAnswer)) ?? q.correctAnswer}
                      </Text>
                    </View>
                  )}
                </View>

                {q.explanation && (
                  <View className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                    <Text className="text-xs text-blue-600 font-bold mb-0.5">Explanation</Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">{q.explanation}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <View className="px-5 mt-8 gap-3">
        <TouchableOpacity onPress={onReset} className="bg-blue-600 py-4 rounded-2xl items-center">
          <Text className="text-white font-bold text-base">📄 New Document</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onHome} className="bg-white border border-gray-200 py-4 rounded-2xl items-center">
          <Text className="text-gray-700 font-semibold">Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

import { useAppSelector } from '@/store/hooks';
import type { QuizQuestion } from '@/store/slices/analyticsSlice';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function AttemptDetailScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const attempt = useAppSelector((s) =>
    s.analytics.attempts.find((a) => String(a.id) === String(attemptId))
  );

  if (!attempt) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-500 text-center">Attempt not found.</Text>
      </View>
    );
  }

  const totalQ = attempt.total_questions || attempt.totalQuestions || 0;
  const scorePct = totalQ > 0 ? Math.round(((attempt.score || 0) / totalQ) * 100) : 0;
  const dateStr = new Date(
    attempt.start_time ?? attempt.created_at ?? attempt.createdAt ?? 0
  ).toLocaleString();

  const scoreColor =
    scorePct >= 70 ? 'text-green-600' : scorePct >= 40 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg =
    scorePct >= 70 ? 'bg-green-50 border-green-100' : scorePct >= 40 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100';

  const questions: QuizQuestion[] = attempt.questions ?? [];

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Header summary card */}
      <View className={`rounded-2xl p-4 border mb-5 ${scoreBg}`}>
        <Text className="text-gray-800 text-lg font-bold" numberOfLines={1}>
          {attempt.topic ?? 'Unknown Topic'}
        </Text>
        {(attempt.sub_topic || attempt.subTopic) && (
          <Text className="text-gray-500 text-sm mt-0.5">
            {attempt.sub_topic || attempt.subTopic}
          </Text>
        )}
        <View className="flex-row items-center justify-between mt-3">
          <Text className={`text-2xl font-bold ${scoreColor}`}>
            {attempt.score}/{totalQ}
            <Text className="text-base font-semibold"> ({scorePct}%)</Text>
          </Text>
          <Text className="text-gray-400 text-xs">{dateStr}</Text>
        </View>
      </View>

      {/* Questions breakdown */}
      {questions.length === 0 ? (
        <View className="p-8 items-center border border-gray-100 rounded-2xl">
          <Text className="text-gray-400 text-center">
            No question details available for this attempt.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          <Text className="text-gray-700 font-semibold text-sm mb-1">
            Questions ({questions.length})
          </Text>
          {questions.map((q, i) => (
            <QuestionCard key={i} index={i} question={q} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function QuestionCard({ index, question }: { index: number; question: QuizQuestion }) {
  const isCorrect = question.isCorrect;
  const borderColor = isCorrect ? 'border-green-200' : 'border-red-200';
  const badgeBg = isCorrect ? 'bg-green-100' : 'bg-red-100';
  const badgeText = isCorrect ? 'text-green-700' : 'text-red-700';

  return (
    <View
      className={`bg-white rounded-2xl p-4 border ${borderColor}`}
      style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
    >
      {/* Question header */}
      <View className="flex-row items-start justify-between mb-2 gap-2">
        <Text className="text-gray-800 font-medium flex-1 text-sm leading-5">
          {index + 1}. {question.question ?? 'N/A'}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${badgeBg}`}>
          <Text className={`text-xs font-semibold ${badgeText}`}>
            {isCorrect ? '✓ Correct' : '✗ Wrong'}
          </Text>
        </View>
      </View>

      {/* Options */}
      {question.options && question.options.length > 0 && (
        <View className="gap-1 mt-1">
          {question.options.map((opt, oi) => {
            const optLetter = opt.split(')')[0].trim();
            const isUserAnswer =
              question.userAnswer?.startsWith(optLetter) ||
              question.userAnswer === opt;
            const isCorrectAnswer =
              question.correctAnswer === optLetter ||
              question.correctAnswer === opt;

            const optBg = isCorrectAnswer
              ? 'bg-green-50 border-green-300'
              : isUserAnswer && !isCorrectAnswer
              ? 'bg-red-50 border-red-300'
              : 'border-gray-100';

            return (
              <View
                key={oi}
                className={`flex-row items-center px-3 py-2 rounded-xl border ${optBg}`}
              >
                <Text className="text-gray-700 text-xs flex-1">{opt}</Text>
                {isCorrectAnswer && (
                  <Text className="text-green-600 text-xs font-bold ml-1">✓</Text>
                )}
                {isUserAnswer && !isCorrectAnswer && (
                  <Text className="text-red-500 text-xs font-bold ml-1">✗</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Explanation */}
      {question.explanation && (
        <View className="mt-3 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
          <Text className="text-blue-700 text-xs leading-4">
            <Text className="font-semibold">Explanation: </Text>
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
}

import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

type HistoryItem = {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
};

export default function QuizResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score: string;
    total: string;
    topic: string;
    subtopic: string;
    history: string;
  }>();

  const score = Number(params.score);
  const total = Number(params.total);
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 70;
  const history: HistoryItem[] = params.history ? JSON.parse(params.history) : [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Hero */}
        <View
          className={`px-6 pt-12 pb-10 items-center ${
            passed ? 'bg-green-600' : 'bg-blue-600'
          }`}
        >
          {/* Score Circle */}
          <View className="w-28 h-28 rounded-full bg-white/20 items-center justify-center mb-4 border-2 border-white/30">
            <Text className="text-4xl font-black text-white">{percentage}%</Text>
            <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">
              Score
            </Text>
          </View>

          <Text className="text-2xl font-black text-white mb-1">
            {passed ? 'Great Work! 🎉' : 'Assessment Done'}
          </Text>
          <Text className="text-white/80 text-sm text-center">
            {score} out of {total} correct on {params.topic}
          </Text>

          {/* Stats Row */}
          <View className="flex-row gap-4 mt-6">
            <StatBadge label="Correct" value={String(score)} color="bg-white/20" />
            <StatBadge label="Wrong" value={String(total - score)} color="bg-white/20" />
            <StatBadge label="Topic" value={params.subtopic} color="bg-white/20" />
          </View>
        </View>

        {/* Review Section */}
        <View className="px-5 pt-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Question Review
          </Text>

          <View className="gap-4">
            {history.map((item, idx) => (
              <View
                key={idx}
                className={`bg-white rounded-2xl p-4 border-2 ${
                  item.isCorrect ? 'border-green-100' : 'border-red-100'
                }`}
              >
                {/* Question number + status */}
                <View className="flex-row items-center gap-2 mb-3">
                  <View
                    className={`w-7 h-7 rounded-lg items-center justify-center ${
                      item.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    <Text className="text-white text-xs font-bold">{idx + 1}</Text>
                  </View>
                  <Text
                    className={`text-xs font-bold uppercase tracking-wider ${
                      item.isCorrect ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {item.isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>

                {/* Question text */}
                <Text className="text-sm font-semibold text-gray-900 mb-3 leading-relaxed">
                  {item.question}
                </Text>

                {/* Answers */}
                <View className="gap-2 mb-3">
                  <View className="bg-gray-50 rounded-xl px-3 py-2">
                    <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                      Your Answer
                    </Text>
                    <Text
                      className={`text-sm font-semibold ${
                        item.isCorrect ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {item.userAnswer}
                    </Text>
                  </View>

                  {/* Only show correct answer if wrong */}
                  {!item.isCorrect && (
                    <View className="bg-green-50 rounded-xl px-3 py-2">
                      <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                        Correct Answer
                      </Text>
                      <Text className="text-sm font-semibold text-green-600">
                        {item.correctAnswer}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Explanation */}
                <View className="bg-blue-50 rounded-xl px-3 py-2">
                  <Text className="text-xs text-blue-600 font-bold mb-0.5">
                    Explanation
                  </Text>
                  <Text className="text-sm text-gray-700 leading-relaxed">
                    {item.explanation}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View className="px-5 mt-8 gap-3">
          <TouchableOpacity
            className="bg-blue-600 py-4 rounded-xl items-center"
            onPress={() => router.replace('/(app)/(tabs)/quiz')}
          >
            <Text className="text-white font-bold text-base">New Assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border border-gray-200 py-4 rounded-xl items-center"
            onPress={() => router.replace('/(app)/(tabs)')}
          >
            <Text className="text-gray-700 font-semibold">Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Small stat badge used in the hero section
function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className={`${color} rounded-xl px-4 py-2 items-center min-w-16`}>
      <Text className="text-white font-black text-base">{value}</Text>
      <Text className="text-white/70 text-xs font-bold uppercase tracking-wider">
        {label}
      </Text>
    </View>
  );
}

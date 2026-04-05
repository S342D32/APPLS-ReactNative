import { AnalyticsService } from "@/services/quiz";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeAttempt, selectQuizStats, setAttempts } from "@/store/slices/analyticsSlice";
import type { QuizAttempt } from "@/store/slices/analyticsSlice";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// QuizAttempt type is now imported from the slice

const chartColors = {
  line: "#3b82f6",
  bar: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

// Simple horizontal bar chart rendered with RN Views
function BarChart({ data }: { data: { name: string; avgScore: number; attempts: number }[] }) {
  if (!data.length) return null;
  return (
    <View className="gap-2">
      {data.map((item) => {
        const color =
          item.avgScore >= 70
            ? chartColors.success
            : item.avgScore >= 40
            ? chartColors.warning
            : chartColors.danger;
        return (
          <View key={item.name} className="gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-gray-600">{item.avgScore}%</Text>
            </View>
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <View
                style={{ width: `${item.avgScore}%`, backgroundColor: color }}
                className="h-full rounded-full"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Simple line-style score progression as dots + connecting bars
function LineChart({ data }: { data: { name: string; score: number; date: string }[] }) {
  if (!data.length) return null;
  const max = 100;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row items-end gap-2 h-32 px-1">
        {data.map((item, i) => {
          const heightPct = (item.score / max) * 100;
          const color =
            item.score >= 70
              ? chartColors.success
              : item.score >= 40
              ? chartColors.warning
              : chartColors.danger;
          return (
            <View key={i} className="items-center gap-1" style={{ width: 44 }}>
              <Text className="text-xs text-gray-500">{item.score}%</Text>
              <View className="w-full items-center justify-end" style={{ height: 80 }}>
                <View
                  style={{ height: `${heightPct}%`, backgroundColor: color, width: 12 }}
                  className="rounded-t-full"
                />
              </View>
              <Text className="text-xs text-gray-400" numberOfLines={1}>
                {item.name.replace("Attempt ", "#")}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { backendUser, jwtToken } = useAppSelector((s) => s.auth);
  const quizAttempts = useAppSelector((s) => s.analytics.attempts);
  const stats = useAppSelector(selectQuizStats);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [filterTopic, setFilterTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    fetchQuizAttempts();
  }, []);

  useEffect(() => {
    if (quizAttempts.length) {
      const unique = [...new Set(quizAttempts.map((a) => a.topic ?? ""))].filter(Boolean);
      setTopics(unique);
    }
  }, [quizAttempts]);

  const fetchQuizAttempts = async () => {
    setIsLoading(true);
    setAuthError(false);
    setError(null);
    try {
      const currentUserId = String(backendUser?.id ?? "");
      if (!currentUserId || !jwtToken) {
        setError("User not authenticated");
        setAuthError(true);
        return;
      }
      const response = await AnalyticsService.getQuizAttempts(currentUserId);
      dispatch(setAttempts(response.quizAttempts || []));
    } catch (err: any) {
      const status = err.response?.status || err.status;
      if (status === 401 || status === 403) {
        setAuthError(true);
        setError("Authentication required. Please log in to view your quiz attempts.");
      } else {
        setError("Failed to load quiz data. Please try again later.");
      }
      dispatch(setAttempts([]));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttempt = (attemptId: string) => {
    Alert.alert(
      "Delete Attempt",
      "Are you sure you want to delete this quiz attempt? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AnalyticsService.deleteQuizAttempt(attemptId);
              dispatch(removeAttempt(attemptId));
            } catch (err: any) {
              const status = err.response?.status || err.status;
              if (status === 401 || status === 403) {
                setAuthError(true);
                setError("Authentication required.");
              } else {
                setError("Failed to delete quiz attempt. Please try again.");
              }
            }
          },
        },
      ]
    );
  };

  // Stats derived from Redux via selector (no local calculateStats needed)

  // Chart data
  const getChartData = () => {
    if (!quizAttempts.length) return { progressData: [], topicData: [] };

    const progressData = [...quizAttempts]
      .sort(
        (a, b) =>
          new Date(a.start_time ?? a.created_at ?? 0).getTime() -
          new Date(b.start_time ?? b.created_at ?? 0).getTime()
      )
      .map((attempt, index) => {
        const totalQ = attempt.total_questions || attempt.totalQuestions || 1;
        const scorePct = Math.round(((attempt.score || 0) / totalQ) * 100);
        return {
          name: `Attempt ${index + 1}`,
          score: scorePct,
          date: new Date(attempt.start_time ?? attempt.created_at ?? 0).toLocaleDateString(),
          topic: attempt.topic,
        };
      });

    const topicScores: Record<string, { total: number; sum: number }> = {};
    quizAttempts.forEach((attempt) => {
      const key = attempt.topic ?? "Unknown";
      const totalQ = attempt.total_questions || attempt.totalQuestions || 1;
      const scorePct = (attempt.score || 0) / totalQ;
      if (!topicScores[key]) topicScores[key] = { total: 0, sum: 0 };
      topicScores[key].total += 1;
      topicScores[key].sum += scorePct;
    });

    const topicData = Object.keys(topicScores).map((topic) => ({
      name: topic,
      avgScore: Math.round((topicScores[topic].sum / topicScores[topic].total) * 100),
      attempts: topicScores[topic].total,
    }));

    return { progressData, topicData };
  };

  const filteredAttempts = filterTopic
    ? quizAttempts.filter((a) => a.topic === filterTopic)
    : quizAttempts;

  const { progressData, topicData } = getChartData();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-3">Loading quiz data...</Text>
      </View>
    );
  }

  if (authError) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-600 text-center mb-4">
          You need to be logged in to view your quiz attempts.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login" as any)}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text className="text-gray-800 text-2xl font-bold mb-5">Quiz Analytics</Text>

      {/* Stats Cards */}
      {stats && (
        <View className="flex-row flex-wrap gap-3 mb-6">
          <StatCard label="Total Attempts" value={String(stats.totalAttempts)} color="blue" />
          <StatCard label="Questions" value={String(stats.totalQuestions)} color="green" />
          <StatCard label="Correct" value={String(stats.totalCorrect)} color="yellow" />
          <StatCard label="Avg Score" value={`${stats.averageScore}%`} color="purple" />
        </View>
      )}

      {/* Score Progression Chart */}
      {progressData.length > 0 && (
        <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-2 h-2 rounded-full bg-blue-500" />
            <Text className="text-gray-800 font-semibold">Score Progression (%)</Text>
          </View>
          <LineChart data={progressData} />
        </View>
      )}

      {/* Topic Performance Chart */}
      {topicData.length > 0 && (
        <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-2 h-2 rounded-full bg-purple-500" />
            <Text className="text-gray-800 font-semibold">Performance by Topic (%)</Text>
          </View>
          <BarChart data={topicData} />
        </View>
      )}

      {/* Topic Filter */}
      {topics.length > 0 && (
        <View className="mb-4">
          <Text className="text-gray-700 text-sm font-medium mb-2">Filter by Topic</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setFilterTopic("")}
                className={`px-4 py-2 rounded-full border ${
                  filterTopic === "" ? "bg-blue-600 border-blue-600" : "border-gray-300"
                }`}
              >
                <Text className={filterTopic === "" ? "text-white font-semibold" : "text-gray-500"}>
                  All
                </Text>
              </TouchableOpacity>
              {topics.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setFilterTopic(t)}
                  className={`px-4 py-2 rounded-full border ${
                    filterTopic === t ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  }`}
                >
                  <Text className={filterTopic === t ? "text-white font-semibold" : "text-gray-500"}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Error Banner */}
      {error && !authError && (
        <View className="bg-red-100 border border-red-400 rounded-xl px-4 py-3 mb-4">
          <Text className="text-red-700">
            <Text className="font-bold">Error! </Text>
            {error}
          </Text>
        </View>
      )}

      {/* Attempts List */}
      {filteredAttempts.length === 0 ? (
        <View className="p-8 items-center border border-gray-100 rounded-2xl">
          <Text className="text-gray-500 text-center">
            No quiz attempts found. Take some quizzes to see your analytics!
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {filteredAttempts.map((attempt, i) => {
            const totalQ = attempt.total_questions || attempt.totalQuestions || 1;
            const scorePct = (attempt.score || 0) / totalQ;
            const badgeColor =
              scorePct >= 0.7
                ? "bg-green-100 text-green-800"
                : scorePct >= 0.4
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800";
            const dateStr = new Date(
              attempt.start_time ?? attempt.created_at ?? attempt.createdAt ?? 0
            ).toLocaleDateString();

            return (
              <View
                key={attempt.id ?? i}
                className="bg-white rounded-2xl p-4 border border-gray-100"
                style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="text-gray-800 font-semibold" numberOfLines={1}>
                      {attempt.topic ?? "Unknown Topic"}
                    </Text>
                    {(attempt.sub_topic || attempt.subTopic) && (
                      <Text className="text-gray-500 text-xs mt-0.5">
                        {attempt.sub_topic || attempt.subTopic}
                      </Text>
                    )}
                  </View>
                  <View className={`px-2 py-1 rounded-full ${badgeColor.split(" ")[0]}`}>
                    <Text className={`text-xs font-semibold ${badgeColor.split(" ")[1]}`}>
                      {attempt.score}/{totalQ} ({Math.round(scorePct * 100)}%)
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400 text-xs">{dateStr}</Text>
                  {attempt.id && (
                    <TouchableOpacity onPress={() => handleDeleteAttempt(attempt.id!)}>
                      <Text className="text-red-400 text-xs font-medium">Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    yellow: "bg-yellow-50 border-yellow-100",
    purple: "bg-purple-50 border-purple-100",
  };
  const text: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    purple: "text-purple-600",
  };
  return (
    <View className={`flex-1 min-w-[44%] ${bg[color]} border rounded-2xl p-4 items-center`}>
      <Text className={`text-xs ${text[color]} font-medium text-center`}>{label}</Text>
      <Text className="text-gray-800 text-xl font-bold mt-1">{value}</Text>
    </View>
  );
}

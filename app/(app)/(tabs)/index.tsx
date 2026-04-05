import { View, Text, ScrollView } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { selectQuizStats } from '@/store/slices/analyticsSlice';

export default function DashboardScreen() {
  const backendUser = useAppSelector((s) => s.auth.backendUser);
  const stats = useAppSelector(selectQuizStats);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome banner */}
        <View className="bg-blue-600 rounded-2xl p-5 mb-5">
          <Text className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">
            Welcome back
          </Text>
          <Text className="text-white text-xl font-bold">
            {backendUser?.name ?? backendUser?.email} 👋
          </Text>
          <Text className="text-blue-200 text-sm mt-1">
            Ready to learn something new today?
          </Text>
        </View>

        {/* Quick stats row */}
        <View className="flex-row gap-3 mb-5">
          <StatCard label="Quizzes" value={stats ? String(stats.totalAttempts) : '—'} icon="✎" />
          <StatCard label="Score Avg" value={stats ? `${stats.averageScore}%` : '—'} icon="🎯" />
          <StatCard label="Correct" value={stats ? String(stats.totalCorrect) : '—'} icon="🔥" />
        </View>

        {/* Account info card */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Account
          </Text>
          <InfoRow label="Name" value={backendUser?.name ?? '—'} />
          <InfoRow label="Email" value={backendUser?.email ?? '—'} />
          <InfoRow label="ID" value={String(backendUser?.id ?? '—')} last />
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center border border-gray-100">
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text className="text-lg font-black text-gray-900 mt-1">{value}</Text>
      <Text className="text-xs text-gray-400 font-semibold mt-0.5">{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between py-3 ${!last ? 'border-b border-gray-50' : ''}`}>
      <Text className="text-sm text-gray-400 font-medium">{label}</Text>
      <Text className="text-sm text-gray-800 font-semibold" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

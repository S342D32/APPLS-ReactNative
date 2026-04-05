import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Decorative background circles */}
      <View style={styles.circleLarge} />
      <View style={styles.circleSmall} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="compass-outline" size={56} color="#2563eb" />
        </View>

        {/* 404 */}
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The screen you're looking for doesn't exist or may have been moved.
        </Text>

        {/* Actions */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(app)/(tabs)')}>
          <Ionicons name="home-outline" size={18} color="#fff" style={styles.btnIcon} />
          <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={18} color="#2563eb" style={styles.btnIcon} />
          <Text style={styles.secondaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },

  // Decorative blobs
  circleLarge: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#eff6ff',
    top: -80,
    right: -80,
  },
  circleSmall: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#dbeafe',
    bottom: 60,
    left: -60,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  code: {
    fontSize: 80,
    fontWeight: '900',
    color: '#2563eb',
    letterSpacing: -4,
    lineHeight: 88,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryBtnText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },

  btnIcon: {
    marginRight: 8,
  },
});

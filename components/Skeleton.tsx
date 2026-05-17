import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

// Single shimmer box — animates opacity to simulate a shimmer pulse
export function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius,
          backgroundColor: '#e5e7eb',
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

// ── Analytics skeleton ────────────────────────────────────────────────────────
export function AnalyticsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Title */}
      <SkeletonBox width={160} height={28} borderRadius={8} style={{ marginBottom: 20 }} />

      {/* Stat cards row */}
      <View style={styles.row}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <SkeletonBox width={60} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonBox width={40} height={22} borderRadius={6} />
          </View>
        ))}
      </View>

      {/* Chart block */}
      <SkeletonBox height={140} borderRadius={16} style={{ marginBottom: 12 }} />
      <SkeletonBox height={120} borderRadius={16} style={{ marginBottom: 20 }} />

      {/* Filter pills */}
      <View style={[styles.row, { marginBottom: 16 }]}>
        {[80, 100, 90].map((w, i) => (
          <SkeletonBox key={i} width={w} height={32} borderRadius={20} style={{ marginRight: 8 }} />
        ))}
      </View>

      {/* Attempt cards */}
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.attemptCard}>
          <View style={styles.attemptTop}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <SkeletonBox width="70%" height={14} borderRadius={6} style={{ marginBottom: 6 }} />
              <SkeletonBox width="45%" height={11} borderRadius={6} />
            </View>
            <SkeletonBox width={64} height={26} borderRadius={20} />
          </View>
          <View style={styles.attemptBottom}>
            <SkeletonBox width={80} height={11} borderRadius={6} />
            <SkeletonBox width={48} height={11} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Chat conversation list skeleton ──────────────────────────────────────────
export function ChatListSkeleton() {
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <SkeletonBox height={42} borderRadius={12} style={{ margin: 12 }} />

      {/* Online strip */}
      <View style={[styles.row, { paddingHorizontal: 16, marginBottom: 16 }]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ alignItems: 'center', marginRight: 16 }}>
            <SkeletonBox width={40} height={40} borderRadius={20} style={{ marginBottom: 6 }} />
            <SkeletonBox width={32} height={10} borderRadius={6} />
          </View>
        ))}
      </View>

      {/* Conversation rows */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.convRow}>
          <SkeletonBox width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 6 }]}>
              <SkeletonBox width="55%" height={14} borderRadius={6} />
              <SkeletonBox width={32} height={11} borderRadius={6} />
            </View>
            <SkeletonBox width="75%" height={11} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Chat messages skeleton ────────────────────────────────────────────────────
export function ChatMessagesSkeleton() {
  // Alternating own / other bubbles
  const bubbles = [
    { own: false, width: '65%' },
    { own: true,  width: '50%' },
    { own: false, width: '75%' },
    { own: false, width: '45%' },
    { own: true,  width: '60%' },
    { own: true,  width: '40%' },
    { own: false, width: '70%' },
  ] as const;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {bubbles.map((b, i) => (
        <View
          key={i}
          style={[
            styles.bubbleRow,
            b.own ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
          ]}
        >
          <SkeletonBox
            width={b.width as any}
            height={38}
            borderRadius={18}
            style={{
              borderBottomRightRadius: b.own ? 4 : 18,
              borderBottomLeftRadius: b.own ? 18 : 4,
            }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    margin: 4,
  },
  attemptCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  attemptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  attemptBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bubbleRow: { marginBottom: 10, flexDirection: 'row' },
});

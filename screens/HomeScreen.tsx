import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, GRADIENTS, GLASS, SPACING, RADIUS, geniusScoreColor } from '../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GENIUS_SCORE = 74;
const RING_SIZE = 160;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const COMPANION_MESSAGES = [
  'Your tomatoes are loving this sun ☀️ — check for first fruit in 3 days!',
  'Soil moisture is perfect in Bed 2 🌱 — no watering needed today.',
  'Watch for aphids on your pepper leaves — early intervention is easiest 🐛',
  'Your herbs are thriving! Trim basil to encourage bushy growth 🌿',
  'Morning is the best time to water — reduces fungal risk by 40% 💧',
];

interface Particle {
  x: number;
  anim: Animated.Value;
  size: number;
  color: string;
  duration: number;
}

function useParticles(): Particle[] {
  const particles = useRef<Particle[]>(
    Array.from({ length: 10 }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      anim: new Animated.Value(0),
      size: 4 + Math.random() * 6,
      color: Math.random() > 0.5 ? COLORS.springLeaf : COLORS.sunflower,
      duration: 15000 + Math.random() * 10000,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.anim, {
            toValue: 1,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [particles]);

  return particles;
}

function BubbleParticles() {
  const particles = useParticles();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [SCREEN_HEIGHT + 20, -20],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.1, 0.85, 1],
          outputRange: [0, 0.12, 0.08, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              transform: [{ translateY }],
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}

function ScoreRing({ score }: { score: number }) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    animatedValue.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });
    return () => animatedValue.removeAllListeners();
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, CIRCUMFERENCE - (CIRCUMFERENCE * score) / 100],
  });

  const scoreColor = geniusScoreColor(score);
  const stateLabel =
    score >= 90 ? 'THRIVING' : score >= 70 ? 'HEALTHY' : score >= 50 ? 'NEEDS CARE' : 'STRESSED';

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={{ alignItems: 'center', marginVertical: SPACING.lg }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={COLORS.surface2}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={scoreColor}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 42, fontWeight: 'bold', color: COLORS.white }}>{displayScore}</Text>
        <Text style={{ fontSize: 9, color: COLORS.textMuted, letterSpacing: 2, marginTop: 2 }}>
          GARDEN VITALITY
        </Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '700', color: scoreColor, marginTop: SPACING.sm, letterSpacing: 1 }}>
        {stateLabel}
      </Text>
    </View>
  );
}

function useStaggeredAnim(count: number, delayBetween = 80) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.delay(i * delayBetween)
    );
    Animated.stagger(
      delayBetween,
      anims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          damping: 18,
          stiffness: 100,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return anims;
}

export default function HomeScreen() {
  const [companionIndex, setCompanionIndex] = useState(0);
  const leafRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const staggerAnims = useStaggeredAnim(6);

  useEffect(() => {
    // Leaf rotation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(leafRotation, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(leafRotation, { toValue: -1, duration: 1500, useNativeDriver: true }),
        Animated.timing(leafRotation, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Pulse border for prediction card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const leafRotateDeg = leafRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  const pulseBorderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,160,0,0.22)', 'rgba(255,160,0,0.60)'],
  });

  const staggerStyle = (index: number) => ({
    opacity: staggerAnims[index],
    transform: [
      {
        translateY: staggerAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface0 }}>
      <BubbleParticles />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🌿 GardenGenius</Text>
            <Text style={styles.headerTagline}>Your garden. Perfected.</Text>
          </View>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Score Ring */}
          <Animated.View style={staggerStyle(0)}>
            <ScoreRing score={GENIUS_SCORE} />
          </Animated.View>

          {/* AI Companion Card */}
          <Animated.View style={[staggerStyle(1), { marginHorizontal: SPACING.md }]}>
            <TouchableOpacity
              style={[GLASS.card, styles.companionCard]}
              onPress={() => setCompanionIndex((i) => (i + 1) % COMPANION_MESSAGES.length)}
              activeOpacity={0.85}
            >
              <Animated.Text style={{ fontSize: 28, transform: [{ rotate: leafRotateDeg }], marginRight: SPACING.sm }}>
                🌿
              </Animated.Text>
              <Text style={styles.companionText}>{COMPANION_MESSAGES[companionIndex]}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View style={[staggerStyle(2), styles.statsStrip]}>
            {[
              { icon: '🌡️', label: 'Soil Temp', value: '58°F' },
              { icon: '💧', label: 'Last Watered', value: '2 days ago' },
              { icon: '☀️', label: 'Sunlight', value: 'Good' },
            ].map((stat, i) => (
              <View key={i} style={[GLASS.card, styles.statCard]}>
                <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Prediction Card */}
          <Animated.View style={[staggerStyle(3), { marginHorizontal: SPACING.md, marginTop: SPACING.md }]}>
            <Animated.View
              style={[
                styles.predictionCard,
                { borderColor: pulseBorderColor },
              ]}
            >
              <Text style={styles.predictionText}>
                ⚠️ Aphid risk in Tomato Bed — 65% likelihood in 4 days
              </Text>
              <Text style={styles.predictionCta}>Tap to see Revive Plan →</Text>
            </Animated.View>
          </Animated.View>

          {/* Next Task */}
          <Animated.View style={[staggerStyle(4), { marginHorizontal: SPACING.md, marginTop: SPACING.md }]}>
            <View style={[GLASS.card, styles.taskCard]}>
              <Text style={{ fontSize: 28 }}>🍅</Text>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.taskName}>Check tomato moisture</Text>
                <Text style={styles.taskDue}>Due today · 5 min</Text>
              </View>
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>TODAY</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerTagline: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: COLORS.springLeaf,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.surface0,
    letterSpacing: 1,
  },
  companionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  companionText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.petalCream,
    lineHeight: 20,
  },
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  predictionCard: {
    backgroundColor: 'rgba(255,160,0,0.12)',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: SPACING.md,
  },
  predictionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.sunflower,
  },
  predictionCta: {
    fontSize: 13,
    color: COLORS.peachBloom,
    marginTop: 6,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  taskDue: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  taskBadge: {
    backgroundColor: COLORS.springLeaf,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.surface0,
    letterSpacing: 0.5,
  },
});

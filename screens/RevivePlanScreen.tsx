import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, GRADIENTS, GLASS, SPACING, RADIUS } from '../lib/theme';

interface DoseInfo {
  unit: string;
  perSqFt: number;
}

interface PlanStep {
  title: string;
  explanation: string;
  dose: DoseInfo | null;
  product: string | null;
}

interface RevivePlan {
  title: string;
  severity: number;
  steps: PlanStep[];
}

const REVIVE_PLANS: Record<string, RevivePlan> = {
  aphids: {
    title: 'Aphid Treatment Plan',
    severity: 2,
    steps: [
      {
        title: 'Blast with water',
        explanation:
          'Use a strong stream from your hose to knock aphids off stems and undersides of leaves. Do this in the morning so plants dry before evening.',
        dose: null,
        product: null,
      },
      {
        title: 'Apply neem oil spray',
        explanation:
          'Neem is absorbed into plant tissue — aphids feeding on treated plants cannot reproduce. Safe for bees when applied at dusk or dawn.',
        dose: { unit: 'tbsp neem oil per gallon water', perSqFt: 0.02 },
        product: 'Neem Oil Concentrate',
      },
      {
        title: 'Introduce beneficial insects',
        explanation:
          'Lacewings and ladybugs are natural aphid predators. Release near affected plants in the evening.',
        dose: null,
        product: 'Live Ladybugs',
      },
    ],
  },
  powderyMildew: {
    title: 'Powdery Mildew Plan',
    severity: 3,
    steps: [
      {
        title: 'Remove affected leaves',
        explanation:
          'Cut and bag (do not compost) any leaves with more than 30% coverage. This slows spread immediately.',
        dose: null,
        product: null,
      },
      {
        title: 'Apply baking soda spray',
        explanation:
          'Mix 1 tbsp baking soda + 1 tsp dish soap per gallon water. Changes leaf surface pH — fungus cannot spread.',
        dose: { unit: 'tbsp baking soda per gallon water', perSqFt: 0.01 },
        product: null,
      },
      {
        title: 'Apply copper fungicide',
        explanation:
          'Copper disrupts fungal cell membranes. Apply every 7-10 days while conditions favor mildew (warm days, cool nights).',
        dose: { unit: 'tsp per gallon water', perSqFt: 0.015 },
        product: 'Bonide Copper Fungicide',
      },
    ],
  },
};

const SEVERITY_LABELS = ['', 'Mild', 'Low', 'Moderate', 'High', 'Severe'];

function ConfettiPetal({ index }: { index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1500 + index * 100, useNativeDriver: true }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -200 - index * 15] });
  const opacity = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.8, 0] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, (index % 2 === 0 ? 1 : -1) * (20 + index * 8)] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: 20,
        transform: [{ translateY }, { translateX }],
        opacity,
        bottom: 0,
        left: '50%',
      }}
    >
      {['🌿', '🍃', '🌱', '✨', '🌸'][index % 5]}
    </Animated.Text>
  );
}

export default function RevivePlanScreen() {
  const [planKey, setPlanKey] = useState<keyof typeof REVIVE_PLANS>('aphids');
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [sqFt, setSqFt] = useState<Record<number, string>>({});
  const [completed, setCompleted] = useState(false);
  const stepAnims = useRef<Animated.Value[]>([]).current;
  const leafAnims = useRef<Animated.Value[]>([]).current;

  const plan = REVIVE_PLANS[planKey];

  while (stepAnims.length < plan.steps.length) stepAnims.push(new Animated.Value(1));
  while (leafAnims.length < plan.steps.length) leafAnims.push(new Animated.Value(0));

  const markDone = async (index: number) => {
    if (doneSteps.has(index)) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const cardAnim = stepAnims[index];
    const leafAnim = leafAnims[index];

    Animated.sequence([
      Animated.spring(cardAnim, { toValue: 1.05, damping: 12, stiffness: 180, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 1.0, damping: 12, stiffness: 180, useNativeDriver: true }),
    ]).start();

    Animated.spring(leafAnim, { toValue: 1, damping: 12, stiffness: 150, useNativeDriver: true }).start();

    const next = new Set(doneSteps);
    next.add(index);
    setDoneSteps(next);

    if (next.size === plan.steps.length) {
      setTimeout(() => setCompleted(true), 600);
    }
  };

  const calcDose = (step: PlanStep, sqFtValue: string): string => {
    if (!step.dose) return '';
    const area = parseFloat(sqFtValue);
    if (isNaN(area) || area <= 0) return '';
    const amount = (area * step.dose.perSqFt).toFixed(2);
    return `${amount} ${step.dose.unit}`;
  };

  const leafScale = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1.3, 1] });

  if (completed) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.surface0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'relative', alignItems: 'center' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <ConfettiPetal key={i} index={i} />
          ))}
          <Text style={{ fontSize: 64 }}>🌱</Text>
          <Text style={styles.completeTitle}>Your garden thanks you!</Text>
          <Text style={styles.completeSubtitle}>Check back in 48 hours</Text>
          <TouchableOpacity style={styles.completeBtn} onPress={() => { setCompleted(false); setDoneSteps(new Set()); }}>
            <Text style={styles.completeBtnText}>Start Another Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={['#243D16', '#1A2E10']} style={styles.header}>
          <Text style={styles.headerTitle}>🌿 Revive Plan</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Plan selector */}
          <View style={styles.planSelector}>
            {Object.keys(REVIVE_PLANS).map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => { setPlanKey(key as keyof typeof REVIVE_PLANS); setDoneSteps(new Set()); }}
                style={[styles.planPill, planKey === key && styles.planPillActive]}
              >
                <Text style={[styles.planPillText, planKey === key && styles.planPillTextActive]}>
                  {REVIVE_PLANS[key as keyof typeof REVIVE_PLANS].title.replace(' Plan', '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Problem summary */}
          <View style={[GLASS.card, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>{plan.title}</Text>
            <View style={styles.severityRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.severityBar,
                    { backgroundColor: i < plan.severity ? COLORS.sunflower : COLORS.surface2 },
                  ]}
                />
              ))}
              <Text style={styles.severityLabel}>{SEVERITY_LABELS[plan.severity]}</Text>
            </View>
            <Text style={styles.summaryAdvice}>Act this week for best results 🌱</Text>
          </View>

          {/* Step cards */}
          {plan.steps.map((step, i) => {
            const done = doneSteps.has(i);
            const cardAnim = stepAnims[i];
            const leafAnim = leafAnims[i];
            const dose = calcDose(step, sqFt[i] ?? '');

            return (
              <Animated.View
                key={i}
                style={[
                  GLASS.cardElevated,
                  styles.stepCard,
                  { transform: [{ scale: cardAnim }] },
                ]}
              >
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNumber}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepTitle, done && { textDecorationLine: 'line-through', color: COLORS.textMuted }]}>
                    {step.title}
                  </Text>
                  {done && (
                    <Animated.Text style={{ fontSize: 20, transform: [{ scale: leafScale(leafAnim) }] }}>🌿</Animated.Text>
                  )}
                </View>

                <Text style={styles.stepExplanation}>{step.explanation}</Text>

                {step.dose && (
                  <View style={styles.doseRow}>
                    <TextInput
                      style={styles.doseInput}
                      placeholder="sq ft"
                      placeholderTextColor={COLORS.textDisabled}
                      keyboardType="numeric"
                      value={sqFt[i] ?? ''}
                      onChangeText={(v) => setSqFt((s) => ({ ...s, [i]: v }))}
                    />
                    {dose ? (
                      <Text style={styles.doseResult}>→ {dose}</Text>
                    ) : (
                      <Text style={styles.doseHint}>Enter garden size for dose</Text>
                    )}
                  </View>
                )}

                {step.product && (
                  <TouchableOpacity style={styles.amazonBtn}>
                    <Text style={styles.amazonBtnText}>🛒 {step.product} — Amazon</Text>
                  </TouchableOpacity>
                )}

                {!done && (
                  <TouchableOpacity style={styles.markDoneBtn} onPress={() => markDone(i)}>
                    <Text style={styles.markDoneText}>✓ Mark Done</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  planSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  planPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.dewBorder,
  },
  planPillActive: {
    backgroundColor: COLORS.vineGreen,
    borderColor: COLORS.springLeaf,
  },
  planPillText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  planPillTextActive: {
    color: COLORS.white,
  },
  summaryCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  severityBar: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  severityLabel: {
    fontSize: 12,
    color: COLORS.sunflower,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  summaryAdvice: {
    fontSize: 13,
    color: COLORS.springLeaf,
    fontStyle: 'italic',
  },
  stepCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.vineGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
  },
  stepExplanation: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  doseInput: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    width: 80,
    color: COLORS.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.dewBorder,
  },
  doseResult: {
    fontSize: 13,
    color: COLORS.springLeaf,
    fontWeight: '600',
    flex: 1,
  },
  doseHint: {
    fontSize: 12,
    color: COLORS.textDisabled,
    flex: 1,
  },
  amazonBtn: {
    backgroundColor: 'rgba(255,160,0,0.15)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  amazonBtnText: {
    fontSize: 13,
    color: COLORS.sunflower,
    fontWeight: '600',
  },
  markDoneBtn: {
    backgroundColor: COLORS.vineGreen,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    alignItems: 'center',
  },
  markDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  completeBtn: {
    backgroundColor: COLORS.vineGreen,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.xl,
  },
  completeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

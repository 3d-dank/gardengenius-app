import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image, Platform, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  COLORS, GRADIENTS, GLASS, NEO, RADIUS, SPACING, TYPOGRAPHY,
  getHealthColor, getHealthGradient, getHealthLabel, getSeverityColor,
} from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HISTORY_KEY = '@lawngenius_history';
const YARD_KEY = '@lawngenius_yard';

interface YardPlot { id: string; name: string; sqft: number; acres: string; coords: any[]; mappedAt: string; }
interface SavedYard {
  plots?: YardPlot[];
  totalSqft?: number;
  totalAcres?: string;
  lastUpdated?: string;
  sqft?: number;
  acres?: string;
  coords?: any[];
  mappedAt?: string;
}

function parseYardSummary(yard: SavedYard): { totalSqft: number; plotCount: number } {
  if (yard.plots) return { totalSqft: yard.totalSqft ?? 0, plotCount: yard.plots.length };
  return { totalSqft: yard.sqft ?? 0, plotCount: 1 };
}

interface WeatherData { soilTemp: number; rainfall: number; uvIndex: number; }
interface HistoryEntry {
  id: string; date: string; imageUri: string; problem: string;
  confidence: number; severity: string; description: string; treatment: string; timing: string;
}

function calcHealthScore(entries: HistoryEntry[]): number | null {
  if (entries.length === 0) return null;
  const last5 = entries.slice(0, 5);
  let score = 100;
  for (const e of last5) {
    if (e.severity === 'High') score -= 20;
    else if (e.severity === 'Medium') score -= 10;
    else if (e.severity === 'Low') score -= 5;
    else score += 5;
  }
  return Math.max(0, Math.min(100, score));
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Staggered animated card wrapper */
function AnimatedCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** Animated health score counter */
function AnimatedScore({ target, color }: { target: number; color: string }) {
  const animVal = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    animVal.setValue(0);
    Animated.timing(animVal, { toValue: target, duration: 1200, delay: 300, useNativeDriver: false }).start();
    const id = animVal.addListener(({ value }) => setDisplayed(Math.round(value)));
    return () => animVal.removeListener(id);
  }, [target]);

  return (
    <Text style={[styles.scoreNumber, { color }]}>{displayed}</Text>
  );
}

/** Pulsing ring around health circle */
function PulsingRing({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.15, duration: 1400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[
      styles.pulsingRing,
      { borderColor: color, transform: [{ scale }], opacity }
    ]} />
  );
}

export default function HomeScreen({ navigation }: any) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [recentScan, setRecentScan] = useState<HistoryEntry | null>(null);
  const [savedYard, setSavedYard] = useState<SavedYard | null>(null);

  const fetchWeather = async () => {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=44.97&longitude=-93.27&current=temperature_2m,precipitation,uv_index,soil_temperature_0cm&temperature_unit=fahrenheit');
      const d = await res.json();
      setWeather({ soilTemp: Math.round(d.current.soil_temperature_0cm * 9 / 5 + 32), rainfall: d.current.precipitation, uvIndex: d.current.uv_index });
    } catch { setWeather({ soilTemp: 52, rainfall: 0.1, uvIndex: 4 }); }
  };

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      setScore(calcHealthScore(history));
      setRecentScan(history.length > 0 ? history[0] : null);
    } catch { /* silent */ }
  };

  const loadYard = async () => {
    try {
      const raw = await AsyncStorage.getItem(YARD_KEY);
      setSavedYard(raw ? JSON.parse(raw) : null);
    } catch { /* silent */ }
  };

  const loadAll = async () => {
    await Promise.all([fetchWeather(), loadHistory(), loadYard()]);
  };

  useEffect(() => { loadAll(); }, []);

  useFocusEffect(
    useCallback(() => { loadHistory(); loadYard(); }, [])
  );

  const onRefresh = async () => { setRefreshing(true); await loadAll(); setRefreshing(false); };

  const handleScanPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Scan');
  };

  const scoreColor = getHealthColor(score);
  const scoreGradient = getHealthGradient(score);
  const scoreLabel = getHealthLabel(score);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient colors={GRADIENTS.background} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.limeAccent} />
          }
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <LinearGradient colors={GRADIENTS.header} style={styles.header}>
            <View style={styles.headerBrand}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>LawnGenius</Text>
                <Text style={styles.headerTagline}>Your lawn. Perfected.</Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>PRO</Text>
              </View>
            </View>
            <View style={styles.headerDivider} />
          </LinearGradient>

          {/* ── Hero Health Score ────────────────────────────────────────── */}
          <AnimatedCard delay={0} style={styles.scoreCardWrap}>
            <View style={[GLASS.card, styles.scoreCard]}>
              {/* Glow effect behind circle */}
              <View style={[styles.scoreGlow, { backgroundColor: scoreColor + '25' }]} />

              <View style={styles.scoreCircleWrap}>
                <PulsingRing color={scoreColor} />
                <LinearGradient
                  colors={['rgba(13,59,46,0.9)', 'rgba(7,31,24,0.95)']}
                  style={[styles.scoreCircle, { borderColor: scoreColor }]}
                >
                  {score !== null ? (
                    <AnimatedScore target={score} color={scoreColor} />
                  ) : (
                    <Text style={[styles.scoreNumber, { color: scoreColor }]}>?</Text>
                  )}
                  <Text style={[styles.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>
                </LinearGradient>
              </View>

              <Text style={styles.scoreTitle}>Lawn Health Score</Text>
              <Text style={styles.scoreHint}>
                {score === null ? 'Scan your lawn to unlock your score' : 'Based on last 5 scans · Pull to refresh'}
              </Text>

              {/* Health bar */}
              {score !== null && (
                <View style={styles.healthBarWrap}>
                  <LinearGradient
                    colors={scoreGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.healthBar, { width: `${score}%` }]}
                  />
                </View>
              )}
            </View>
          </AnimatedCard>

          {/* ── "What Needs Attention" dynamic card ──────────────────────── */}
          {recentScan && recentScan.severity !== 'None' && (
            <AnimatedCard delay={100} style={styles.cardWrap}>
              <LinearGradient
                colors={['rgba(220,38,38,0.15)', 'rgba(13,59,46,0.9)']}
                style={[GLASS.card, styles.attentionCard]}
              >
                <View style={styles.attentionHeader}>
                  <View style={[styles.attentionBadge, { backgroundColor: getSeverityColor(recentScan.severity) + '30', borderColor: getSeverityColor(recentScan.severity) + '60' }]}>
                    <Text style={[styles.attentionBadgeText, { color: getSeverityColor(recentScan.severity) }]}>
                      ⚠️ {recentScan.severity} Priority
                    </Text>
                  </View>
                  <Text style={styles.attentionTitle}>Needs Attention</Text>
                </View>
                <Text style={styles.attentionProblem}>{recentScan.problem}</Text>
                <Text style={styles.attentionDesc} numberOfLines={2}>{recentScan.description}</Text>
                <View style={styles.attentionFooter}>
                  <Text style={styles.attentionDate}>{formatDate(recentScan.date)}</Text>
                  <Text style={styles.attentionConf}>{recentScan.confidence}% confidence</Text>
                </View>
              </LinearGradient>
            </AnimatedCard>
          )}

          {/* ── Metrics Grid ──────────────────────────────────────────────── */}
          <AnimatedCard delay={150}>
            <View style={styles.grid}>
              {[
                { icon: '🌡️', value: weather ? `${weather.soilTemp}°F` : '—', label: 'Soil Temp' },
                { icon: '💧', value: weather ? `${weather.rainfall}"` : '—', label: 'Rainfall' },
                { icon: '☀️', value: weather ? `${weather.uvIndex}` : '—', label: 'UV Index' },
                { icon: '🌱', value: '12 days', label: 'Next Fert.' },
              ].map((m, i) => (
                <View key={i} style={[GLASS.metric, styles.metricCard]}>
                  <Text style={styles.metricIcon}>{m.icon}</Text>
                  <Text style={styles.metricValue}>{m.value}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </AnimatedCard>

          {/* ── Scan CTA ─────────────────────────────────────────────────── */}
          <AnimatedCard delay={200} style={styles.cardWrap}>
            <TouchableOpacity onPress={handleScanPress} activeOpacity={0.85} style={NEO.buttonPrimary}>
              <LinearGradient colors={GRADIENTS.limeVibrant} style={styles.scanBtn}>
                <Text style={styles.scanBtnIcon}>📷</Text>
                <View style={styles.scanBtnText}>
                  <Text style={styles.scanBtnTitle}>Scan Your Lawn</Text>
                  <Text style={styles.scanBtnSub}>AI diagnosis in seconds</Text>
                </View>
                <View style={styles.scanBtnArrow}>
                  <Text style={styles.scanBtnArrowText}>›</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedCard>

          {/* ── Yard Size Card ────────────────────────────────────────────── */}
          {savedYard && (() => {
            const { totalSqft, plotCount } = parseYardSummary(savedYard);
            return (
              <AnimatedCard delay={250} style={styles.cardWrap}>
                <View style={[GLASS.card, styles.yardCard]}>
                  <Text style={styles.yardIcon}>📐</Text>
                  <View style={styles.yardInfo}>
                    <Text style={styles.yardLabel}>Your Property</Text>
                    <Text style={styles.yardValue}>
                      {plotCount > 1 ? `${plotCount} plots · ` : ''}{totalSqft.toLocaleString()} sq ft
                    </Text>
                    <Text style={styles.yardSub}>All recommendations sized for your yard</Text>
                  </View>
                </View>
              </AnimatedCard>
            );
          })()}

          {/* ── Recent Diagnosis ──────────────────────────────────────────── */}
          {recentScan && (
            <AnimatedCard delay={300} style={styles.cardWrap}>
              <View style={[GLASS.card, styles.recentCard]}>
                <View style={styles.recentHeaderRow}>
                  <Text style={styles.recentHeaderText}>🔬 Recent Diagnosis</Text>
                  <View style={[styles.recentBadge, { backgroundColor: getSeverityColor(recentScan.severity) + '25', borderColor: getSeverityColor(recentScan.severity) + '50' }]}>
                    <Text style={[styles.recentBadgeText, { color: getSeverityColor(recentScan.severity) }]}>
                      {recentScan.severity === 'None' ? '✅ Healthy' : recentScan.severity}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentProblem}>{recentScan.problem}</Text>
                <Text style={styles.recentDate}>{formatDate(recentScan.date)} · {recentScan.confidence}% confidence</Text>
                <Text style={styles.recentDescription} numberOfLines={2}>{recentScan.description}</Text>
              </View>
            </AnimatedCard>
          )}

          {/* ── Tip Card ─────────────────────────────────────────────────── */}
          <AnimatedCard delay={350} style={styles.cardWrap}>
            <View style={[GLASS.card, styles.tipCard]}>
              <LinearGradient
                colors={['rgba(212,175,55,0.15)', 'rgba(13,59,46,0.0)']}
                style={styles.tipGradient}
              >
                <Text style={styles.tipIcon}>💡</Text>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>This Week's Tip</Text>
                  <Text style={styles.tipText}>
                    Soil temperatures below 50°F slow fertilizer uptake. Wait until temps consistently reach 55°F before your first application of the season.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </AnimatedCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface0 },

  // Header
  header: {
    paddingTop: 12,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerLogo: {
    width: 52, height: 52, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.borderBright,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headerTagline: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: COLORS.premiumGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.surface0,
    letterSpacing: 1.5,
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: SPACING.md,
  },

  // Score card
  scoreCardWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    overflow: 'hidden',
  },
  scoreGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 20,
    alignSelf: 'center',
  },
  scoreCircleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  pulsingRing: {
    position: 'absolute',
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 2,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 56,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: -4,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  scoreHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  healthBarWrap: {
    width: '80%',
    height: 4,
    backgroundColor: COLORS.white10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  healthBar: {
    height: 4,
    borderRadius: 2,
  },

  // Attention card
  cardWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  attentionCard: {
    padding: SPACING.md,
    overflow: 'hidden',
  },
  attentionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  attentionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  attentionBadgeText: { fontSize: 11, fontWeight: '700' },
  attentionTitle: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  attentionProblem: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  attentionDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  attentionFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  attentionDate: { fontSize: 12, color: COLORS.textMuted },
  attentionConf: { fontSize: 12, color: COLORS.limeAccent, fontWeight: '600' },

  // Metrics
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  metricCard: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 3) / 4,
    paddingVertical: SPACING.md,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  metricIcon: { fontSize: 22, marginBottom: 6 },
  metricValue: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  metricLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 3, textAlign: 'center', letterSpacing: 0.3 },

  // Scan button
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    gap: SPACING.md,
  },
  scanBtnIcon: { fontSize: 28 },
  scanBtnText: { flex: 1 },
  scanBtnTitle: { fontSize: 18, fontWeight: '800', color: COLORS.surface0, letterSpacing: 0.3 },
  scanBtnSub: { fontSize: 12, color: 'rgba(0,0,0,0.55)', marginTop: 2 },
  scanBtnArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnArrowText: { fontSize: 22, color: COLORS.surface0, fontWeight: '700', lineHeight: 28 },

  // Yard card
  yardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  yardIcon: { fontSize: 28 },
  yardInfo: { flex: 1 },
  yardLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  yardValue: { fontSize: 17, fontWeight: '800', color: COLORS.limeAccent, marginTop: 2 },
  yardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  // Recent card
  recentCard: { padding: SPACING.md },
  recentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  recentHeaderText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  recentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  recentBadgeText: { fontSize: 11, fontWeight: '700' },
  recentProblem: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  recentDate: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  recentDescription: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  // Tip card
  tipCard: { overflow: 'hidden', padding: 0 },
  tipGradient: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'flex-start',
    borderRadius: RADIUS.xl,
  },
  tipIcon: { fontSize: 26, marginTop: 2 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.premiumGold, marginBottom: 6, letterSpacing: 0.3 },
  tipText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});

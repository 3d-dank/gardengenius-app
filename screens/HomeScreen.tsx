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
const HISTORY_KEY = '@gardengenius_history';
const GARDEN_KEY = '@gardengenius_garden';

interface HistoryEntry {
  id: string; date: string; imageUri: string; problem: string;
  confidence: number; severity: string; description: string; treatment: string; timing: string;
}

interface WeatherData { soilTemp: number; rainfall: number; uvIndex: number; }

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

  const fetchWeather = async () => {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=44.97&longitude=-93.27&current=temperature_2m,precipitation,uv_index,soil_temperature_0cm&temperature_unit=fahrenheit');
      const d = await res.json();
      setWeather({ soilTemp: Math.round(d.current.soil_temperature_0cm * 9 / 5 + 32), rainfall: d.current.precipitation, uvIndex: d.current.uv_index });
    } catch { setWeather({ soilTemp: 62, rainfall: 0.1, uvIndex: 4 }); }
  };

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      setScore(calcHealthScore(history));
      setRecentScan(history.length > 0 ? history[0] : null);
    } catch { /* silent */ }
  };

  const loadAll = async () => {
    await Promise.all([fetchWeather(), loadHistory()]);
  };

  useEffect(() => { loadAll(); }, []);
  useFocusEffect(useCallback(() => { loadHistory(); }, []));

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
                <Text style={styles.headerTitle}>GardenGenius</Text>
                <Text style={styles.headerTagline}>Your garden. Perfected.</Text>
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
              <View style={[styles.scoreGlow, { backgroundColor: scoreColor + '25' }]} />

              <View style={styles.scoreCircleWrap}>
                <PulsingRing color={scoreColor} />
                <LinearGradient
                  colors={['rgba(26,61,15,0.9)', 'rgba(15,32,8,0.95)']}
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

              <Text style={styles.scoreTitle}>Garden Health Score</Text>
              <Text style={styles.scoreHint}>
                {score === null ? 'Scan a plant to unlock your score' : 'Based on last 5 scans · Pull to refresh'}
              </Text>

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

          {/* ── AI Companion Card ─────────────────────────────────────────── */}
          <AnimatedCard delay={80} style={styles.cardWrap}>
            <LinearGradient
              colors={['rgba(160,82,45,0.15)', 'rgba(26,61,15,0.9)']}
              style={[GLASS.card, styles.aiCompanionCard]}
            >
              <Text style={styles.aiCompanionIcon}>🌱</Text>
              <View style={styles.aiCompanionText}>
                <Text style={styles.aiCompanionTitle}>Garden Tip</Text>
                <Text style={styles.aiCompanionBody}>
                  {weather && weather.soilTemp >= 55
                    ? `Soil temp is ${weather.soilTemp}°F — great time to direct sow warm-season crops!`
                    : `Soil temp is ${weather ? weather.soilTemp + '°F' : 'cool'} — focus on cold-tolerant crops like lettuce & spinach.`}
                </Text>
              </View>
            </LinearGradient>
          </AnimatedCard>

          {/* ── "What Needs Attention" dynamic card ──────────────────────── */}
          {recentScan && recentScan.severity !== 'None' && (
            <AnimatedCard delay={100} style={styles.cardWrap}>
              <LinearGradient
                colors={['rgba(220,38,38,0.15)', 'rgba(26,61,15,0.9)']}
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
                { icon: '🌿', value: '7 days', label: 'Next Water' },
              ].map((m, i) => (
                <View key={i} style={[GLASS.metric, styles.metricCard]}>
                  <Text style={styles.metricIcon}>{m.icon}</Text>
                  <Text style={styles.metricValue}>{m.value}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </AnimatedCard>

          {/* ── Quick Actions ─────────────────────────────────────────────── */}
          <AnimatedCard delay={180} style={styles.cardWrap}>
            <View style={[GLASS.card, styles.quickActionsCard]}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {[
                  { icon: '📷', label: 'Scan Plant', screen: 'Scan' },
                  { icon: '🌿', label: 'My Garden', screen: 'Profile' },
                  { icon: '📅', label: 'Planting Calendar', screen: 'Calendar' },
                  { icon: '🎓', label: 'Garden Academy', screen: 'Academy' },
                ].map((action) => (
                  <TouchableOpacity
                    key={action.label}
                    style={styles.quickActionBtn}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      navigation.navigate(action.screen);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.quickActionIcon}>
                      <Text style={styles.quickActionEmoji}>{action.icon}</Text>
                    </View>
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </AnimatedCard>

          {/* ── Scan CTA ─────────────────────────────────────────────────── */}
          <AnimatedCard delay={200} style={styles.cardWrap}>
            <TouchableOpacity onPress={handleScanPress} activeOpacity={0.85} style={NEO.buttonPrimary}>
              <LinearGradient colors={GRADIENTS.limeVibrant} style={styles.scanBtn}>
                <Text style={styles.scanBtnIcon}>📷</Text>
                <View style={styles.scanBtnText}>
                  <Text style={styles.scanBtnTitle}>Scan Your Plant</Text>
                  <Text style={styles.scanBtnSub}>AI diagnosis in seconds</Text>
                </View>
                <View style={styles.scanBtnArrow}>
                  <Text style={styles.scanBtnArrowText}>›</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedCard>

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

          {/* ── Garden Tip Card ─────────────────────────────────────────── */}
          <AnimatedCard delay={350} style={styles.cardWrap}>
            <View style={[GLASS.card, styles.tipCard]}>
              <LinearGradient
                colors={['rgba(255,160,0,0.15)', 'rgba(26,61,15,0.0)']}
                style={styles.tipGradient}
              >
                <Text style={styles.tipIcon}>🌻</Text>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>This Week's Garden Tip</Text>
                  <Text style={styles.tipText}>
                    Deep, infrequent watering (1–2" per week) encourages deeper roots. Morning watering reduces fungal disease risk — avoid wetting foliage in the evening.
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
    backgroundColor: COLORS.harvestGold,
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

  // AI Companion
  cardWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  aiCompanionCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'flex-start',
    gap: SPACING.md,
    overflow: 'hidden',
  },
  aiCompanionIcon: { fontSize: 28, marginTop: 2 },
  aiCompanionText: { flex: 1 },
  aiCompanionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.limeAccent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  aiCompanionBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  // Attention card
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

  // Quick Actions
  quickActionsCard: { padding: SPACING.md },
  quickActionsTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: SPACING.md },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickActionBtn: { flex: 1, minWidth: (SCREEN_WIDTH - SPACING.md * 4 - SPACING.sm * 3) / 2, alignItems: 'center', paddingVertical: SPACING.sm },
  quickActionIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(139,195,74,0.12)',
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionEmoji: { fontSize: 24 },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },

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
  tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.harvestGold, marginBottom: 6, letterSpacing: 0.3 },
  tipText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});

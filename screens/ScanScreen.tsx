import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, GRADIENTS, GLASS, SPACING, RADIUS, geniusScoreColor } from '../lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_HEIGHT = (SCREEN_WIDTH - SPACING.md * 2) * (3 / 4);

const SMALL_RING = 100;
const SMALL_STROKE = 10;
const SMALL_RADIUS = (SMALL_RING - SMALL_STROKE) / 2;
const SMALL_CIRCUMFERENCE = 2 * Math.PI * SMALL_RADIUS;

type ScanMode = 'diagnose' | 'identify';

interface Issue {
  name: string;
  severity: number;
  confidence: number;
  recommendation: string;
}

interface ScanResult {
  mode: ScanMode;
  healthScore: number;
  primaryIssue: string | null;
  issues: Issue[];
  species: string | null;
  botanicalName: string | null;
  growthStage: string | null;
  daysToHarvest: number | null;
  careTips: string[];
  productRecommendations: string[];
}

const SEVERITY_COLORS: Record<number, string> = {
  1: COLORS.springLeaf,
  2: COLORS.freshGrowth,
  3: COLORS.sunflower,
  4: COLORS.peachBloom,
  5: COLORS.bloomRed,
};

function SmallScoreRing({ score }: { score: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  const scoreColor = geniusScoreColor(score);
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1000, useNativeDriver: false }).start();
    anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeAllListeners();
  }, [score]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [SMALL_CIRCUMFERENCE, SMALL_CIRCUMFERENCE - (SMALL_CIRCUMFERENCE * score) / 100],
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: SPACING.md }}>
      <Svg width={SMALL_RING} height={SMALL_RING}>
        <Circle
          cx={SMALL_RING / 2}
          cy={SMALL_RING / 2}
          r={SMALL_RADIUS}
          stroke={COLORS.surface2}
          strokeWidth={SMALL_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SMALL_RING / 2}
          cy={SMALL_RING / 2}
          r={SMALL_RADIUS}
          stroke={scoreColor}
          strokeWidth={SMALL_STROKE}
          fill="none"
          strokeDasharray={SMALL_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SMALL_RING / 2}, ${SMALL_RING / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, width: SMALL_RING, height: SMALL_RING, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: COLORS.white }}>{display}</Text>
        <Text style={{ fontSize: 8, color: COLORS.textMuted }}>HEALTH</Text>
      </View>
    </View>
  );
}

export default function ScanScreen() {
  const [mode, setMode] = useState<ScanMode>('diagnose');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const cardAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access is required to scan plants.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!r.canceled && r.assets[0]) {
      setImageUri(r.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Select a photo first');
      return;
    }
    setAnalyzing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate AI analysis with mock data
    await new Promise((res) => setTimeout(res, 2000));

    const mockResult: ScanResult = {
      mode,
      healthScore: 72,
      primaryIssue: mode === 'diagnose' ? 'Early aphid infestation' : null,
      issues:
        mode === 'diagnose'
          ? [
              { name: 'Aphid Infestation', severity: 2, confidence: 82, recommendation: 'Apply neem oil spray at dusk. Repeat every 7 days.' },
              { name: 'Slight Nitrogen Deficiency', severity: 1, confidence: 65, recommendation: 'Apply balanced fertilizer, 1 tbsp/gallon, twice weekly.' },
            ]
          : [],
      species: mode === 'identify' ? 'Cherry Tomato' : null,
      botanicalName: mode === 'identify' ? 'Solanum lycopersicum var. cerasiforme' : null,
      growthStage: mode === 'identify' ? 'Early fruiting' : null,
      daysToHarvest: mode === 'identify' ? 18 : null,
      careTips:
        mode === 'identify'
          ? [
              'Ensure consistent watering — 1-2 inches per week',
              'Support stems with cages as fruit develops',
              'Remove suckers for larger fruit yield',
            ]
          : [],
      productRecommendations: ['Neem Oil Concentrate', 'Balanced Organic Fertilizer'],
    };

    // Save to history
    try {
      const existing = await AsyncStorage.getItem('scanHistory');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift({ ...mockResult, date: new Date().toISOString(), imageUri });
      await AsyncStorage.setItem('scanHistory', JSON.stringify(history.slice(0, 50)));
    } catch (_) {}

    // Stagger card animations
    const issueCount = mockResult.issues.length + mockResult.careTips.length + 2;
    while (cardAnims.length < issueCount) cardAnims.push(new Animated.Value(0));
    cardAnims.forEach((a) => a.setValue(0));

    setResult(mockResult);
    setAnalyzing(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.stagger(
      50,
      cardAnims.map((a) =>
        Animated.spring(a, { toValue: 1, damping: 18, stiffness: 100, useNativeDriver: true })
      )
    ).start();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <Text style={styles.headerTitle}>Scan Your Garden</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Mode Toggle */}
          <View style={styles.modeRow}>
            {(['diagnose', 'identify'] as ScanMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modePill, mode === m && styles.modePillActive]}
                onPress={() => { setMode(m); setResult(null); }}
              >
                <Text style={[styles.modePillText, mode === m && styles.modePillTextActive]}>
                  {m === 'diagnose' ? '🔍 Diagnose' : '🌿 Identify'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Camera Area */}
          <TouchableOpacity
            style={styles.cameraArea}
            onPress={imageUri ? () => setImageUri(null) : takePhoto}
            activeOpacity={0.9}
          >
            {imageUri ? (
              <Text style={{ fontSize: 48 }}>📸</Text>
            ) : (
              <>
                {/* Corner brackets */}
                {[
                  { top: 10, left: 10 },
                  { top: 10, right: 10 },
                  { bottom: 10, left: 10 },
                  { bottom: 10, right: 10 },
                ].map((pos, i) => (
                  <View
                    key={i}
                    style={[
                      styles.cornerBracket,
                      pos,
                      i === 1 && { transform: [{ scaleX: -1 }] },
                      i === 2 && { transform: [{ scaleY: -1 }] },
                      i === 3 && { transform: [{ scaleX: -1 }, { scaleY: -1 }] },
                    ]}
                  />
                ))}
                {/* Scan button */}
                <Animated.View style={[styles.scanButton, { transform: [{ scale: breatheAnim }] }]}>
                  <TouchableOpacity onPress={takePhoto} style={styles.scanButtonInner}>
                    <Text style={{ fontSize: 32 }}>📷</Text>
                  </TouchableOpacity>
                </Animated.View>
                <Text style={styles.cameraHint}>Tap to take photo</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Pick from library */}
          <TouchableOpacity style={styles.libraryBtn} onPress={pickImage}>
            <Text style={styles.libraryBtnText}>📂 Choose from Library</Text>
          </TouchableOpacity>

          {/* Analyze Button */}
          <TouchableOpacity onPress={analyzeImage} disabled={analyzing} style={{ marginHorizontal: SPACING.md, marginTop: SPACING.sm }}>
            <LinearGradient
              colors={analyzing ? [COLORS.surface2, COLORS.surface2] : [COLORS.freshGrowth, COLORS.vineGreen]}
              style={styles.analyzeBtn}
            >
              <Text style={styles.analyzeBtnText}>
                {analyzing ? '🔄 Analyzing...' : '🔍 Analyze Plant'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Results */}
          {result && (
            <View style={{ marginTop: SPACING.lg }}>
              <SmallScoreRing score={result.healthScore} />

              {result.primaryIssue && (
                <Text style={styles.primaryIssue}>⚠️ {result.primaryIssue}</Text>
              )}

              {result.species && (
                <View style={[GLASS.card, { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.md }]}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>{result.species}</Text>
                  <Text style={{ fontSize: 12, fontStyle: 'italic', color: COLORS.textMuted, marginTop: 2 }}>{result.botanicalName}</Text>
                  {result.growthStage && <Text style={{ fontSize: 13, color: COLORS.springLeaf, marginTop: 4 }}>Stage: {result.growthStage}</Text>}
                  {result.daysToHarvest !== null && (
                    <Text style={{ fontSize: 13, color: COLORS.sunflower, marginTop: 2 }}>
                      🌾 ~{result.daysToHarvest} days to harvest
                    </Text>
                  )}
                </View>
              )}

              {result.issues.map((issue, i) => {
                const anim = cardAnims[i] ?? new Animated.Value(1);
                return (
                  <Animated.View
                    key={i}
                    style={[
                      GLASS.card,
                      { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.md },
                      {
                        opacity: anim,
                        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[issue.severity] ?? COLORS.textMuted }]} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.white, flex: 1 }}>{issue.name}</Text>
                      <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{issue.confidence}% confidence</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 18 }}>{issue.recommendation}</Text>
                  </Animated.View>
                );
              })}

              {result.careTips.map((tip, i) => {
                const anim = cardAnims[result.issues.length + i] ?? new Animated.Value(1);
                return (
                  <Animated.View
                    key={i}
                    style={[
                      GLASS.card,
                      { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, padding: SPACING.md },
                      {
                        opacity: anim,
                        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 13, color: COLORS.petalCream, lineHeight: 18 }}>🌱 {tip}</Text>
                  </Animated.View>
                );
              })}

              {result.productRecommendations.length > 0 && (
                <View style={[GLASS.card, { marginHorizontal: SPACING.md, padding: SPACING.md }]}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 8 }}>
                    Recommended Products
                  </Text>
                  {result.productRecommendations.map((p, i) => (
                    <TouchableOpacity key={i} style={styles.amazonBtn}>
                      <Text style={styles.amazonBtnText}>🛒 {p} — Amazon</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
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
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.dewBorder,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modePillActive: {
    backgroundColor: COLORS.vineGreen,
    borderColor: COLORS.springLeaf,
  },
  modePillText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modePillTextActive: {
    color: COLORS.white,
  },
  cameraArea: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    height: CAMERA_HEIGHT,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.dewGlass,
    borderWidth: 1.5,
    borderColor: COLORS.dewBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cornerBracket: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.springLeaf,
    borderRadius: 4,
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.springLeaf,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.springLeaf,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonInner: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraHint: {
    position: 'absolute',
    bottom: 14,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  libraryBtn: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingVertical: 10,
  },
  libraryBtnText: {
    fontSize: 14,
    color: COLORS.springLeaf,
  },
  analyzeBtn: {
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  analyzeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  primaryIssue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.sunflower,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  amazonBtn: {
    backgroundColor: 'rgba(255,160,0,0.15)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    marginTop: 6,
  },
  amazonBtnText: {
    fontSize: 13,
    color: COLORS.sunflower,
    fontWeight: '600',
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, ScrollView, Alert, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { logScan } from '../lib/scanLogger';
import { getProductsForDiagnosis } from '../lib/products';
import ProductCarousel from '../components/ProductCarousel';
import {
  COLORS, GRADIENTS, GLASS, NEO, RADIUS, SPACING,
  getSeverityColor,
} from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY ?? '';
const HISTORY_KEY = '@gardengenius_history';

const ANALYZING_STEPS = [
  'Identifying plant species...',
  'Scanning for diseases & pests...',
  'Consulting plant pathology database...',
  'Preparing care recommendations...',
];

interface Diagnosis {
  problem: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string;
  timing: string;
  preventionTip: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  imageUri: string;
  problem: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string;
  timing: string;
}

/** Breathing / pulsing ring for scan button */
function BreathingRing() {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.5)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale1, { toValue: 1.3, duration: 1600, useNativeDriver: true }),
          Animated.timing(scale1, { toValue: 1, duration: 1600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity1, { toValue: 0, duration: 1600, useNativeDriver: true }),
          Animated.timing(opacity1, { toValue: 0.5, duration: 1600, useNativeDriver: true }),
        ]),
      ])
    );
    const loop2 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale2, { toValue: 1.55, duration: 2000, delay: 400, useNativeDriver: true }),
          Animated.timing(scale2, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity2, { toValue: 0, duration: 2000, delay: 400, useNativeDriver: true }),
          Animated.timing(opacity2, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    );
    loop1.start();
    loop2.start();
  }, []);

  return (
    <>
      <Animated.View style={[styles.breathRing, { transform: [{ scale: scale2 }], opacity: opacity2, borderColor: COLORS.limeAccent }]} />
      <Animated.View style={[styles.breathRing, { transform: [{ scale: scale1 }], opacity: opacity1, borderColor: COLORS.limeAccent }]} />
    </>
  );
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<CameraView>(null);
  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (analyzing) {
      setAnalyzingStep(0);
      stepInterval.current = setInterval(() => {
        setAnalyzingStep(prev => (prev + 1) % ANALYZING_STEPS.length);
      }, 1500);
      Animated.timing(progressAnim, { toValue: 1, duration: 6000, useNativeDriver: false }).start();
    } else {
      if (stepInterval.current) clearInterval(stepInterval.current);
      progressAnim.setValue(0);
    }
    return () => {
      if (stepInterval.current) clearInterval(stepInterval.current);
    };
  }, [analyzing]);

  const showToast = () => {
    setSavedToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setSavedToast(false));
  };

  const saveToHistory = async (diagnosis: Diagnosis, imageUri: string) => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        imageUri,
        problem: diagnosis.problem,
        confidence: diagnosis.confidence,
        severity: diagnosis.severity,
        description: diagnosis.description,
        treatment: diagnosis.treatment,
        timing: diagnosis.timing,
      };
      history.unshift(entry);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      showToast();
    } catch (e) {
      console.warn('Failed to save history', e);
    }
  };

  const getLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
      return null;
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const pic = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
    if (pic) { setPhoto(pic.uri); analyze(pic.base64!, pic.uri); }
  };

  const pickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setPhoto(res.assets[0].uri);
      analyze(res.assets[0].base64!, res.assets[0].uri);
    }
  };

  const analyze = async (base64: string, imageUri: string) => {
    setAnalyzing(true); setResult(null);
    const locationPromise = getLocation();

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert plant pathologist and horticulturist. Analyze this garden plant photo and respond ONLY with valid JSON (no markdown) with these exact fields:
{
  "problem": "name of issue (e.g. 'Powdery Mildew', 'Aphid Infestation', 'Tomato Blight', 'Nutrient Deficiency', 'Root Rot', 'Overwatering') or 'Healthy Plant' if no issues",
  "confidence": 85,
  "severity": "Low|Medium|High|None",
  "description": "2-3 sentence explanation covering plant species if identifiable, what you observe, and why it is concerning",
  "treatment": "specific organic or chemical treatment recommendation with application method",
  "timing": "when to apply treatment or next care step",
  "preventionTip": "one actionable prevention tip for this specific issue"
}
Focus on: plant species identification, disease/pest diagnosis (blight, powdery mildew, aphids, scale, spider mites), nutrient deficiencies (nitrogen, iron, calcium), watering issues (overwatering, underwatering, root rot), and environmental stress.`,
            },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' } }
          ]
        }],
        max_tokens: 500,
      }, { headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' } });

      const text = response.data.choices[0].message.content;
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const diagnosis: Diagnosis = JSON.parse(cleaned);
      setResult(diagnosis);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await saveToHistory(diagnosis, imageUri);

      const location = await locationPromise;
      logScan({
        imageUri,
        problem: diagnosis.problem,
        severity: diagnosis.severity,
        confidence: diagnosis.confidence,
        description: diagnosis.description,
        treatment: diagnosis.treatment,
        timing: diagnosis.timing,
        rawResponse: diagnosis,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
    } catch (e) {
      Alert.alert('Analysis failed', 'Could not analyze the image. Please try again.');
    }
    setAnalyzing(false);
  };

  const reset = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(null);
    setResult(null);
  };

  if (!permission) {
    return (
      <View style={styles.fullDark}>
        <ActivityIndicator color={COLORS.limeAccent} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.fullDark}>
        <LinearGradient colors={GRADIENTS.background} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.permContainer}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permText}>Allow camera to scan your plants for AI diagnosis</Text>
          <TouchableOpacity style={[NEO.buttonPrimary, styles.permBtnWrap]} onPress={requestPermission}>
            <LinearGradient colors={GRADIENTS.lime} style={styles.permBtn}>
              <Text style={styles.permBtnText}>Allow Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ── Photo / Result view ───────────────────────────────────────────────────
  if (photo) {
    return (
      <View style={styles.fullDark}>
        <LinearGradient colors={['#000', COLORS.surface0]} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Photo */}
            <View style={styles.photoWrap}>
              <Image source={{ uri: photo }} style={styles.preview} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.photoOverlay}
              />
            </View>

            {/* Analyzing state */}
            {analyzing && (
              <View style={[GLASS.card, styles.analyzingCard]}>
                <View style={styles.progressTrack}>
                  <Animated.View style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }
                  ]} />
                </View>
                <ActivityIndicator size="large" color={COLORS.limeAccent} style={{ marginTop: 16 }} />
                <Text style={styles.analyzingText}>{ANALYZING_STEPS[analyzingStep]}</Text>
                <Text style={styles.analyzingSub}>AI plant pathologist at work...</Text>
              </View>
            )}

            {/* Result card */}
            {result && (
              <View style={[GLASS.card, styles.resultCard]}>
                {/* Severity badge */}
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(result.severity) + '25', borderColor: getSeverityColor(result.severity) + '50' }]}>
                  <Text style={[styles.severityText, { color: getSeverityColor(result.severity) }]}>
                    {result.severity === 'None' ? '✅ Healthy Plant' : `⚠️ ${result.severity} Severity`}
                  </Text>
                </View>

                <Text style={styles.problemTitle}>{result.problem}</Text>

                {/* Confidence bar */}
                <View style={styles.confidenceRow}>
                  <Text style={styles.confidenceLabel}>AI Confidence</Text>
                  <Text style={[styles.confidenceValue, { color: COLORS.limeAccent }]}>{result.confidence}%</Text>
                </View>
                <View style={styles.confidenceTrack}>
                  <LinearGradient
                    colors={GRADIENTS.lime}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.confidenceFill, { width: `${result.confidence}%` as any }]}
                  />
                </View>

                <Text style={styles.description}>{result.description}</Text>

                {[
                  { icon: '💊', title: 'Treatment', text: result.treatment },
                  { icon: '📅', title: 'Timing', text: result.timing },
                  { icon: '🛡️', title: 'Prevention', text: result.preventionTip },
                ].map((sec) => (
                  <View key={sec.title} style={styles.section}>
                    <Text style={styles.sectionTitle}>{sec.icon} {sec.title}</Text>
                    <Text style={styles.sectionText}>{sec.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {result && (
              <ProductCarousel
                products={getProductsForDiagnosis(result.problem, result.severity)}
                diagnosis={result.problem}
              />
            )}

            {!analyzing && (
              <TouchableOpacity style={[NEO.buttonSecondary, styles.resetBtnWrap]} onPress={reset}>
                <View style={[GLASS.card, styles.resetBtn]}>
                  <Text style={styles.resetBtnText}>📷  Scan Another Plant</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>

        {savedToast && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
            <LinearGradient colors={GRADIENTS.lime} style={styles.toastInner}>
              <Text style={styles.toastText}>✅ Saved to history</Text>
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    );
  }

  // ── Live camera view ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <SafeAreaView style={styles.overlay}>
          {/* Top instructions */}
          <View style={styles.instructionsWrap}>
            <Text style={styles.instructions}>Point at your plant or affected leaf</Text>
          </View>

          {/* Scan frame with corner brackets */}
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <Text style={styles.frameTip}>Keep plant in frame</Text>
          </View>

          {/* Controls row */}
          <View style={styles.controls}>
            {/* Gallery button */}
            <TouchableOpacity style={styles.galleryBtn} onPress={pickImage} activeOpacity={0.8}>
              <View style={styles.galleryBtnInner}>
                <Text style={styles.galleryText}>🖼</Text>
              </View>
            </TouchableOpacity>

            {/* Main capture button with breathing rings */}
            <View style={styles.captureBtnWrap}>
              <BreathingRing />
              <TouchableOpacity onPress={takePicture} activeOpacity={0.85} style={styles.captureBtn}>
                <LinearGradient
                  colors={GRADIENTS.limeVibrant}
                  style={styles.captureBtnInner}
                />
              </TouchableOpacity>
            </View>

            <View style={{ width: 56 }} />
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullDark: { flex: 1, backgroundColor: COLORS.surface0 },

  // Permission screen
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  permIcon: { fontSize: 60, marginBottom: SPACING.md },
  permTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10, textAlign: 'center' },
  permText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  permBtnWrap: { alignSelf: 'stretch' },
  permBtn: { padding: SPACING.md, borderRadius: RADIUS.pill, alignItems: 'center' },
  permBtnText: { color: COLORS.surface0, fontWeight: '800', fontSize: 16 },

  // Photo / result
  photoWrap: { position: 'relative' },
  preview: { width: '100%', height: 300 },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },

  // Analyzing card
  analyzingCard: {
    margin: SPACING.md,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  progressTrack: {
    width: '80%',
    height: 3,
    backgroundColor: COLORS.white10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.limeAccent,
    borderRadius: 2,
  },
  analyzingText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  analyzingSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 6 },

  // Result
  resultCard: { margin: SPACING.md, padding: SPACING.md },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 12,
  },
  severityText: { fontWeight: '700', fontSize: 13 },
  problemTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confidenceLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  confidenceValue: { fontSize: 12, fontWeight: '800' },
  confidenceTrack: { height: 4, backgroundColor: COLORS.white10, borderRadius: 2, overflow: 'hidden', marginBottom: SPACING.md },
  confidenceFill: { height: 4, borderRadius: 2 },
  description: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  section: {
    backgroundColor: 'rgba(139,195,74,0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(139,195,74,0.15)',
  },
  sectionTitle: { fontWeight: '700', color: COLORS.limeAccent, fontSize: 13, marginBottom: 6 },
  sectionText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },

  resetBtnWrap: { margin: SPACING.md },
  resetBtn: { padding: SPACING.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  resetBtnText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 16 },

  // Toast
  toast: { position: 'absolute', bottom: 32, alignSelf: 'center' },
  toastInner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  toastText: { color: COLORS.surface0, fontWeight: '800', fontSize: 15 },

  // Camera view
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', padding: SPACING.md },
  instructionsWrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
  },
  instructions: { color: COLORS.white, fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },

  // Scan frame
  frame: {
    width: 260,
    height: 260,
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: COLORS.limeAccent,
    borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  frameTip: { fontSize: 11, color: COLORS.limeAccent, letterSpacing: 1, fontWeight: '600' },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  galleryBtn: { width: 56, height: 56, borderRadius: 28 },
  galleryBtnInner: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryText: { fontSize: 22 },

  // Capture button
  captureBtnWrap: {
    width: 90, height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
  },
  captureBtn: {
    width: 76, height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.limeAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  captureBtnInner: {
    width: 62, height: 62, borderRadius: 31,
  },
});

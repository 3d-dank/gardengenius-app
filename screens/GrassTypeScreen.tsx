import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY ?? '';
const GRASS_KEY = '@lawngenius_grasstype';

const GRASS_EMOJIS: Record<string, string> = {
  'Kentucky Bluegrass': '🌿',
  'Bermuda': '☀️',
  'Bermudagrass': '☀️',
  'Zoysia': '🌱',
  'Zoysiagrass': '🌱',
  'St. Augustine': '🌴',
  'Tall Fescue': '🌾',
  'Fine Fescue': '🌾',
  'Ryegrass': '🍃',
  'Perennial Ryegrass': '🍃',
  'Centipede': '🦗',
  'Centipedegrass': '🦗',
  'Buffalo Grass': '🦬',
  'Buffalograss': '🦬',
  'Bahia': '🌞',
  'Bahiagrass': '🌞',
};

function getGrassEmoji(grassType: string): string {
  for (const [key, emoji] of Object.entries(GRASS_EMOJIS)) {
    if (grassType.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '🌿';
}

const ANALYZING_STEPS = [
  'Examining grass blade structure...',
  'Checking color and texture...',
  'Consulting grass database...',
  'Building care recommendations...',
];

interface GrassResult {
  grassType: string;
  confidence: number;
  description: string;
  region: string;
  mowingHeight: string;
  wateringNeeds: string;
  fertilizerSchedule: string;
  commonProblems: string[];
  careTips: string[];
}

export default function GrassTypeScreen({ navigation }: any) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<GrassResult | null>(null);
  const [savedResult, setSavedResult] = useState<GrassResult | null>(null);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [savedToast, setSavedToast] = useState(false);
  const toastOpacity = new Animated.Value(0);

  useEffect(() => {
    loadSaved();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (analyzing) {
      setAnalyzingStep(0);
      interval = setInterval(() => {
        setAnalyzingStep(prev => (prev + 1) % ANALYZING_STEPS.length);
      }, 1400);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [analyzing]);

  const loadSaved = async () => {
    try {
      const raw = await AsyncStorage.getItem(GRASS_KEY);
      if (raw) setSavedResult(JSON.parse(raw));
    } catch { /* silent */ }
  };

  const showToast = () => {
    setSavedToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setSavedToast(false));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access needed', 'Please allow camera access to identify your grass.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setPhoto(res.assets[0].uri);
      analyze(res.assets[0].base64!);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setPhoto(res.assets[0].uri);
      analyze(res.assets[0].base64!);
    }
  };

  const analyze = async (base64: string) => {
    setAnalyzing(true);
    setResult(null);
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'You are a lawn grass expert. Analyze this photo and identify the grass type. Respond ONLY with valid JSON (no markdown, no code blocks). Use this exact structure: {"grassType":"Kentucky Bluegrass","confidence":85,"description":"2-3 sentence description of this grass","region":"Cool-season, Midwest/Northeast","mowingHeight":"2.5-3.5 inches","wateringNeeds":"1-1.5 inches per week","fertilizerSchedule":"Early spring and fall","commonProblems":["Dollar spot","Grubs","Summer drought stress"],"careTips":["Tip one","Tip two","Tip three"]}',
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' },
                },
              ],
            },
          ],
          max_tokens: 600,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const text: string = response.data.choices[0].message.content;
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const grassResult: GrassResult = JSON.parse(cleaned);
      setResult(grassResult);

      // Save to AsyncStorage
      await AsyncStorage.setItem(GRASS_KEY, JSON.stringify(grassResult));
      setSavedResult(grassResult);
      showToast();
    } catch (e) {
      Alert.alert('Analysis failed', 'Could not identify the grass. Please try again with a clearer photo.');
    }
    setAnalyzing(false);
  };

  const reset = () => {
    setPhoto(null);
    setResult(null);
  };

  const displayResult = result || savedResult;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0FFF4' }}>
      <ScrollView>
        <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
          {navigation && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>🌿 Identify My Grass</Text>
          <Text style={styles.headerSub}>AI-powered grass type identification</Text>
        </LinearGradient>

        {/* Camera Actions */}
        {!photo && (
          <View style={styles.captureCard}>
            <Text style={styles.captureInstruction}>
              📸 Point camera at your grass up close for best results
            </Text>
            <View style={styles.captureButtons}>
              <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
                <LinearGradient colors={['#4CAF50', '#1B4332']} style={styles.cameraBtnInner}>
                  <Text style={styles.cameraBtnIcon}>📷</Text>
                  <Text style={styles.cameraBtnText}>Take Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
                <Text style={styles.galleryBtnIcon}>🖼️</Text>
                <Text style={styles.galleryBtnText}>From Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Photo Preview */}
        {photo && (
          <View>
            <Image source={{ uri: photo }} style={styles.photoPreview} />

            {analyzing && (
              <View style={styles.analyzingCard}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.analyzingText}>🔍 {ANALYZING_STEPS[analyzingStep]}</Text>
              </View>
            )}

            {!analyzing && result && (
              <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                <Text style={styles.resetBtnText}>📷 Try Another Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Results */}
        {displayResult && !analyzing && (
          <View>
            {/* Grass Identity Card */}
            <View style={styles.resultCard}>
              <View style={styles.grassHeader}>
                <Text style={styles.grassEmoji}>{getGrassEmoji(displayResult.grassType)}</Text>
                <View style={styles.grassTitleBlock}>
                  <Text style={styles.grassType}>{displayResult.grassType}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {displayResult.confidence}% confidence
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.regionBadge}>
                <Text style={styles.regionText}>📍 {displayResult.region}</Text>
              </View>

              <Text style={styles.description}>{displayResult.description}</Text>
            </View>

            {/* Care Summary */}
            <View style={styles.careCard}>
              <Text style={styles.careTitle}>🌱 Care Requirements</Text>
              <View style={styles.careRow}>
                <Text style={styles.careIcon}>✂️</Text>
                <View style={styles.careContent}>
                  <Text style={styles.careLabel}>Mowing Height</Text>
                  <Text style={styles.careValue}>{displayResult.mowingHeight}</Text>
                </View>
              </View>
              <View style={styles.careRow}>
                <Text style={styles.careIcon}>💧</Text>
                <View style={styles.careContent}>
                  <Text style={styles.careLabel}>Watering Needs</Text>
                  <Text style={styles.careValue}>{displayResult.wateringNeeds}</Text>
                </View>
              </View>
              <View style={styles.careRow}>
                <Text style={styles.careIcon}>🌿</Text>
                <View style={styles.careContent}>
                  <Text style={styles.careLabel}>Fertilizer Schedule</Text>
                  <Text style={styles.careValue}>{displayResult.fertilizerSchedule}</Text>
                </View>
              </View>
            </View>

            {/* Common Problems */}
            {displayResult.commonProblems && displayResult.commonProblems.length > 0 && (
              <View style={styles.problemCard}>
                <Text style={styles.careTitle}>⚠️ Common Problems</Text>
                {displayResult.commonProblems.map((problem, i) => (
                  <View key={i} style={styles.problemRow}>
                    <Text style={styles.problemDot}>•</Text>
                    <Text style={styles.problemText}>{problem}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Care Tips */}
            {displayResult.careTips && displayResult.careTips.length > 0 && (
              <View style={[styles.problemCard, { marginBottom: 32 }]}>
                <Text style={styles.careTitle}>💡 Pro Care Tips</Text>
                {displayResult.careTips.map((tip, i) => (
                  <View key={i} style={styles.problemRow}>
                    <Text style={styles.tipNumber}>{i + 1}.</Text>
                    <Text style={styles.problemText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Empty State (no photo, no saved result) */}
        {!photo && !displayResult && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌾</Text>
            <Text style={styles.emptyTitle}>No Grass Identified Yet</Text>
            <Text style={styles.emptyText}>
              Take a close-up photo of your grass — we'll identify the variety and give you
              personalized care tips.
            </Text>
          </View>
        )}

        {/* Saved label */}
        {savedResult && !result && (
          <View style={styles.savedLabel}>
            <Text style={styles.savedLabelText}>
              📱 Showing your last identified grass — tap a photo button above to re-identify
            </Text>
          </View>
        )}
      </ScrollView>

      {savedToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>✅ Grass type saved</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingTop: 12,
  },
  backBtn: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#A8D5C2',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: '#A8D5C2',
    marginTop: 4,
  },
  captureCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  captureInstruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cameraBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cameraBtnInner: {
    padding: 16,
    alignItems: 'center',
  },
  cameraBtnIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  cameraBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: '#F0FFF4',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
  },
  galleryBtnIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  galleryBtnText: {
    color: '#1B4332',
    fontWeight: '600',
    fontSize: 15,
  },
  photoPreview: {
    width: '100%',
    height: 260,
  },
  analyzingCard: {
    backgroundColor: '#1B4332',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: {
    color: '#A8D5C2',
    fontSize: 16,
    fontWeight: '600',
  },
  resetBtn: {
    backgroundColor: '#1B4332',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  resultCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  grassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 14,
  },
  grassEmoji: {
    fontSize: 52,
  },
  grassTitleBlock: {
    flex: 1,
  },
  grassType: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B4332',
    marginBottom: 6,
  },
  confidenceBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    color: '#1B4332',
    fontWeight: '700',
    fontSize: 12,
  },
  regionBadge: {
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  regionText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  careCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  careTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 14,
  },
  careRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  careIcon: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  careContent: {
    flex: 1,
  },
  careLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  careValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  problemCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  problemDot: {
    color: '#EF4444',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  tipNumber: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    width: 18,
  },
  problemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },
  savedLabel: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFD60A',
  },
  savedLabelText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: '#1B4332',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  toastText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

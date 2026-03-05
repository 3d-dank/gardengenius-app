import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import MapView, { Marker, Polyline, Polygon, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const YARD_KEY = '@gardengenius_yard';
const MIN_DISTANCE_METERS = 2;
const MIN_POINTS = 3;

const PLOT_COLORS = ['#4CAF50', '#3B82F6', '#F97316', '#A855F7', '#EF4444', '#06B6D4'];
const PLOT_FILL_COLORS = [
  'rgba(76, 175, 80, 0.3)',
  'rgba(59, 130, 246, 0.3)',
  'rgba(249, 115, 22, 0.3)',
  'rgba(168, 85, 247, 0.3)',
  'rgba(239, 68, 68, 0.3)',
  'rgba(6, 182, 212, 0.3)',
];

const QUICK_NAMES = ['Front Yard', 'Back Yard', 'Left Side', 'Right Side'];

type ScreenState = 'idle' | 'recording' | 'complete' | 'naming';

interface Coord {
  latitude: number;
  longitude: number;
}

export interface YardPlot {
  id: string;
  name: string;
  sqft: number;
  acres: string;
  coords: Coord[];
  mappedAt: string;
}

export interface SavedYard {
  plots: YardPlot[];
  totalSqft: number;
  totalAcres: string;
  lastUpdated: string;
}

function distanceMeters(a: Coord, b: Coord): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aa =
    sinDLat * sinDLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function calculateAreaSqFt(coords: Coord[]): number {
  if (coords.length < 3) return 0;
  const toMeters = (lat: number, lng: number) => ({
    x: lng * 111320 * Math.cos((lat * Math.PI) / 180),
    y: lat * 110540,
  });
  const points = coords.map((c) => toMeters(c.latitude, c.longitude));
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return (Math.abs(area) / 2) * 10.7639;
}

export default function YardMapScreen({ navigation, route }: any) {
  const [state, setState] = useState<ScreenState>('idle');
  const [currentPos, setCurrentPos] = useState<Coord | null>(null);
  const [recordedPoints, setRecordedPoints] = useState<Coord[]>([]);
  const [calculatedSqFt, setCalculatedSqFt] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState(false);

  // Multi-plot state
  const [completedPlots, setCompletedPlots] = useState<YardPlot[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [customNameText, setCustomNameText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for recording banner
  useEffect(() => {
    if (state === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  // Load existing plots from storage (unless fresh=true param passed from "Remap All")
  useEffect(() => {
    const fresh = route?.params?.fresh as boolean | undefined;
    if (!fresh) {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(YARD_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.plots) {
              setCompletedPlots(parsed.plots as YardPlot[]);
            } else if (parsed.sqft) {
              // Old format — migrate to single plot
              const migratedPlot: YardPlot = {
                id: 'migrated',
                name: 'My Yard',
                sqft: parsed.sqft || 0,
                acres: parsed.acres || '0',
                coords: parsed.coords || [],
                mappedAt: parsed.mappedAt || new Date().toISOString(),
              };
              setCompletedPlots([migratedPlot]);
            }
          }
        } catch { /* silent */ }
      })();
    }
  }, []);

  // Request permission and get initial position
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required to map your yard boundary.');
        return;
      }
      setHasPermission(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();

    return () => {
      watchRef.current?.remove();
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!currentPos) return;
    setRecordedPoints([currentPos]);
    setState('recording');

    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 1, timeInterval: 500 },
      (loc) => {
        const newCoord: Coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentPos(newCoord);
        setRecordedPoints((prev) => {
          const last = prev[prev.length - 1];
          if (!last || distanceMeters(last, newCoord) >= MIN_DISTANCE_METERS) {
            return [...prev, newCoord];
          }
          return prev;
        });
        mapRef.current?.animateCamera({ center: newCoord }, { duration: 300 });
      }
    );
  }, [currentPos]);

  const stopRecording = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;

    if (recordedPoints.length < MIN_POINTS) {
      Alert.alert('Too Few Points', `Walk more of your yard first. Need at least ${MIN_POINTS} points (currently ${recordedPoints.length}).`);
      return;
    }

    const sqft = calculateAreaSqFt(recordedPoints);
    setCalculatedSqFt(sqft);
    setState('complete');
  }, [recordedPoints]);

  const cancelRecording = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    setRecordedPoints([]);
    setState('idle');
  }, []);

  const confirmPlot = useCallback(() => {
    setSelectedName('');
    setCustomNameText('');
    setShowCustomInput(false);
    setState('naming');
  }, []);

  const redo = useCallback(() => {
    setRecordedPoints([]);
    setCalculatedSqFt(0);
    setState('idle');
  }, []);

  // Derive the effective name for the current plot
  const getEffectiveName = useCallback((): string => {
    if (showCustomInput && customNameText.trim()) return customNameText.trim();
    if (!showCustomInput && selectedName) return selectedName;
    return `Plot ${completedPlots.length + 1}`;
  }, [showCustomInput, customNameText, selectedName, completedPlots.length]);

  const buildCurrentPlot = useCallback((): YardPlot => {
    const sqft = Math.round(calculatedSqFt);
    const acres = (calculatedSqFt / 43560).toFixed(3);
    return {
      id: Date.now().toString(),
      name: getEffectiveName(),
      sqft,
      acres,
      coords: recordedPoints,
      mappedAt: new Date().toISOString(),
    };
  }, [calculatedSqFt, recordedPoints, getEffectiveName]);

  const addAnotherPlot = useCallback(() => {
    const newPlot = buildCurrentPlot();
    setCompletedPlots(prev => [...prev, newPlot]);
    setRecordedPoints([]);
    setCalculatedSqFt(0);
    setState('idle');
  }, [buildCurrentPlot]);

  const saveAllAndDone = useCallback(async () => {
    const newPlot = buildCurrentPlot();
    const allPlots = [...completedPlots, newPlot];
    const totalSqft = allPlots.reduce((sum, p) => sum + p.sqft, 0);
    const totalAcres = (totalSqft / 43560).toFixed(3);
    const savedYard: SavedYard = {
      plots: allPlots,
      totalSqft,
      totalAcres,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(YARD_KEY, JSON.stringify(savedYard));
    Alert.alert(
      'Yard Saved! 🎉',
      `${allPlots.length} plot${allPlots.length > 1 ? 's' : ''} saved · ${totalSqft.toLocaleString()} sq ft total`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }, [buildCurrentPlot, completedPlots, navigation]);

  const saveExistingAndDone = useCallback(async () => {
    const totalSqft = completedPlots.reduce((sum, p) => sum + p.sqft, 0);
    const totalAcres = (totalSqft / 43560).toFixed(3);
    const savedYard: SavedYard = {
      plots: completedPlots,
      totalSqft,
      totalAcres,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(YARD_KEY, JSON.stringify(savedYard));
    navigation.goBack();
  }, [completedPlots, navigation]);

  const initialRegion = currentPos
    ? { latitude: currentPos.latitude, longitude: currentPos.longitude, latitudeDelta: 0.002, longitudeDelta: 0.002 }
    : { latitude: 44.97, longitude: -93.27, latitudeDelta: 0.002, longitudeDelta: 0.002 };

  const acres = calculatedSqFt ? (calculatedSqFt / 43560).toFixed(3) : '0';
  const currentPlotColorIndex = completedPlots.length % PLOT_COLORS.length;

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        mapType="satellite"
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Current position dot */}
        {currentPos && (
          <Marker coordinate={currentPos} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.blueDot}>
              <View style={styles.blueDotInner} />
            </View>
          </Marker>
        )}

        {/* Previously completed plots (each with distinct color) */}
        {completedPlots.map((plot, index) => (
          <Polygon
            key={plot.id}
            coordinates={plot.coords}
            strokeColor={PLOT_COLORS[index % PLOT_COLORS.length]}
            fillColor={PLOT_FILL_COLORS[index % PLOT_FILL_COLORS.length]}
            strokeWidth={3}
          />
        ))}

        {/* Recording dots (current plot in progress) */}
        {state !== 'complete' && state !== 'naming' && recordedPoints.map((pt, i) => (
          <Marker key={i} coordinate={pt} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.greenDot} />
          </Marker>
        ))}

        {/* Polyline while recording */}
        {state === 'recording' && recordedPoints.length > 1 && (
          <Polyline
            coordinates={recordedPoints}
            strokeColor={PLOT_COLORS[currentPlotColorIndex]}
            strokeWidth={3}
          />
        )}

        {/* Completed polygon for current plot (complete or naming state) */}
        {(state === 'complete' || state === 'naming') && recordedPoints.length >= 3 && (
          <Polygon
            coordinates={recordedPoints}
            strokeColor={PLOT_COLORS[currentPlotColorIndex]}
            fillColor={PLOT_FILL_COLORS[currentPlotColorIndex]}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Plots added counter */}
      {completedPlots.length > 0 && (state === 'idle' || state === 'recording') && (
        <View style={styles.plotsCounter}>
          <Text style={styles.plotsCounterText}>
            ✅ {completedPlots.length} plot{completedPlots.length > 1 ? 's' : ''} added
          </Text>
        </View>
      )}

      {/* Recording banner */}
      {state === 'recording' && (
        <Animated.View style={[styles.recordingBanner, { opacity: pulseAnim }]}>
          <Text style={styles.recordingBannerText}>🔴 Recording... tap Done when you complete the loop</Text>
          <Text style={styles.pointCount}>{recordedPoints.length} points recorded</Text>
        </Animated.View>
      )}

      {/* ── IDLE STATE ── */}
      {state === 'idle' && (
        <View style={styles.bottomPanel}>
          <Text style={styles.instructionText}>
            {completedPlots.length > 0
              ? 'Walk around the next area to map it'
              : 'Walk around the perimeter of your lawn and tap Done when finished'}
          </Text>
          {!hasPermission ? (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionWarningText}>⚠️ Location permission required</Text>
            </View>
          ) : !currentPos ? (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionWarningText}>📡 Getting your GPS position...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={startRecording}>
              <Text style={styles.startBtnText}>🚶 Walk Your Yard Boundary</Text>
            </TouchableOpacity>
          )}

          {/* Show "Save & Done" if user already added plots in this session */}
          {completedPlots.length > 0 && (
            <TouchableOpacity style={styles.saveExistingBtn} onPress={saveExistingAndDone}>
              <Text style={styles.saveExistingBtnText}>
                💾 Save & Done ({completedPlots.length} plot{completedPlots.length > 1 ? 's' : ''})
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelTextBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelTextBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── RECORDING STATE ── */}
      {state === 'recording' && (
        <View style={styles.recordingControls}>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelRecording}>
            <Text style={styles.cancelBtnText}>✕ Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.doneBtn, recordedPoints.length < MIN_POINTS && styles.doneBtnDisabled]}
            onPress={stopRecording}
            disabled={recordedPoints.length < MIN_POINTS}
          >
            <Text style={styles.doneBtnText}>✓ Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── COMPLETE STATE ── */}
      {state === 'complete' && (
        <View style={styles.resultsPanel}>
          <Text style={styles.resultTitle}>🎉 Area Mapped!</Text>
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{Math.round(calculatedSqFt).toLocaleString()}</Text>
              <Text style={styles.resultLabel}>sq ft</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{acres}</Text>
              <Text style={styles.resultLabel}>acres</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{recordedPoints.length}</Text>
              <Text style={styles.resultLabel}>GPS pts</Text>
            </View>
          </View>
          <View style={styles.resultBtns}>
            <TouchableOpacity style={styles.redoBtn} onPress={redo}>
              <Text style={styles.redoBtnText}>↺ Redo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmPlot}>
              <Text style={styles.confirmBtnText}>✓ Looks good!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── NAMING STATE ── */}
      {state === 'naming' && (
        <View style={styles.namingPanel}>
          <Text style={styles.namingTitle}>Name This Area</Text>
          <Text style={styles.namingSubtitle}>
            {Math.round(calculatedSqFt).toLocaleString()} sq ft · {acres} acres
          </Text>

          {/* Quick name chips */}
          <View style={styles.quickNameRow}>
            {QUICK_NAMES.map((name) => {
              const isSelected = !showCustomInput && selectedName === name;
              return (
                <TouchableOpacity
                  key={name}
                  style={[styles.quickNameBtn, isSelected && styles.quickNameBtnSelected]}
                  onPress={() => { setSelectedName(name); setShowCustomInput(false); }}
                >
                  <Text style={[styles.quickNameBtnText, isSelected && styles.quickNameBtnTextSelected]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.quickNameBtn, showCustomInput && styles.quickNameBtnSelected]}
              onPress={() => { setShowCustomInput(true); setSelectedName(''); }}
            >
              <Text style={[styles.quickNameBtnText, showCustomInput && styles.quickNameBtnTextSelected]}>
                Custom...
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom name text input */}
          {showCustomInput && (
            <TextInput
              style={styles.customNameInput}
              placeholder="e.g. Garden Strip, Dog Run..."
              placeholderTextColor="#9CA3AF"
              value={customNameText}
              onChangeText={setCustomNameText}
              autoFocus
            />
          )}

          {/* Action buttons */}
          <View style={styles.namingBtns}>
            <TouchableOpacity style={styles.addAnotherBtn} onPress={addAnotherPlot}>
              <Text style={styles.addAnotherBtnText}>＋ Add Another Plot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneAllBtn} onPress={saveAllAndDone}>
              <Text style={styles.doneAllBtnText}>✓ Done — Save All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // GPS dots
  blueDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  blueDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6' },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 1.5, borderColor: '#fff' },

  // Plots counter badge
  plotsCounter: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(27, 67, 50, 0.92)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },
  plotsCounterText: { color: '#4CAF50', fontWeight: '700', fontSize: 13 },

  // Recording banner
  recordingBanner: {
    position: 'absolute', top: 60, left: 16, right: 16,
    backgroundColor: '#1B4332', borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 8,
  },
  recordingBannerText: { color: '#4CAF50', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  pointCount: { color: '#A8D5C2', fontSize: 12, marginTop: 4 },

  // Idle bottom panel
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(27, 67, 50, 0.96)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  instructionText: { color: '#A8D5C2', fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  startBtn: {
    backgroundColor: '#4CAF50', borderRadius: 16, padding: 18, alignItems: 'center',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  permissionWarning: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  permissionWarningText: { color: '#FFD60A', fontWeight: '600', fontSize: 14 },
  saveExistingBtn: {
    marginTop: 12, backgroundColor: 'rgba(76,175,80,0.2)', borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#4CAF50',
  },
  saveExistingBtnText: { color: '#4CAF50', fontWeight: '700', fontSize: 15 },
  cancelTextBtn: { marginTop: 16, alignItems: 'center' },
  cancelTextBtnText: { color: '#A8D5C2', fontSize: 14, fontWeight: '600' },

  // Recording controls
  recordingControls: {
    position: 'absolute', bottom: 50, left: 24, right: 24,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
  cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  doneBtn: {
    backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28,
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
  },
  doneBtnDisabled: { backgroundColor: '#6B7280', shadowOpacity: 0 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Results panel (complete state)
  resultsPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(27, 67, 50, 0.97)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 20 },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginBottom: 20,
  },
  resultItem: { alignItems: 'center', flex: 1 },
  resultValue: { fontSize: 22, fontWeight: '800', color: '#4CAF50' },
  resultLabel: { fontSize: 12, color: '#A8D5C2', marginTop: 4 },
  resultDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  resultBtns: { flexDirection: 'row', gap: 12 },
  redoBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 16, alignItems: 'center' },
  redoBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  confirmBtn: {
    flex: 2, backgroundColor: '#4CAF50', borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
  },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Naming panel
  namingPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(27, 67, 50, 0.97)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  namingTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  namingSubtitle: { fontSize: 13, color: '#A8D5C2', textAlign: 'center', marginBottom: 18 },
  quickNameRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  quickNameBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  quickNameBtnSelected: {
    backgroundColor: '#4CAF50', borderColor: '#4CAF50',
  },
  quickNameBtnText: { color: '#A8D5C2', fontWeight: '600', fontSize: 13 },
  quickNameBtnTextSelected: { color: '#fff' },
  customNameInput: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, borderWidth: 1.5, borderColor: '#4CAF50',
    color: '#fff', fontSize: 15, padding: 12, marginBottom: 14,
  },
  namingBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  addAnotherBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 15, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  addAnotherBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  doneAllBtn: {
    flex: 1, backgroundColor: '#4CAF50', borderRadius: 14, padding: 15, alignItems: 'center',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
  },
  doneAllBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

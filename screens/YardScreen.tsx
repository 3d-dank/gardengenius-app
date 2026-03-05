import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { Polygon, PROVIDER_DEFAULT } from 'react-native-maps';

const ZONES: Record<string, { zone: string; grass: string; soil: string }> = {
  '1': { zone: '3b-4b', grass: 'Kentucky Bluegrass, Fine Fescue', soil: 'Often clay-heavy. Add organic matter annually.' },
  '2': { zone: '4b-5b', grass: 'Kentucky Bluegrass, Tall Fescue', soil: 'Loamy to clay. Good drainage important.' },
  '3': { zone: '5b-6b', grass: 'Tall Fescue, Zoysia', soil: 'Mixed. Test pH — target 6.0-7.0.' },
  '4': { zone: '6b-7b', grass: 'Bermuda, Zoysia, St. Augustine', soil: 'Sandy to loamy. Good moisture retention.' },
  '5': { zone: '7b-9b', grass: 'Bermuda, St. Augustine, Centipede', soil: 'Sandy soils common. Frequent irrigation needed.' },
};

const YARD_KEY = '@lawngenius_yard';

const PLOT_COLORS = ['#4CAF50', '#3B82F6', '#F97316', '#A855F7', '#EF4444', '#06B6D4'];
const PLOT_FILL_COLORS = [
  'rgba(76, 175, 80, 0.35)',
  'rgba(59, 130, 246, 0.35)',
  'rgba(249, 115, 22, 0.35)',
  'rgba(168, 85, 247, 0.35)',
  'rgba(239, 68, 68, 0.35)',
  'rgba(6, 182, 212, 0.35)',
];

interface YardPlot {
  id: string;
  name: string;
  sqft: number;
  acres: string;
  coords: Array<{ latitude: number; longitude: number }>;
  mappedAt: string;
}

interface SavedYard {
  plots: YardPlot[];
  totalSqft: number;
  totalAcres: string;
  lastUpdated: string;
}

/** Parse raw AsyncStorage value — handles both old and new formats */
function parseSavedYard(raw: string): SavedYard | null {
  try {
    const parsed = JSON.parse(raw);
    // New format
    if (parsed.plots) {
      return parsed as SavedYard;
    }
    // Old format: { sqft, acres, coords, mappedAt }
    if (parsed.sqft !== undefined) {
      return {
        plots: [{
          id: 'migrated',
          name: 'My Yard',
          sqft: parsed.sqft || 0,
          acres: parsed.acres || '0',
          coords: parsed.coords || [],
          mappedAt: parsed.mappedAt || new Date().toISOString(),
        }],
        totalSqft: parsed.sqft || 0,
        totalAcres: parsed.acres || '0',
        lastUpdated: parsed.mappedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getRegionForPlots(plots: YardPlot[]) {
  const allCoords = plots.flatMap(p => p.coords);
  if (allCoords.length === 0) return null;
  const lats = allCoords.map(c => c.latitude);
  const lngs = allCoords.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.001),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.001),
  };
}

export default function YardScreen({ navigation }: any) {
  const [savedYard, setSavedYard] = useState<SavedYard | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zoneInfo, setZoneInfo] = useState<{ zone: string; grass: string; soil: string } | null>(null);
  const [locError, setLocError] = useState('');

  const loadYard = async () => {
    try {
      const raw = await AsyncStorage.getItem(YARD_KEY);
      setSavedYard(raw ? parseSavedYard(raw) : null);
    } catch { /* silent */ }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLocError('Location permission denied'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;
    setLocation({ lat: latitude, lng: longitude });
    const zoneKey = latitude > 47 ? '1' : latitude > 44 ? '2' : latitude > 40 ? '3' : latitude > 35 ? '4' : '5';
    setZoneInfo(ZONES[zoneKey]);
  };

  useFocusEffect(
    useCallback(() => {
      loadYard();
      getLocation();
    }, [])
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const deletePlot = async (plotId: string) => {
    if (!savedYard) return;
    Alert.alert(
      'Delete Plot',
      'Remove this plot from your yard map?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const remaining = savedYard.plots.filter(p => p.id !== plotId);
            if (remaining.length === 0) {
              await AsyncStorage.removeItem(YARD_KEY);
              setSavedYard(null);
            } else {
              const totalSqft = remaining.reduce((sum, p) => sum + p.sqft, 0);
              const updated: SavedYard = {
                plots: remaining,
                totalSqft,
                totalAcres: (totalSqft / 43560).toFixed(3),
                lastUpdated: new Date().toISOString(),
              };
              await AsyncStorage.setItem(YARD_KEY, JSON.stringify(updated));
              setSavedYard(updated);
            }
          },
        },
      ]
    );
  };

  const remapAll = () => {
    Alert.alert(
      'Remap All Plots',
      'This will clear all existing plot data and start fresh. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start Over',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(YARD_KEY);
            setSavedYard(null);
            navigation.navigate('YardMap', { fresh: true });
          },
        },
      ]
    );
  };

  const mapRegion = savedYard ? getRegionForPlots(savedYard.plots) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0FFF4' }}>
      <ScrollView>
        <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
          <Text style={styles.title}>🗺️ My Yard</Text>
          <Text style={styles.subtitle}>Size & soil intelligence</Text>
        </LinearGradient>

        {/* ── Yard Size / Mapping Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📐 Yard Size</Text>

          {savedYard ? (
            <View>
              {/* Total size hero */}
              <View style={styles.totalSizeBox}>
                <Text style={styles.totalSqft}>{savedYard.totalSqft.toLocaleString()}</Text>
                <Text style={styles.totalSqftLabel}>sq ft total</Text>
                <Text style={styles.totalAcres}>{savedYard.totalAcres} acres</Text>
                {savedYard.plots.length > 1 && (
                  <Text style={styles.plotCountBadge}>
                    {savedYard.plots.length} plots
                  </Text>
                )}
              </View>

              {/* Map thumbnail — all plots */}
              {mapRegion && (
                <View style={styles.mapThumbContainer} pointerEvents="none">
                  <MapView
                    style={styles.mapThumb}
                    provider={PROVIDER_DEFAULT}
                    mapType="satellite"
                    initialRegion={mapRegion}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    showsScale={false}
                  >
                    {savedYard.plots.map((plot, index) => (
                      <Polygon
                        key={plot.id}
                        coordinates={plot.coords}
                        strokeColor={PLOT_COLORS[index % PLOT_COLORS.length]}
                        fillColor={PLOT_FILL_COLORS[index % PLOT_FILL_COLORS.length]}
                        strokeWidth={2.5}
                      />
                    ))}
                  </MapView>
                </View>
              )}

              {/* Individual plot list */}
              <Text style={styles.plotListTitle}>Mapped Areas</Text>
              {savedYard.plots.map((plot, index) => (
                <View key={plot.id} style={styles.plotRow}>
                  <View style={[styles.plotColorDot, { backgroundColor: PLOT_COLORS[index % PLOT_COLORS.length] }]} />
                  <View style={styles.plotInfo}>
                    <Text style={styles.plotName}>{plot.name}</Text>
                    <Text style={styles.plotDetails}>
                      {plot.sqft.toLocaleString()} sq ft · {plot.acres} acres
                    </Text>
                    <Text style={styles.plotDate}>Mapped {formatDate(plot.mappedAt)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deletePlotBtn}
                    onPress={() => deletePlot(plot.id)}
                  >
                    <Text style={styles.deletePlotBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Action buttons */}
              <View style={styles.yardActionBtns}>
                <TouchableOpacity
                  style={styles.addPlotBtn}
                  onPress={() => navigation.navigate('YardMap')}
                >
                  <Text style={styles.addPlotBtnText}>＋ Add Another Plot</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.remapBtn} onPress={remapAll}>
                  <Text style={styles.remapBtnText}>🔄 Remap All</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Not yet mapped */
            <View>
              <Text style={styles.cardHint}>
                Walk your yard boundary to get a precise GPS measurement — no guessing required.
              </Text>
              <TouchableOpacity
                style={styles.mapYardBtn}
                onPress={() => navigation.navigate('YardMap')}
              >
                <LinearGradient colors={['#4CAF50', '#1B4332']} style={styles.mapYardBtnInner}>
                  <Text style={styles.mapYardBtnText}>🗺️ Map My Yard</Text>
                  <Text style={styles.mapYardBtnSub}>Walk the boundary for a precise measurement</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Location & Zone */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Your Location</Text>
          {locError ? <Text style={styles.error}>{locError}</Text> : null}
          {location ? (
            <Text style={styles.coords}>📌 {location.lat.toFixed(4)}°N, {Math.abs(location.lng).toFixed(4)}°W</Text>
          ) : (
            <Text style={styles.loading}>Getting your location...</Text>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={getLocation}>
            <Text style={styles.refreshBtnText}>🔄 Refresh Location</Text>
          </TouchableOpacity>
        </View>

        {/* Zone Intelligence */}
        {zoneInfo && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🌡️ USDA Hardiness Zone</Text>
            <View style={styles.zoneBadge}><Text style={styles.zoneText}>Zone {zoneInfo.zone}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>🌱 Best Grass Types</Text><Text style={styles.infoValue}>{zoneInfo.grass}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>🪱 Soil Notes</Text><Text style={styles.infoValue}>{zoneInfo.soil}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>📅 Fertilize Season</Text><Text style={styles.infoValue}>April–October (cool season grass)</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>🌿 Overseed Window</Text><Text style={styles.infoValue}>Late August – Mid September</Text></View>
          </View>
        )}

        {/* Identify My Grass */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌾 Grass Type</Text>
          <Text style={styles.cardHint}>
            Not sure what grass you have? Let AI identify your grass type and give you personalized care tips.
          </Text>
          <TouchableOpacity
            style={styles.grassIdBtn}
            onPress={() => navigation.navigate('GrassType')}
          >
            <LinearGradient colors={['#4CAF50', '#1B4332']} style={styles.grassIdBtnInner}>
              <Text style={styles.grassIdBtnText}>🌿 Identify My Grass</Text>
              <Text style={styles.grassIdBtnSub}>Take a photo — AI does the rest</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Seasonal Tips */}
        <View style={[styles.card, { marginBottom: 32 }]}>
          <Text style={styles.cardTitle}>📆 Seasonal Calendar</Text>
          {[
            { month: 'March–April', task: 'Pre-emergent herbicide, first fertilizer when soil hits 55°F' },
            { month: 'May–June', task: 'Fertilize, weed control, raise mowing height' },
            { month: 'July–Aug', task: 'Fungicide if humid, deep watering 1"/week' },
            { month: 'Sept–Oct', task: 'Overseeding, fall fertilizer, aeration' },
            { month: 'Nov–Mar', task: 'Winterizer fertilizer, equipment storage' },
          ].map((item, i) => (
            <View key={i} style={styles.calRow}>
              <Text style={styles.calMonth}>{item.month}</Text>
              <Text style={styles.calTask}>{item.task}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#A8D5C2', marginTop: 4 },
  card: {
    backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1B4332', marginBottom: 8 },
  cardHint: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 18 },

  // Map Yard button (unmapped state)
  mapYardBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  mapYardBtnInner: { padding: 20, alignItems: 'center' },
  mapYardBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  mapYardBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Total size hero
  totalSizeBox: {
    alignItems: 'center', backgroundColor: '#F0FFF4', borderRadius: 16,
    padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#D1FAE5',
  },
  totalSqft: { fontSize: 42, fontWeight: '900', color: '#1B4332' },
  totalSqftLabel: { fontSize: 16, color: '#4CAF50', fontWeight: '600', marginTop: 2 },
  totalAcres: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  plotCountBadge: {
    marginTop: 8, backgroundColor: '#1B4332', color: '#fff',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20,
    fontSize: 13, fontWeight: '700', overflow: 'hidden',
  },

  // Map thumbnail
  mapThumbContainer: {
    borderRadius: 14, overflow: 'hidden', marginBottom: 18,
    height: 180, borderWidth: 1.5, borderColor: '#D1FAE5',
  },
  mapThumb: { flex: 1 },

  // Plot list
  plotListTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  plotRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  plotColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12, flexShrink: 0 },
  plotInfo: { flex: 1 },
  plotName: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  plotDetails: { fontSize: 13, color: '#4CAF50', fontWeight: '600', marginTop: 1 },
  plotDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  deletePlotBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  deletePlotBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },

  // Action buttons
  yardActionBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  addPlotBtn: {
    flex: 1, backgroundColor: '#4CAF50', borderRadius: 12, padding: 13, alignItems: 'center',
    shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
  },
  addPlotBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  remapBtn: {
    flex: 1, backgroundColor: '#F0FFF4', borderRadius: 12, padding: 13, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#D1FAE5',
  },
  remapBtnText: { color: '#1B4332', fontWeight: '600', fontSize: 14 },

  // Location card
  error: { color: '#EF4444', fontSize: 14 },
  coords: { fontSize: 14, color: '#374151', marginBottom: 12 },
  loading: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  refreshBtn: { backgroundColor: '#F0FFF4', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#D1FAE5' },
  refreshBtnText: { color: '#1B4332', fontWeight: '600', fontSize: 14 },

  // Zone
  zoneBadge: { backgroundColor: '#1B4332', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 14 },
  zoneText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#374151', lineHeight: 20 },

  // Calendar
  calRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  calMonth: { fontSize: 13, fontWeight: '700', color: '#4CAF50', marginBottom: 2 },
  calTask: { fontSize: 13, color: '#374151', lineHeight: 18 },

  // Grass ID button
  grassIdBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  grassIdBtnInner: { padding: 20, alignItems: 'center' },
  grassIdBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  grassIdBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});

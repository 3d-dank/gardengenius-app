import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  requestPermissions,
  scheduleWeeklyReport,
  scheduleSeasonalReminder,
  scheduleScanReminder,
  cancelAllNotifications,
  sendTestNotification,
} from '../lib/notifications';
import {
  COLORS, GRADIENTS, GLASS, NEO, RADIUS, SPACING,
} from '../lib/theme';

const HISTORY_KEY = '@gardengenius_history';
const NOTIF_WEEKLY_KEY = '@gardengenius_notif_weekly';
const NOTIF_SEASONAL_KEY = '@gardengenius_notif_seasonal';
const NOTIF_SCAN_KEY = '@gardengenius_notif_scan';

interface HistoryEntry { id: string; date: string; }

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ProfileScreen() {
  const [totalScans, setTotalScans] = useState(0);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [weeklyEnabled, setWeeklyEnabled] = useState(true);
  const [seasonalEnabled, setSeasonalEnabled] = useState(true);
  const [scanEnabled, setScanEnabled] = useState(true);

  const loadStats = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      setTotalScans(history.length);
      setLastScanDate(history.length > 0 ? history[0].date : null);
    } catch { /* silent */ }
  };

  const loadNotifPrefs = async () => {
    try {
      const [w, s, sc] = await Promise.all([
        AsyncStorage.getItem(NOTIF_WEEKLY_KEY),
        AsyncStorage.getItem(NOTIF_SEASONAL_KEY),
        AsyncStorage.getItem(NOTIF_SCAN_KEY),
      ]);
      setWeeklyEnabled(w !== 'false');
      setSeasonalEnabled(s !== 'false');
      setScanEnabled(sc !== 'false');
    } catch { /* silent */ }
  };

  useFocusEffect(useCallback(() => {
    loadStats();
    loadNotifPrefs();
  }, []));

  const freeScansUsed = Math.min(totalScans, 3);

  const handleWeeklyToggle = async (value: boolean) => {
    await Haptics.selectionAsync();
    setWeeklyEnabled(value);
    await AsyncStorage.setItem(NOTIF_WEEKLY_KEY, value ? 'true' : 'false');
    if (value) {
      const granted = await requestPermissions();
      if (granted) await scheduleWeeklyReport();
    } else {
      await cancelAllNotifications();
      if (seasonalEnabled) await scheduleSeasonalReminder();
    }
  };

  const handleSeasonalToggle = async (value: boolean) => {
    await Haptics.selectionAsync();
    setSeasonalEnabled(value);
    await AsyncStorage.setItem(NOTIF_SEASONAL_KEY, value ? 'true' : 'false');
    if (value) {
      const granted = await requestPermissions();
      if (granted) await scheduleSeasonalReminder();
    } else {
      await cancelAllNotifications();
      if (weeklyEnabled) await scheduleWeeklyReport();
    }
  };

  const handleScanToggle = async (value: boolean) => {
    await Haptics.selectionAsync();
    setScanEnabled(value);
    await AsyncStorage.setItem(NOTIF_SCAN_KEY, value ? 'true' : 'false');
    if (!value) {
      await cancelAllNotifications();
      if (weeklyEnabled) await scheduleWeeklyReport();
      if (seasonalEnabled) await scheduleSeasonalReminder();
    }
  };

  const handleTestNotification = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Notifications Disabled', 'Please enable notifications in your device Settings to receive garden reminders.');
      return;
    }
    await sendTestNotification();
    Alert.alert('Test Sent!', 'You should receive a notification shortly.');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Header ──────────────────────────────────────────────────── */}
          <LinearGradient colors={GRADIENTS.header} style={styles.header}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🌿</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerName}>My Garden Profile</Text>
                <Text style={styles.headerSub}>Garden settings & preferences</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ── Stats Row ─────────────────────────────────────────────── */}
          <View style={styles.statsWrap}>
            <View style={[GLASS.card, styles.statsCard]}>
              {[
                { value: String(totalScans), label: 'Total Scans', color: COLORS.limeAccent },
                { value: `${freeScansUsed}/3`, label: 'Free Used', color: COLORS.earthWarm },
                { value: lastScanDate ? formatDate(lastScanDate) : '—', label: 'Last Scan', color: COLORS.skyBlue },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <View style={styles.statDivider} />}
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── Plan Card ─────────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <LinearGradient
              colors={['rgba(160,82,45,0.2)', 'rgba(26,61,15,0.9)']}
              style={[GLASS.card, styles.planCard]}
            >
              <View style={styles.planBadgeRow}>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE PLAN</Text>
                </View>
                <Text style={styles.scanUsed}>{freeScansUsed} of 3 free scans this month</Text>
              </View>
              <View style={styles.usageBarTrack}>
                <LinearGradient
                  colors={GRADIENTS.gold}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.usageBarFill, { width: `${(freeScansUsed / 3) * 100}%` as any }]}
                />
              </View>
              <TouchableOpacity style={[NEO.buttonPrimary, { marginTop: SPACING.md }]} activeOpacity={0.88}>
                <LinearGradient colors={GRADIENTS.gold} style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>⚡ Upgrade to Pro — $4.99/mo</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.proFeatures}>Unlimited scans · History · Planting calendar · Priority AI</Text>
            </LinearGradient>
          </View>

          {/* ── Garden Settings ────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>My Garden</Text>
            <View style={[GLASS.card, styles.settingsCard]}>
              {[
                { icon: '🌱', label: 'Garden Type', value: 'Vegetable, Flower, Herb, Mixed' },
                { icon: '📍', label: 'Location / Zip', value: 'For frost dates & planting calendar' },
                { icon: '📐', label: 'Garden Size (sq ft)', value: 'Not set' },
                { icon: '🪨', label: 'Soil Type', value: 'Clay, Loam, Sandy, Raised Bed' },
                { icon: '☀️', label: 'Sun Exposure', value: 'Full Sun, Partial Shade, Full Shade' },
                { icon: '💧', label: 'Watering Method', value: 'Manual, Drip, Sprinkler' },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.settingsRow, i > 0 && styles.settingsRowBorder]}
                  activeOpacity={0.7}
                  onPress={() => Haptics.selectionAsync()}
                >
                  <View style={styles.settingsIconWrap}>
                    <Text style={styles.settingsIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.settingsContent}>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    <Text style={styles.settingsValue}>{item.value}</Text>
                  </View>
                  <Text style={styles.settingsArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Notifications ──────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>Notifications</Text>
            <View style={[GLASS.card, styles.settingsCard]}>
              {[
                {
                  label: 'Weekly Garden Report',
                  sub: 'Every Sunday at 8am',
                  value: weeklyEnabled,
                  onChange: handleWeeklyToggle,
                },
                {
                  label: 'Seasonal Planting Tips',
                  sub: 'Monthly care reminders',
                  value: seasonalEnabled,
                  onChange: handleSeasonalToggle,
                },
                {
                  label: 'Scan Reminders',
                  sub: 'If no scan in 14 days',
                  value: scanEnabled,
                  onChange: handleScanToggle,
                },
              ].map((item, i) => (
                <View key={item.label} style={[styles.toggleRow, i > 0 && styles.settingsRowBorder]}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>{item.label}</Text>
                    <Text style={styles.toggleSub}>{item.sub}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onChange}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: COLORS.limeAccent + '60' }}
                    thumbColor={item.value ? COLORS.limeAccent : 'rgba(255,255,255,0.3)'}
                  />
                </View>
              ))}

              <View style={[styles.settingsRowBorder, { padding: SPACING.md }]}>
                <TouchableOpacity
                  style={styles.testBtn}
                  onPress={handleTestNotification}
                  activeOpacity={0.8}
                >
                  <Text style={styles.testBtnText}>🔔 Send Test Notification</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.version}>GardenGenius v1.0 · Made with 🌿 by Top Dog AI</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface0 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(139,195,74,0.15)',
    borderWidth: 2, borderColor: COLORS.borderBright,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 30 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 3 },

  statsWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  statsCard: { flexDirection: 'row', padding: SPACING.md },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border },

  sectionWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  planCard: { padding: SPACING.md, overflow: 'hidden' },
  planBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  freeBadge: {
    backgroundColor: 'rgba(160,82,45,0.2)',
    borderWidth: 1, borderColor: 'rgba(160,82,45,0.4)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill,
  },
  freeBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.harvestGold, letterSpacing: 1 },
  scanUsed: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  usageBarTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: SPACING.sm },
  usageBarFill: { height: 4, borderRadius: 2 },
  upgradeBtn: { padding: SPACING.md, borderRadius: RADIUS.pill, alignItems: 'center' },
  upgradeBtnText: { color: COLORS.surface0, fontWeight: '800', fontSize: 15 },
  proFeatures: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 16 },

  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: SPACING.sm, marginLeft: 4,
  },
  settingsCard: { padding: 0, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  settingsRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  settingsIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(139,195,74,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm,
  },
  settingsIcon: { fontSize: 18 },
  settingsContent: { flex: 1 },
  settingsLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  settingsValue: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  settingsArrow: { fontSize: 22, color: COLORS.textMuted },

  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  toggleSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  testBtn: {
    backgroundColor: 'rgba(139,195,74,0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  testBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.limeAccent },

  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, padding: SPACING.lg },
});

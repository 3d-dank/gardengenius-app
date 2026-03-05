import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GRADIENTS, GLASS, SPACING, RADIUS } from '../lib/theme';

interface UserStats {
  scans: number;
  streak: number;
  plants: number;
}

interface Badge {
  emoji: string;
  title: string;
  desc: string;
  earned: boolean;
}

export default function ProfileScreen() {
  const [stats, setStats] = useState<UserStats>({ scans: 0, streak: 3, plants: 0 });
  const [zone, setZone] = useState('5b');
  const [notifications, setNotifications] = useState(true);
  const [units, setUnits] = useState<'F' | 'C'>('F');

  useEffect(() => {
    const load = async () => {
      try {
        const history = await AsyncStorage.getItem('scanHistory');
        const plants = await AsyncStorage.getItem('gardenPlants');
        const scanCount = history ? JSON.parse(history).length : 0;
        const plantCount = plants ? JSON.parse(plants).length : 0;

        const z = await AsyncStorage.getItem('profileZone');
        const n = await AsyncStorage.getItem('profileNotifications');
        const u = await AsyncStorage.getItem('profileUnits');

        setStats({ scans: scanCount, streak: 3, plants: plantCount });
        if (z) setZone(z);
        if (n !== null) setNotifications(n === 'true');
        if (u) setUnits(u as 'F' | 'C');
      } catch (_) {}
    };
    load();
  }, []);

  const saveZone = async (v: string) => {
    setZone(v);
    await AsyncStorage.setItem('profileZone', v);
  };

  const saveNotifications = async (v: boolean) => {
    setNotifications(v);
    await AsyncStorage.setItem('profileNotifications', String(v));
  };

  const saveUnits = async (v: 'F' | 'C') => {
    setUnits(v);
    await AsyncStorage.setItem('profileUnits', v);
  };

  const badges: Badge[] = [
    { emoji: '🌱', title: 'First Scan', desc: 'Complete your first plant scan', earned: stats.scans >= 1 },
    { emoji: '🔥', title: '7-Day Streak', desc: 'Complete garden tasks 7 days in a row', earned: stats.streak >= 7 },
    { emoji: '🍅', title: 'Harvest Hero', desc: 'Log your first harvest', earned: false },
    { emoji: '🐛', title: 'Pest Detective', desc: 'Identify 3 different pests', earned: false },
    { emoji: '🌿', title: 'Plant Parent', desc: 'Add 5 plants to your garden', earned: stats.plants >= 5 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {/* Stats Hero */}
          <View style={[GLASS.card, styles.statsHero]}>
            <View style={styles.statsRow}>
              {[
                { label: 'Scans', value: stats.scans, icon: '📸' },
                { label: 'Day Streak', value: stats.streak, icon: '🔥' },
                { label: 'Plants', value: stats.plants, icon: '🌱' },
              ].map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={{ fontSize: 24 }}>{s.icon}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Badges */}
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {badges.map((badge, i) => (
              <View
                key={i}
                style={[
                  GLASS.card,
                  styles.badgeCard,
                  !badge.earned && { opacity: 0.4 },
                ]}
              >
                <Text style={{ fontSize: 34, marginBottom: 6 }}>
                  {badge.earned ? badge.emoji : '🔒'}
                </Text>
                <Text style={[styles.badgeTitle, !badge.earned && { color: COLORS.textMuted }]}>
                  {badge.title}
                </Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
                {badge.earned && (
                  <View style={styles.earnedBadge}>
                    <Text style={styles.earnedBadgeText}>✓ Earned</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Settings */}
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={[GLASS.card, styles.settingsCard]}>
            {/* Zone */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>🗺️ Hardiness Zone</Text>
              <TextInput
                style={styles.settingInput}
                value={zone}
                onChangeText={saveZone}
                placeholder="e.g. 5b"
                placeholderTextColor={COLORS.textDisabled}
              />
            </View>

            <View style={styles.divider} />

            {/* Notifications */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>🔔 Reminders</Text>
              <Switch
                value={notifications}
                onValueChange={saveNotifications}
                trackColor={{ false: COLORS.surface2, true: COLORS.vineGreen }}
                thumbColor={notifications ? COLORS.springLeaf : COLORS.textMuted}
              />
            </View>

            <View style={styles.divider} />

            {/* Units */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>🌡️ Temperature</Text>
              <View style={styles.unitToggle}>
                {(['F', 'C'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitPill, units === u && styles.unitPillActive]}
                    onPress={() => saveUnits(u)}
                  >
                    <Text style={[styles.unitPillText, units === u && styles.unitPillTextActive]}>
                      °{u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* About */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>ℹ️ About</Text>
              <Text style={styles.settingValue}>GardenGenius v1.0</Text>
            </View>
          </View>
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
  statsHero: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.springLeaf,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  badgeCard: {
    width: '46%',
    padding: SPACING.md,
    alignItems: 'center',
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 11,
    color: COLORS.textDisabled,
    textAlign: 'center',
    lineHeight: 15,
  },
  earnedBadge: {
    marginTop: 8,
    backgroundColor: COLORS.springLeaf + '33',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.springLeaf,
  },
  earnedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.springLeaf,
  },
  settingsCard: {
    marginHorizontal: SPACING.md,
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '500',
  },
  settingInput: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    width: 80,
    color: COLORS.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.dewBorder,
    textAlign: 'center',
  },
  settingValue: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dewBorder,
    marginHorizontal: SPACING.md,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    padding: 2,
  },
  unitPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  unitPillActive: {
    backgroundColor: COLORS.vineGreen,
  },
  unitPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  unitPillTextActive: {
    color: COLORS.white,
  },
});

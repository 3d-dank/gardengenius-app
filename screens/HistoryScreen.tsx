import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GRADIENTS, GLASS, SPACING, RADIUS, geniusScoreColor } from '../lib/theme';

interface ScanEntry {
  mode: 'diagnose' | 'identify';
  healthScore: number;
  primaryIssue: string | null;
  species: string | null;
  date: string;
  imageUri?: string;
  issues: { name: string; severity: number; confidence: number; recommendation: string }[];
  careTips: string[];
  productRecommendations: string[];
  growthStage: string | null;
  daysToHarvest: number | null;
  botanicalName: string | null;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanEntry[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('scanHistory');
        if (raw) setHistory(JSON.parse(raw));
      } catch (_) {}
    };
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const totalScans = history.length;
  const thisWeek = history.filter((h) => {
    const d = new Date(h.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  const avgScore =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.healthScore, 0) / history.length)
      : 0;

  const plantEmoji = (entry: ScanEntry) => {
    if (entry.species?.toLowerCase().includes('tomato')) return '🍅';
    if (entry.species?.toLowerCase().includes('pepper')) return '🌶️';
    if (entry.species?.toLowerCase().includes('herb')) return '🌿';
    return '🌱';
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <Text style={styles.headerTitle}>Scan History</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Stats Strip */}
          <View style={styles.statsRow}>
            {[
              { label: 'Total Scans', value: totalScans },
              { label: 'This Week', value: thisWeek },
              { label: 'Avg Health', value: avgScore > 0 ? avgScore : '—' },
            ].map((s, i) => (
              <View key={i} style={[GLASS.card, styles.statPill]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyText}>Your garden's story starts with your first scan 🌿</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Scan' as never)}
              >
                <Text style={styles.emptyBtnText}>📷 Scan Your First Plant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginTop: SPACING.md }}>
              {history.map((entry, i) => {
                const isExpanded = expandedIndex === i;
                const scoreColor = geniusScoreColor(entry.healthScore);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setExpandedIndex(isExpanded ? null : i)}
                    activeOpacity={0.85}
                  >
                    <View style={[GLASS.card, styles.scanCard]}>
                      <Text style={{ fontSize: 32, marginRight: SPACING.sm }}>{plantEmoji(entry)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scanName}>
                          {entry.species ?? (entry.mode === 'diagnose' ? 'Plant Diagnosis' : 'Plant Identification')}
                        </Text>
                        <Text style={styles.scanDate}>{formatDate(entry.date)}</Text>
                        {entry.primaryIssue && (
                          <Text style={styles.scanIssue}>⚠️ {entry.primaryIssue}</Text>
                        )}
                      </View>
                      <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '33', borderColor: scoreColor }]}>
                        <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>{entry.healthScore}</Text>
                      </View>
                    </View>

                    {isExpanded && (
                      <View style={[GLASS.cardElevated, styles.expandedCard]}>
                        {entry.botanicalName && (
                          <Text style={{ fontSize: 12, fontStyle: 'italic', color: COLORS.textMuted, marginBottom: 8 }}>
                            {entry.botanicalName}
                          </Text>
                        )}
                        {entry.growthStage && (
                          <Text style={{ fontSize: 13, color: COLORS.springLeaf, marginBottom: 4 }}>
                            Stage: {entry.growthStage}
                          </Text>
                        )}
                        {entry.issues.map((issue, j) => (
                          <View key={j} style={styles.expandedIssue}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.white }}>
                              {issue.name} <Text style={{ color: COLORS.textMuted, fontWeight: '400' }}>({issue.confidence}%)</Text>
                            </Text>
                            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{issue.recommendation}</Text>
                          </View>
                        ))}
                        {entry.careTips.map((tip, j) => (
                          <Text key={j} style={{ fontSize: 12, color: COLORS.petalCream, marginTop: 4 }}>
                            🌱 {tip}
                          </Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.springLeaf,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    backgroundColor: COLORS.vineGreen,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  scanName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  scanDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scanIssue: {
    fontSize: 12,
    color: COLORS.sunflower,
    marginTop: 2,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  expandedCard: {
    marginHorizontal: SPACING.md,
    marginTop: -8,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
  },
  expandedIssue: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dewBorder,
  },
});

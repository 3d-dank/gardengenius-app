import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getProductsForDiagnosis } from '../lib/products';
import ProductCarousel from '../components/ProductCarousel';
import {
  COLORS, GRADIENTS, GLASS, RADIUS, SPACING,
  getSeverityColor,
} from '../lib/theme';

const HISTORY_KEY = '@gardengenius_history';

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

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function HistoryCard({
  entry, expanded, onToggle, onDelete,
}: {
  entry: HistoryEntry;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const sColor = getSeverityColor(entry.severity);
  const isHealthy = entry.severity === 'None';

  return (
    <View style={[GLASS.card, styles.card]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View style={[styles.severityBar, { backgroundColor: sColor }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <View style={[styles.badge, { backgroundColor: sColor + '25', borderColor: sColor + '50' }]}>
                <Text style={[styles.badgeText, { color: sColor }]}>
                  {isHealthy ? '✅ Healthy Plant' : `⚠️ ${entry.severity}`}
                </Text>
              </View>
              <View style={styles.confPill}>
                <Text style={styles.confText}>{entry.confidence}%</Text>
              </View>
            </View>
            <Text style={styles.problemName}>{entry.problem}</Text>
            <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
          </View>
          <Text style={[styles.expandChevron, expanded && styles.expandChevronOpen]}>›</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedWrap}>
          <View style={styles.expandedDivider} />
          {[
            { icon: '📝', label: 'Description', text: entry.description },
            { icon: '💊', label: 'Treatment', text: entry.treatment },
            { icon: '📅', label: 'Timing', text: entry.timing },
          ].map(sec => (
            <View key={sec.label} style={styles.expandSection}>
              <Text style={styles.expandLabel}>{sec.icon} {sec.label}</Text>
              <Text style={styles.expandText}>{sec.text}</Text>
            </View>
          ))}
          <ProductCarousel
            products={getProductsForDiagnosis(entry.problem, entry.severity)}
            diagnosis={entry.problem}
          />
        </View>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteBtnText}>🗑  Remove</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.warn('Failed to load history', e);
    }
  };

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const deleteEntry = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Delete Scan', 'Remove this plant diagnosis from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = history.filter(e => e.id !== id);
          setHistory(updated);
          await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        }
      },
    ]);
  };

  const toggleExpand = async (id: string) => {
    await Haptics.selectionAsync();
    setExpanded(prev => prev === id ? null : id);
  };

  const healthyCount = history.filter(e => e.severity === 'None').length;
  const issueCount = history.length - healthyCount;

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <Text style={styles.title}>Scan History</Text>
          <Text style={styles.subtitle}>{history.length} plant diagnoses logged</Text>

          {history.length > 0 && (
            <View style={styles.statsStrip}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.healthGood }]}>{healthyCount}</Text>
                <Text style={styles.statLabel}>Healthy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.healthStressed }]}>{issueCount}</Text>
                <Text style={styles.statLabel}>Issues</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.limeAccent }]}>{history.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <ScrollView
          contentContainerStyle={history.length === 0 ? styles.emptyContainer : styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.limeAccent} />}
          showsVerticalScrollIndicator={false}
        >
          {history.length === 0 ? (
            <View style={styles.emptyInner}>
              <Text style={styles.emptyIcon}>🌿</Text>
              <Text style={styles.emptyTitle}>No plant scans yet</Text>
              <Text style={styles.emptyText}>Tap 📷 to scan a plant and start your garden health history</Text>
            </View>
          ) : (
            history.map(entry => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                expanded={expanded === entry.id}
                onToggle={() => toggleExpand(entry.id)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface0 },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  statsStrip: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, letterSpacing: 0.5, textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: COLORS.border },

  emptyContainer: { flex: 1 },
  listContainer: { padding: SPACING.md, paddingBottom: 32 },
  emptyInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptyText: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },

  card: { marginBottom: SPACING.sm, overflow: 'hidden', padding: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  severityBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginRight: SPACING.md },
  cardContent: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  confPill: { backgroundColor: 'rgba(139,195,74,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  confText: { fontSize: 11, color: COLORS.limeAccent, fontWeight: '700' },
  problemName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  dateText: { fontSize: 12, color: COLORS.textMuted },
  expandChevron: { fontSize: 22, color: COLORS.textMuted, paddingLeft: SPACING.sm, transform: [{ rotate: '90deg' }] },
  expandChevronOpen: { transform: [{ rotate: '-90deg' }] },

  expandedWrap: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  expandedDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.md },
  expandSection: {
    backgroundColor: 'rgba(139,195,74,0.06)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(139,195,74,0.12)',
  },
  expandLabel: { fontSize: 12, fontWeight: '700', color: COLORS.limeAccent, marginBottom: 4, letterSpacing: 0.3 },
  expandText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  deleteBtn: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.sm, alignItems: 'center' },
  deleteBtnText: { color: COLORS.healthCritical, fontSize: 13, fontWeight: '600' },
});

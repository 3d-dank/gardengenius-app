import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#4CAF50',
  dark: '#1B4332',
  bg: '#F0FFF4',
  now: '#4CAF50',
  soon: '#FFD60A',
  notYet: '#D1D5DB',
};

interface MonthData {
  month: string;
  shortMonth: string;
  seasonIcon: string;
  tasks: string[];
  windowLabel: 'now' | 'soon' | 'not-yet';
}

const CALENDAR_DATA: MonthData[] = [
  {
    month: 'January', shortMonth: 'Jan', seasonIcon: '❄️',
    tasks: ['Service mower and equipment', 'Plan soil test for spring', 'Review last year\'s lawn notes', 'Research seed varieties'],
    windowLabel: 'not-yet',
  },
  {
    month: 'February', shortMonth: 'Feb', seasonIcon: '🌨️',
    tasks: ['Order seeds and supplies', 'Check for snow mold damage', 'Schedule spring aeration', 'Sharpen mower blades'],
    windowLabel: 'not-yet',
  },
  {
    month: 'March', shortMonth: 'Mar', seasonIcon: '🌱',
    tasks: ['Apply pre-emergent herbicide', 'First lawn inspection', 'Dethatch if needed', 'Begin soil temperature monitoring'],
    windowLabel: 'soon',
  },
  {
    month: 'April', shortMonth: 'Apr', seasonIcon: '🌷',
    tasks: ['First fertilizer (slow-release N)', 'Spot weed control', 'Resume mowing at 3"', 'Check irrigation system'],
    windowLabel: 'soon',
  },
  {
    month: 'May', shortMonth: 'May', seasonIcon: '🌼',
    tasks: ['Overseed thin areas', 'Increase mowing frequency', 'Apply crabgrass control', 'Deep watering begins (1"/week)'],
    windowLabel: 'soon',
  },
  {
    month: 'June', shortMonth: 'Jun', seasonIcon: '☀️',
    tasks: ['Apply grub preventer', 'Raise mowing height to 3.5"', 'Summer fertilizer (light)', 'Monitor for chinch bugs'],
    windowLabel: 'not-yet',
  },
  {
    month: 'July', shortMonth: 'Jul', seasonIcon: '🌡️',
    tasks: ['Deep water 2x/week', 'Monitor heat stress', 'Avoid fertilizer in extreme heat', 'Scout for disease symptoms'],
    windowLabel: 'not-yet',
  },
  {
    month: 'August', shortMonth: 'Aug', seasonIcon: '🔥',
    tasks: ['Scout for grub damage', 'Late summer fertilizer', 'Prepare for overseeding', 'Core aeration planning'],
    windowLabel: 'not-yet',
  },
  {
    month: 'September', shortMonth: 'Sep', seasonIcon: '🍂',
    tasks: ['Core aeration (best time!)', 'Overseed bare spots', 'Fall fertilizer application', 'Weed control before frost'],
    windowLabel: 'not-yet',
  },
  {
    month: 'October', shortMonth: 'Oct', seasonIcon: '🍁',
    tasks: ['Apply winterizer fertilizer', 'Final weed control', 'Lower mowing height gradually', 'Drain irrigation system'],
    windowLabel: 'not-yet',
  },
  {
    month: 'November', shortMonth: 'Nov', seasonIcon: '🌬️',
    tasks: ['Final mow at 2"', 'Winterize equipment', 'Blow out irrigation lines', 'Remove leaves before freeze'],
    windowLabel: 'not-yet',
  },
  {
    month: 'December', shortMonth: 'Dec', seasonIcon: '⛄',
    tasks: ['Rest and review season', 'Plan improvements for spring', 'Order soil test kit', 'Research new products/techniques'],
    windowLabel: 'not-yet',
  },
];

/** Badge color and label by window status relative to current month */
function getBadgeForMonth(monthIndex: number, currentMonth: number): { label: string; color: string; textColor: string } {
  const diff = monthIndex - currentMonth;
  if (diff === 0) return { label: '✅ Ideal Window Now', color: COLORS.now, textColor: '#fff' };
  if (diff === 1 || diff === -11) return { label: '⏳ Coming Soon', color: COLORS.soon, textColor: '#1B4332' };
  if (diff === -1 || diff === 11) return { label: '⏰ Just Passed', color: '#FED7AA', textColor: '#92400E' };
  return { label: '📅 Plan Ahead', color: COLORS.notYet, textColor: '#6B7280' };
}

interface MonthCardProps {
  data: MonthData;
  monthIndex: number;
  currentMonth: number;
  isCurrent: boolean;
}

function MonthCard({ data, monthIndex, currentMonth, isCurrent }: MonthCardProps) {
  const [checked, setChecked] = useState<boolean[]>(data.tasks.map(() => false));
  const badge = getBadgeForMonth(monthIndex, currentMonth);

  const toggleCheck = (i: number) => {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  if (isCurrent) {
    return (
      <View style={styles.currentCard}>
        <LinearGradient colors={['#1B4332', '#2D9A4F']} style={styles.currentCardHeader}>
          <View style={styles.currentCardTitleRow}>
            <Text style={styles.currentCardIcon}>{data.seasonIcon}</Text>
            <View>
              <Text style={styles.currentCardMonth}>{data.month}</Text>
              <Text style={styles.currentCardNow}>📍 Current Month</Text>
            </View>
          </View>
          <View style={[styles.badgePill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={[styles.badgeText, { color: '#fff' }]}>{badge.label}</Text>
          </View>
        </LinearGradient>
        <View style={styles.currentCardBody}>
          {data.tasks.map((task, i) => (
            <TouchableOpacity key={i} style={styles.taskRow} onPress={() => toggleCheck(i)} activeOpacity={0.7}>
              <View style={[styles.checkbox, checked[i] && styles.checkboxChecked]}>
                {checked[i] && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.taskText, checked[i] && styles.taskTextDone]}>{task}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.monthCard}>
      <View style={styles.monthCardHeader}>
        <Text style={styles.monthCardIcon}>{data.seasonIcon}</Text>
        <Text style={styles.monthCardName}>{data.month}</Text>
      </View>
      <View style={[styles.badgePill, { backgroundColor: badge.color, alignSelf: 'flex-start', marginBottom: 10 }]}>
        <Text style={[styles.badgeText, { color: badge.textColor }]}>{badge.label}</Text>
      </View>
      {data.tasks.map((task, i) => (
        <TouchableOpacity key={i} style={styles.taskRow} onPress={() => toggleCheck(i)} activeOpacity={0.7}>
          <View style={[styles.checkbox, checked[i] && styles.checkboxChecked]}>
            {checked[i] && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.taskText, checked[i] && styles.taskTextDone]}>{task}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CalendarScreen() {
  const currentMonth = new Date().getMonth(); // 0-indexed
  const scrollRef = useRef<FlatList<MonthData>>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const scrollToMonth = (index: number) => {
    setSelectedMonth(index);
    scrollRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
        <Text style={styles.title}>📅 Care Calendar</Text>
        <Text style={styles.subtitle}>Month-by-month lawn guide · Cool-season grasses · Midwest</Text>
      </LinearGradient>

      {/* Horizontal Month Picker */}
      <View style={styles.pickerContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerContent}>
          {CALENDAR_DATA.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.pickerPill, i === selectedMonth && styles.pickerPillActive]}
              onPress={() => scrollToMonth(i)}
            >
              <Text style={[styles.pickerIcon]}>{m.seasonIcon}</Text>
              <Text style={[styles.pickerLabel, i === selectedMonth && styles.pickerLabelActive]}>
                {m.shortMonth}
              </Text>
              {i === currentMonth && <View style={styles.pickerDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Month Cards */}
      <FlatList
        ref={scrollRef}
        data={CALENDAR_DATA}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={currentMonth}
        getItemLayout={(_, index) => ({
          length: index === currentMonth ? 340 : 260,
          offset: index === currentMonth
            ? index * 260 + 80
            : index * 260,
          index,
        })}
        renderItem={({ item, index }) => (
          <MonthCard
            data={item}
            monthIndex={index}
            currentMonth={currentMonth}
            isCurrent={index === currentMonth}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FFF4' },

  header: { padding: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 12, color: '#A8D5C2', marginTop: 4 },

  // Month picker
  pickerContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  pickerContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  pickerPill: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F3F4F6', minWidth: 50, position: 'relative',
  },
  pickerPillActive: { backgroundColor: '#1B4332' },
  pickerIcon: { fontSize: 16 },
  pickerLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  pickerLabelActive: { color: '#fff' },
  pickerDot: {
    position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: 3,
    backgroundColor: COLORS.primary,
  },

  // List
  listContent: { padding: 16, paddingBottom: 40, gap: 16 },

  // Current month card
  currentCard: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#1B4332', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  currentCardHeader: { padding: 20 },
  currentCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  currentCardIcon: { fontSize: 40 },
  currentCardMonth: { fontSize: 26, fontWeight: '800', color: '#fff' },
  currentCardNow: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  currentCardBody: { backgroundColor: '#fff', padding: 16 },

  // Regular month card
  monthCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  monthCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  monthCardIcon: { fontSize: 28 },
  monthCardName: { fontSize: 20, fontWeight: '700', color: '#1B4332' },

  // Badge
  badgePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Tasks
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  taskText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  taskTextDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
});

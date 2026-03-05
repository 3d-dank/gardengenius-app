import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, GLASS, RADIUS, SPACING } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Frost Dates by Region ────────────────────────────────────────────────────
interface RegionFrost {
  region: string;
  emoji: string;
  lastFrost: string;
  firstFrost: string;
  indoorStart: string;
  notes: string;
}

const FROST_REGIONS: RegionFrost[] = [
  { region: 'Minneapolis / Zone 4', emoji: '🌨️', lastFrost: 'May 10', firstFrost: 'Oct 1', indoorStart: 'Feb 15', notes: 'Short season — start tomatoes & peppers indoors 8 weeks before last frost.' },
  { region: 'Chicago / Zone 5', emoji: '🌬️', lastFrost: 'Apr 22', firstFrost: 'Oct 15', indoorStart: 'Feb 22', notes: 'Good for brassicas; start warm-season crops 6–8 weeks before last frost.' },
  { region: 'Dallas / Zone 8', emoji: '🌵', lastFrost: 'Mar 15', firstFrost: 'Nov 20', indoorStart: 'Jan 15', notes: 'Two growing seasons possible. Plant spring tomatoes in March, fall tomatoes in August.' },
  { region: 'Portland / Zone 8', emoji: '🌲', lastFrost: 'Mar 25', firstFrost: 'Nov 10', indoorStart: 'Jan 25', notes: 'Cool, wet springs. Excellent for brassicas, root vegetables, and leafy greens.' },
  { region: 'Atlanta / Zone 7', emoji: '🍑', lastFrost: 'Apr 5', firstFrost: 'Nov 5', indoorStart: 'Feb 5', notes: 'Long growing season. Excellent for heat-loving crops: tomatoes, okra, peppers.' },
  { region: 'Denver / Zone 5', emoji: '🏔️', lastFrost: 'May 8', firstFrost: 'Sep 25', indoorStart: 'Mar 10', notes: 'Short, intense growing season. Hail risk — consider row covers.' },
];

// ─── Planting Calendar Data ────────────────────────────────────────────────────
interface MonthData {
  month: string;
  shortMonth: string;
  seasonIcon: string;
  indoorTasks: string[];
  outdoorTasks: string[];
  harvest: string[];
}

const CALENDAR_DATA: MonthData[] = [
  {
    month: 'January', shortMonth: 'Jan', seasonIcon: '❄️',
    indoorTasks: ['Order seeds & supplies', 'Plan crop rotation', 'Start onion seeds under lights', 'Research new varieties'],
    outdoorTasks: ['Mulch perennial beds', 'Clean up garden debris', 'Sharpen tools', 'Test soil if not done in fall'],
    harvest: ['Winter greens (kale, spinach under row cover)', 'Root vegetables in mild climates'],
  },
  {
    month: 'February', shortMonth: 'Feb', seasonIcon: '🌱',
    indoorTasks: ['Start peppers & eggplant (8–10 wks before last frost)', 'Start slow-growing herbs (parsley, lavender)', 'Pot up overwintered herbs'],
    outdoorTasks: ['Prune fruit trees before bud break', 'Apply dormant oil spray to fruit trees', 'Prepare new raised beds'],
    harvest: ['Overwintered root crops', 'Winter greens'],
  },
  {
    month: 'March', shortMonth: 'Mar', seasonIcon: '🌷',
    indoorTasks: ['Start tomatoes (6–8 wks before last frost)', 'Start basil, celery, leeks', 'Pot up pepper seedlings into larger containers'],
    outdoorTasks: ['Direct sow peas, spinach, lettuce (soil 40°F+)', 'Plant onion sets', 'Prepare beds with compost'],
    harvest: ['Spring greens under cold frames', 'Overwintered crops'],
  },
  {
    month: 'April', shortMonth: 'Apr', seasonIcon: '🌸',
    indoorTasks: ['Start squash, cucumber, melon (3–4 wks before last frost)', 'Harden off tomato & pepper seedlings', 'Start sweet potato slips'],
    outdoorTasks: ['Transplant brassicas (cabbage, broccoli, kale)', 'Direct sow carrots, beets, chard', 'Apply pre-emergent weed barrier to paths'],
    harvest: ['Asparagus (established beds)', 'Spinach, lettuce, radishes', 'Spring peas'],
  },
  {
    month: 'May', shortMonth: 'May', seasonIcon: '🌼',
    indoorTasks: ['Finalize hardening off all seedlings', 'Start fall broccoli & cauliflower indoors (in warm zones)'],
    outdoorTasks: ['Transplant tomatoes after last frost', 'Direct sow beans, corn, squash', 'Plant sweet potato slips', 'Set up drip irrigation'],
    harvest: ['Lettuce, spinach (harvest before bolting)', 'Asparagus', 'Strawberries (late May)', 'Sugar snap peas'],
  },
  {
    month: 'June', shortMonth: 'Jun', seasonIcon: '☀️',
    indoorTasks: ['Start fall broccoli, cauliflower for transplant in July/Aug'],
    outdoorTasks: ['Succession sow beans every 2 weeks', 'Stake & trellis tomatoes', 'Side-dress heavy feeders with compost', 'Plant basil after soil warm'],
    harvest: ['Lettuce, chard, kale', 'Peas, zucchini (first harvest!)', 'Strawberries', 'Early tomatoes in hot climates'],
  },
  {
    month: 'July', shortMonth: 'Jul', seasonIcon: '🌡️',
    indoorTasks: ['Start fall broccoli, cauliflower, cabbage indoors for fall garden'],
    outdoorTasks: ['Succession sow carrots, beets for fall harvest', 'Deep water 1–2"/week', 'Pinch tomato suckers', 'Apply mulch to conserve moisture'],
    harvest: ['Tomatoes, peppers, cucumbers, zucchini', 'Beans, corn, beets', 'Blueberries, raspberries', 'Herbs: basil, oregano, thyme'],
  },
  {
    month: 'August', shortMonth: 'Aug', seasonIcon: '🔥',
    indoorTasks: ['Start fall lettuce, spinach transplants', 'Plant garlic indoors for late fall'],
    outdoorTasks: ['Transplant fall brassica seedlings', 'Direct sow fall lettuce, spinach, arugula', 'Sow fall radishes & turnips', 'Plant garlic (hot climates — early)'],
    harvest: ['Peak tomato season!', 'Corn, beans, peppers', 'Melons, squash, cucumbers', 'Herbs at peak — harvest for drying'],
  },
  {
    month: 'September', shortMonth: 'Sep', seasonIcon: '🍂',
    indoorTasks: ['Start herbs to overwinter indoors (basil, parsley)'],
    outdoorTasks: ['Plant garlic cloves for spring', 'Sow cover crop in empty beds', 'Transplant fall greens', 'Apply compost to empty beds'],
    harvest: ['Winter squash, pumpkins', 'Fall tomatoes, peppers (race the frost)', 'Broccoli, cauliflower, cabbage', 'Leeks, parsnips, carrots'],
  },
  {
    month: 'October', shortMonth: 'Oct', seasonIcon: '🍁',
    indoorTasks: ['Pot herbs for indoor growing', 'Start paperwhite bulbs for holiday'],
    outdoorTasks: ['Plant garlic (ideal window)', 'Mulch perennial herbs & strawberries', 'Cover beds with straw or row cover', 'Harvest root crops before hard freeze'],
    harvest: ['Kale, chard (frost-sweetened!)', 'Root crops: carrots, beets, parsnips', 'Winter squash & pumpkins', 'Leeks, Brussels sprouts'],
  },
  {
    month: 'November', shortMonth: 'Nov', seasonIcon: '🌬️',
    indoorTasks: ['Plan next year\'s garden & order seed catalogs', 'Maintain indoor herb garden', 'Force hyacinth & tulip bulbs'],
    outdoorTasks: ['Final cleanup of diseased plant material', 'Apply winter mulch after ground freeze', 'Note any drainage issues to fix in spring'],
    harvest: ['Cold-hardy greens under row cover', 'Brussels sprouts (best after frost)', 'Root vegetables before hard freeze'],
  },
  {
    month: 'December', shortMonth: 'Dec', seasonIcon: '⛄',
    indoorTasks: ['Review seed inventory', 'Plan crop rotation for next year', 'Order seeds for next season'],
    outdoorTasks: ['Rest! Review season notes', 'Check mulched beds after freeze cycles', 'Oil and store garden tools'],
    harvest: ['Indoor microgreens & sprouts', 'Overwintered greens (mild climates)', 'Stored root crops'],
  },
];

function getBadge(monthIndex: number, currentMonth: number): { label: string; color: string; textColor: string } {
  const diff = monthIndex - currentMonth;
  if (diff === 0) return { label: '✅ Plant Now', color: COLORS.limeAccent, textColor: '#fff' };
  if (diff === 1 || diff === -11) return { label: '⏳ Coming Up', color: COLORS.harvestGold, textColor: '#1A3010' };
  if (diff === -1 || diff === 11) return { label: '⏰ Just Passed', color: '#FED7AA', textColor: '#92400E' };
  return { label: '📅 Plan Ahead', color: '#D1D5DB', textColor: '#6B7280' };
}

interface MonthCardProps {
  data: MonthData;
  monthIndex: number;
  currentMonth: number;
  isCurrent: boolean;
}

function MonthCard({ data, monthIndex, currentMonth, isCurrent }: MonthCardProps) {
  const [section, setSection] = useState<'indoor' | 'outdoor' | 'harvest'>('indoor');
  const badge = getBadge(monthIndex, currentMonth);

  const sections = {
    indoor: { label: '🏠 Indoors', items: data.indoorTasks },
    outdoor: { label: '🌿 Outdoors', items: data.outdoorTasks },
    harvest: { label: '🧺 Harvest', items: data.harvest },
  };

  const activeSection = sections[section];

  if (isCurrent) {
    return (
      <View style={styles.currentCard}>
        <LinearGradient colors={[COLORS.forestDark, COLORS.forestMid]} style={styles.currentCardHeader}>
          <View style={styles.currentCardTitleRow}>
            <Text style={styles.currentCardIcon}>{data.seasonIcon}</Text>
            <View>
              <Text style={styles.currentCardMonth}>{data.month}</Text>
              <Text style={styles.currentCardNow}>📍 This Month</Text>
            </View>
          </View>
          <View style={[styles.badgePill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={[styles.badgeText, { color: '#fff' }]}>{badge.label}</Text>
          </View>
        </LinearGradient>

        <View style={styles.currentCardBody}>
          <View style={styles.sectionTabs}>
            {(Object.keys(sections) as Array<'indoor' | 'outdoor' | 'harvest'>).map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.sectionTab, section === k && styles.sectionTabActive]}
                onPress={() => setSection(k)}
              >
                <Text style={[styles.sectionTabText, section === k && styles.sectionTabTextActive]}>
                  {sections[k].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {activeSection.items.map((item, i) => (
            <View key={i} style={styles.taskRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.taskText}>{item}</Text>
            </View>
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

      <View style={styles.sectionTabs}>
        {(Object.keys(sections) as Array<'indoor' | 'outdoor' | 'harvest'>).map(k => (
          <TouchableOpacity
            key={k}
            style={[styles.sectionTab, section === k && styles.sectionTabActive]}
            onPress={() => setSection(k)}
          >
            <Text style={[styles.sectionTabText, section === k && styles.sectionTabTextActive]}>
              {sections[k].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {sections[section].items.map((item, i) => (
        <View key={i} style={styles.taskRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.taskText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PlantingCalendarScreen() {
  const currentMonth = new Date().getMonth();
  const scrollRef = useRef<FlatList<MonthData>>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedRegion, setSelectedRegion] = useState(0);

  const scrollToMonth = (index: number) => {
    setSelectedMonth(index);
    scrollRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  const region = FROST_REGIONS[selectedRegion];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.forestDark, COLORS.forestMid]} style={styles.header}>
        <Text style={styles.title}>🌱 Planting Calendar</Text>
        <Text style={styles.subtitle}>Month-by-month garden guide</Text>
      </LinearGradient>

      {/* Region Frost Card */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.regionScroll}
        contentContainerStyle={styles.regionContent}
      >
        {FROST_REGIONS.map((r, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.regionPill, i === selectedRegion && styles.regionPillActive]}
            onPress={() => setSelectedRegion(i)}
          >
            <Text>{r.emoji}</Text>
            <Text style={[styles.regionLabel, i === selectedRegion && styles.regionLabelActive]}>
              {r.region.split('/')[0].trim()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Frost Date Info */}
      <View style={styles.frostCard}>
        <View style={styles.frostRow}>
          <View style={styles.frostItem}>
            <Text style={styles.frostLabel}>🌡️ Last Frost</Text>
            <Text style={styles.frostValue}>{region.lastFrost}</Text>
          </View>
          <View style={styles.frostDivider} />
          <View style={styles.frostItem}>
            <Text style={styles.frostLabel}>❄️ First Frost</Text>
            <Text style={styles.frostValue}>{region.firstFrost}</Text>
          </View>
          <View style={styles.frostDivider} />
          <View style={styles.frostItem}>
            <Text style={styles.frostLabel}>🌱 Start Indoors</Text>
            <Text style={styles.frostValue}>{region.indoorStart}</Text>
          </View>
        </View>
        <Text style={styles.frostNote}>{region.notes}</Text>
      </View>

      {/* Month Picker */}
      <View style={styles.pickerContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerContent}>
          {CALENDAR_DATA.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.pickerPill, i === selectedMonth && styles.pickerPillActive]}
              onPress={() => scrollToMonth(i)}
            >
              <Text style={styles.pickerIcon}>{m.seasonIcon}</Text>
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
          length: index === currentMonth ? 400 : 300,
          offset: index === currentMonth ? index * 300 + 100 : index * 300,
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

  // Region selector
  regionScroll: { backgroundColor: '#fff', maxHeight: 60 },
  regionContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  regionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  regionPillActive: { backgroundColor: COLORS.forestDark },
  regionLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  regionLabelActive: { color: '#fff' },

  // Frost card
  frostCard: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  frostRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  frostItem: { flex: 1, alignItems: 'center' },
  frostLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
  frostValue: { fontSize: 14, fontWeight: '800', color: COLORS.forestDark },
  frostDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB' },
  frostNote: { fontSize: 11, color: '#6B7280', lineHeight: 16, textAlign: 'center' },

  // Month picker
  pickerContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  pickerContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  pickerPill: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F3F4F6', minWidth: 50, position: 'relative',
  },
  pickerPillActive: { backgroundColor: COLORS.forestDark },
  pickerIcon: { fontSize: 16 },
  pickerLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  pickerLabelActive: { color: '#fff' },
  pickerDot: {
    position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: 3,
    backgroundColor: COLORS.limeAccent,
  },

  // List
  listContent: { padding: 16, paddingBottom: 40, gap: 16 },

  // Current month card
  currentCard: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: COLORS.forestDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
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
  monthCardName: { fontSize: 20, fontWeight: '700', color: COLORS.forestDark },

  // Badge
  badgePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Section tabs
  sectionTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  sectionTab: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  sectionTabActive: { backgroundColor: COLORS.limeAccent },
  sectionTabText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  sectionTabTextActive: { color: '#1A3010' },

  // Tasks
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, gap: 10 },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.limeAccent,
    marginTop: 7, flexShrink: 0,
  },
  taskText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
});

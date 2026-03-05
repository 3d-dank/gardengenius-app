import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, GRADIENTS, GLASS, SPACING, RADIUS } from '../lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TaskType = 'sow' | 'water' | 'fertilize' | 'treat' | 'harvest';

interface Task {
  id: number;
  type: TaskType;
  plant: string;
  task: string;
  daysUntil: number;
  duration: string;
  note: string;
}

const TASK_COLORS: Record<TaskType, string> = {
  sow: '#FFF8E1',
  water: '#29B6F6',
  fertilize: '#FFA000',
  treat: '#E53935',
  harvest: '#B39DDB',
};

const MONTHLY_TASKS: Record<string, Task[]> = {
  march: [
    { id: 1, type: 'sow', plant: '🍅', task: 'Start tomatoes indoors', daysUntil: 0, duration: '10 min', note: 'Sow 2 seeds per cell, 1/4" deep. 70°F+ for germination.' },
    { id: 2, type: 'sow', plant: '🌶️', task: 'Start peppers indoors', daysUntil: 2, duration: '10 min', note: 'Peppers are slowest to germinate — start 10-12 weeks before last frost.' },
    { id: 3, type: 'fertilize', plant: '🌿', task: 'Feed overwintered herbs', daysUntil: 3, duration: '5 min', note: 'Light balanced fertilizer to kickstart spring growth.' },
    { id: 4, type: 'water', plant: '🌱', task: 'Check seed starting moisture', daysUntil: 1, duration: '5 min', note: 'Soil should be damp, not soggy. Lift trays to feel weight.' },
  ],
  april: [
    { id: 5, type: 'sow', plant: '🥕', task: 'Direct sow carrots', daysUntil: 0, duration: '20 min', note: 'Soil temp 50°F+. Sow 1/4" deep, thin to 2" apart.' },
    { id: 6, type: 'treat', plant: '🍎', task: 'Dormant oil spray on fruit trees', daysUntil: 4, duration: '30 min', note: 'Before bud break — controls overwintering pests and eggs.' },
    { id: 7, type: 'sow', plant: '🥬', task: 'Direct sow lettuce & spinach', daysUntil: 2, duration: '15 min', note: 'Cold tolerant — plant as soon as soil is workable.' },
  ],
  may: [
    { id: 8, type: 'sow', plant: '🥒', task: 'Direct sow cucumbers', daysUntil: 0, duration: '15 min', note: 'After last frost. Soil temp 60°F+.' },
    { id: 9, type: 'harvest', plant: '🥬', task: 'Harvest spring lettuce', daysUntil: 1, duration: '15 min', note: 'Harvest outer leaves for cut-and-come-again yield.' },
  ],
  june: [
    { id: 10, type: 'harvest', plant: '🍓', task: 'Pick strawberries daily', daysUntil: 0, duration: '10 min', note: 'Harvest at peak red — over-ripe fruit attracts pests.' },
  ],
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const SEASONAL_WISDOM: Record<string, string> = {
  march: 'Late March in Zone 5b: last frost approaching. Start tomatoes indoors. Soil temp reaching 40°F — hold outdoor sowing 3 more weeks.',
  april: 'April thaws bring soil life back. Direct sow cold-tolerant crops now. Nighttime temps still dip — protect tender seedlings.',
  may: 'May is planting season. Frost risk fades after mid-month. Harden off indoor starts before transplanting.',
  june: 'June warmth accelerates growth. Water deeply twice a week. Mulch now to retain moisture through summer heat.',
  january: 'January: plan your beds. Order seed catalogs, update your garden journal, and test soil pH indoors.',
  february: 'February: start onions and leeks indoors. 12-16 weeks before last frost. Begin reviewing last year\'s notes.',
  july: 'July heat: mulch is your best friend. Water in early morning. Watch for powdery mildew in warm, humid nights.',
  august: 'Late summer harvests peak in August. Begin fall sowing for spinach and carrots in 4-6 weeks.',
  september: 'September: plant garlic for next year. Cover crops now protect soil through winter.',
  october: 'October: clean up spent plants, compost what\'s healthy. Last frost coming — bring in tender herbs.',
  november: 'November: soil amendments and cover crops. Protect perennials with mulch before hard freeze.',
  december: 'December: rest your garden and yourself. Plan next year\'s rotations and order seeds early.',
};

function getDayDots(tasks: Task[], dayIndex: number): TaskType[] {
  return tasks
    .filter((t) => t.daysUntil === dayIndex)
    .map((t) => t.type)
    .slice(0, 3);
}

export default function PlantingCalendarScreen() {
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const [doneTasks, setDoneTasks] = useState<Set<number>>(new Set());
  const [streak, setStreak] = useState(3);
  const taskAnims = useRef<Map<number, Animated.Value>>(new Map()).current;
  const leafAnims = useRef<Map<number, Animated.Value>>(new Map()).current;

  const selectedMonth = MONTHS[selectedMonthIndex];
  const tasks = MONTHLY_TASKS[selectedMonth] ?? [];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return d;
  });

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('calendarDone');
        if (raw) setDoneTasks(new Set(JSON.parse(raw)));
        const s = await AsyncStorage.getItem('calendarStreak');
        if (s) setStreak(parseInt(s, 10));
      } catch (_) {}
    };
    load();
  }, []);

  const markDone = async (taskId: number) => {
    if (doneTasks.has(taskId)) return;

    if (!taskAnims.has(taskId)) taskAnims.set(taskId, new Animated.Value(1));
    if (!leafAnims.has(taskId)) leafAnims.set(taskId, new Animated.Value(0));

    const cardAnim = taskAnims.get(taskId)!;
    const leafAnim = leafAnims.get(taskId)!;

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.spring(cardAnim, { toValue: 1.05, damping: 12, stiffness: 180, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 1.0, damping: 12, stiffness: 180, useNativeDriver: true }),
    ]).start();

    Animated.spring(leafAnim, { toValue: 1, damping: 12, stiffness: 150, useNativeDriver: true }).start();

    const next = new Set(doneTasks);
    next.add(taskId);
    setDoneTasks(next);
    await AsyncStorage.setItem('calendarDone', JSON.stringify([...next]));
  };

  const monthLabel = selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Planting Calendar</Text>
            <Text style={styles.headerSub}>{monthLabel} · Zone 5b</Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Month selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={{ paddingHorizontal: SPACING.md }}>
            {MONTHS.map((m, i) => (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMonthIndex(i)}
                style={[styles.monthPill, selectedMonthIndex === i && styles.monthPillActive]}
              >
                <Text style={[styles.monthPillText, selectedMonthIndex === i && styles.monthPillTextActive]}>
                  {m.slice(0, 3).toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Week strip */}
          <View style={styles.weekStrip}>
            {days.map((day, i) => {
              const isToday = i === 0;
              const dots = getDayDots(tasks, i);
              return (
                <View key={i} style={styles.dayCol}>
                  <Text style={styles.dayName}>{day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</Text>
                  <View style={[styles.dayCircle, isToday && styles.dayCircleActive]}>
                    <Text style={[styles.dayNumber, isToday && styles.dayNumberActive]}>{day.getDate()}</Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {dots.map((type, j) => (
                      <View key={j} style={[styles.dot, { backgroundColor: TASK_COLORS[type] }]} />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Streak vine */}
          <View style={styles.streakRow}>
            <View style={styles.streakVine}>
              {Array.from({ length: Math.min(streak, 14) }).map((_, i) => (
                <Text key={i} style={{ fontSize: 12 }}>🍃</Text>
              ))}
            </View>
            <Text style={styles.streakText}>{streak} day streak 🔥</Text>
          </View>

          {/* Seasonal wisdom */}
          <View style={[GLASS.card, styles.wisdomCard]}>
            <Text style={styles.wisdomText}>
              {SEASONAL_WISDOM[selectedMonth] ?? `${monthLabel}: plan your garden activities for the season ahead.`}
            </Text>
          </View>

          {/* Task list */}
          {tasks.length === 0 ? (
            <View style={styles.emptyTasks}>
              <Text style={{ fontSize: 40 }}>🌱</Text>
              <Text style={{ color: COLORS.textMuted, marginTop: SPACING.sm }}>No tasks scheduled for {monthLabel}</Text>
            </View>
          ) : (
            <View style={{ marginTop: SPACING.sm }}>
              {tasks.map((task) => {
                if (!taskAnims.has(task.id)) taskAnims.set(task.id, new Animated.Value(1));
                if (!leafAnims.has(task.id)) leafAnims.set(task.id, new Animated.Value(0));
                const cardAnim = taskAnims.get(task.id)!;
                const leafAnim = leafAnims.get(task.id)!;
                const done = doneTasks.has(task.id);
                const leafScale = leafAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1.3, 1] });

                return (
                  <Animated.View
                    key={task.id}
                    style={[GLASS.card, styles.taskCard, { transform: [{ scale: cardAnim }] }]}
                  >
                    <View style={[styles.taskRibbon, { backgroundColor: TASK_COLORS[task.type] }]} />
                    <View style={{ flex: 1, paddingLeft: SPACING.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 22, marginRight: 8 }}>{task.plant}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.taskName, done && { textDecorationLine: 'line-through', color: COLORS.textMuted }]}>
                            {task.task}
                          </Text>
                          <Text style={styles.taskMeta}>
                            {task.daysUntil === 0 ? 'Today' : `In ${task.daysUntil} day${task.daysUntil > 1 ? 's' : ''}`} · {task.duration}
                          </Text>
                        </View>
                        {done ? (
                          <Animated.Text style={[styles.leafCheck, { transform: [{ scale: leafScale }] }]}>🌿</Animated.Text>
                        ) : (
                          <TouchableOpacity
                            style={styles.markDoneBtn}
                            onPress={() => markDone(task.id)}
                          >
                            <Text style={styles.markDoneText}>✓ Done</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.taskNote}>{task.note}</Text>
                    </View>
                  </Animated.View>
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
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  monthScroll: {
    marginTop: SPACING.md,
  },
  monthPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.dewBorder,
  },
  monthPillActive: {
    backgroundColor: COLORS.vineGreen,
    borderColor: COLORS.springLeaf,
  },
  monthPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  monthPillTextActive: {
    color: COLORS.white,
  },
  weekStrip: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
  },
  dayCircleActive: {
    backgroundColor: COLORS.springLeaf,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  dayNumberActive: {
    color: COLORS.surface0,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  streakVine: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.springLeaf,
    marginLeft: SPACING.sm,
  },
  wisdomCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  wisdomText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.petalCream,
    lineHeight: 20,
  },
  emptyTasks: {
    alignItems: 'center',
    paddingTop: 40,
  },
  taskCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: 0,
    overflow: 'hidden',
  },
  taskRibbon: {
    width: 5,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  taskMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  taskNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 17,
    paddingBottom: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  markDoneBtn: {
    backgroundColor: COLORS.vineGreen,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginRight: SPACING.sm,
  },
  markDoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  leafCheck: {
    fontSize: 22,
    marginRight: SPACING.sm,
  },
});

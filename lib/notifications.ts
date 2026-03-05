import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_PERM_KEY = '@lawngenius_notif_permission';
const LAST_SCAN_KEY = '@lawngenius_last_scan_notif';

// How notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request notification permissions and store the result. Returns true if granted. */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  const granted = finalStatus === 'granted';
  await AsyncStorage.setItem(NOTIF_PERM_KEY, granted ? 'granted' : 'denied');
  return granted;
}

/** Check if permissions were previously granted (cached). */
export async function hasPermission(): Promise<boolean> {
  const cached = await AsyncStorage.getItem(NOTIF_PERM_KEY);
  if (cached === 'granted') return true;
  // Re-check live status
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** Schedule weekly lawn report — every Sunday at 8:00 AM. */
export async function scheduleWeeklyReport(): Promise<void> {
  // Cancel existing weekly report to avoid duplicates
  await cancelNotificationsByTag('weekly_report');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌿 Your Weekly Lawn Report',
      body: 'Check your lawn health score and this week\'s care tips',
      data: { screen: 'Home', tag: 'weekly_report' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday = 1 in expo-notifications
      hour: 8,
      minute: 0,
    },
  });
}

/** Seasonal reminder messages by month (1-indexed). */
const SEASONAL_MESSAGES: Record<number, string> = {
  3:  '🌱 Time to apply pre-emergent! Crabgrass season is coming.',
  4:  '🌿 First fertilizer application window is open.',
  5:  '💧 Increase watering frequency as temps rise.',
  6:  '☀️ Raise your mowing height to 3.5" for summer stress.',
  7:  '🌡️ Heat stress alert — water deeply 2x/week.',
  8:  '🔍 Scout for grubs now — peak damage month.',
  9:  '🍂 Best month to overseed and aerate!',
  10: '🌾 Apply winterizer fertilizer before ground freezes.',
  11: '❄️ Final mow — lower to 2" before winter.',
};

/** Schedule a seasonal reminder for the current month (fires on the 5th at 9am if not passed, else next applicable month). */
export async function scheduleSeasonalReminder(): Promise<void> {
  await cancelNotificationsByTag('seasonal_reminder');

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // Find next month that has a message
  let targetMonth = currentMonth;
  let targetYear = now.getFullYear();
  let message = SEASONAL_MESSAGES[targetMonth];

  // If no message for current month, find the next one
  if (!message) {
    for (let i = 1; i <= 12; i++) {
      const nextM = ((currentMonth - 1 + i) % 12) + 1;
      if (SEASONAL_MESSAGES[nextM]) {
        targetMonth = nextM;
        if (nextM < currentMonth) targetYear += 1;
        message = SEASONAL_MESSAGES[nextM];
        break;
      }
    }
  }

  if (!message) return;

  // Fire on the 5th of the target month at 9:00 AM
  const triggerDate = new Date(targetYear, targetMonth - 1, 5, 9, 0, 0);

  // If the trigger date has already passed this month, move to same month next year or next valid month
  if (triggerDate <= now) {
    let found = false;
    for (let i = 1; i <= 12; i++) {
      const nextM = ((targetMonth - 1 + i) % 12) + 1;
      if (SEASONAL_MESSAGES[nextM]) {
        const yr = nextM <= targetMonth ? targetYear + 1 : targetYear;
        const nextDate = new Date(yr, nextM - 1, 5, 9, 0, 0);
        if (nextDate > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🌿 LawnGenius Seasonal Tip',
              body: SEASONAL_MESSAGES[nextM],
              data: { screen: 'Home', tag: 'seasonal_reminder' },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: nextDate,
            },
          });
          found = true;
          break;
        }
      }
    }
    if (!found) return;
  } else {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌿 LawnGenius Seasonal Tip',
        body: message,
        data: { screen: 'Home', tag: 'seasonal_reminder' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  }
}

/** Schedule a scan reminder 14 days from now. Call this after each scan to reset the timer. */
export async function scheduleScanReminder(): Promise<void> {
  await cancelNotificationsByTag('scan_reminder');

  const fireDate = new Date();
  fireDate.setDate(fireDate.getDate() + 14);
  fireDate.setHours(10, 0, 0, 0);

  await AsyncStorage.setItem(LAST_SCAN_KEY, new Date().toISOString());

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📷 Time to check your lawn!',
      body: 'You haven\'t scanned your lawn in 2 weeks. How\'s it looking?',
      data: { screen: 'Scan', tag: 'scan_reminder' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
    },
  });
}

/** Fire a test notification immediately. */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌿 LawnGenius Notification Test',
      body: 'Notifications are working! You\'ll receive lawn tips and reminders here.',
      data: { screen: 'Home', tag: 'test' },
      sound: true,
    },
    trigger: null, // immediate
  });
}

/** Cancel all scheduled notifications. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Cancel notifications by tag stored in data. */
async function cancelNotificationsByTag(tag: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/** Set up all default notifications. Call on app launch after permissions granted. */
export async function setupAllNotifications(): Promise<void> {
  const granted = await hasPermission();
  if (!granted) return;

  const [weekly, seasonal, scan] = await Promise.all([
    AsyncStorage.getItem('@lawngenius_notif_weekly'),
    AsyncStorage.getItem('@lawngenius_notif_seasonal'),
    AsyncStorage.getItem('@lawngenius_notif_scan'),
  ]);

  // Default to enabled if not explicitly set to 'false'
  if (weekly !== 'false') await scheduleWeeklyReport();
  if (seasonal !== 'false') await scheduleSeasonalReminder();
  if (scan !== 'false') {
    // Only schedule scan reminder if we have a history — handled by ScanScreen after scan
  }
}

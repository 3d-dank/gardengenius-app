import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import AcademyScreen from './screens/AcademyScreen';
import CalendarScreen from './screens/CalendarScreen';
import { requestPermissions, setupAllNotifications } from './lib/notifications';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const Icon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: focused ? 26 : 22 }}>{emoji}</Text>
  </View>
);

type RootParamList = {
  MainTabs: undefined;
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F2008',
          borderTopColor: 'rgba(139,195,74,0.15)',
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#8BC34A',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="🌿" focused={focused} />, tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="📋" focused={focused} />, tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#A5D660' : '#8BC34A',
              width: 60, height: 60, borderRadius: 30,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              shadowColor: '#8BC34A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 12,
              elevation: 10,
            }}>
              <Text style={{ fontSize: 28 }}>📷</Text>
            </View>
          ),
          tabBarLabel: 'Scan',
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="🌱" focused={focused} />, tabBarLabel: 'Planting' }}
      />
      <Tab.Screen
        name="Academy"
        component={AcademyScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="🎓" focused={focused} />, tabBarLabel: 'Academy' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} />, tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootParamList>>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    (async () => {
      const granted = await requestPermissions();
      if (granted) {
        await setupAllNotifications();
      }
    })();

    notificationListener.current = Notifications.addNotificationReceivedListener(_notification => {
      // Notification received while app is foregrounded
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen as string | undefined;
      if (screen && navigationRef.current) {
        navigationRef.current.navigate('MainTabs' as never);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" />
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

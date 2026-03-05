import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import HistoryScreen from './screens/HistoryScreen';
import PlantingCalendarScreen from './screens/PlantingCalendarScreen';
import MyGardenScreen from './screens/MyGardenScreen';
import ProfileScreen from './screens/ProfileScreen';
import { COLORS } from './lib/theme';

const Tab = createBottomTabNavigator();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, size }: { name: IoniconsName; focused: boolean; size?: number }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons
        name={focused ? (name.replace('-outline', '') as IoniconsName) : name}
        size={size ?? 24}
        color={focused ? COLORS.springLeaf : 'rgba(255,255,255,0.35)'}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.surface0,
              borderTopColor: 'rgba(139,195,74,0.15)',
              borderTopWidth: 1,
              height: 85,
              paddingBottom: 20,
              paddingTop: 8,
            },
            tabBarActiveTintColor: COLORS.springLeaf,
            tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ focused }) => <TabIcon name="home-outline" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Scan"
            component={ScanScreen}
            options={{
              tabBarLabel: 'Scan',
              tabBarIcon: ({ focused }) => <TabIcon name="scan-outline" focused={focused} size={28} />,
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              tabBarLabel: 'History',
              tabBarIcon: ({ focused }) => <TabIcon name="time-outline" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={PlantingCalendarScreen}
            options={{
              tabBarLabel: 'Calendar',
              tabBarIcon: ({ focused }) => <TabIcon name="calendar-outline" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Garden"
            component={MyGardenScreen}
            options={{
              tabBarLabel: 'Garden',
              tabBarIcon: ({ focused }) => <TabIcon name="leaf-outline" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarLabel: 'Profile',
              tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

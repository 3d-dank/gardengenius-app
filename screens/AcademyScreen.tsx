import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING } from '../lib/theme';

// Academy screen — coming soon (legacy screen replaced in new navigation)
export default function AcademyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <Text style={styles.headerTitle}>🎓 Garden Academy</Text>
        </LinearGradient>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 48 }}>🌱</Text>
          <Text style={{ fontSize: 16, color: COLORS.textMuted, marginTop: SPACING.md }}>
            Coming soon
          </Text>
        </View>
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
});

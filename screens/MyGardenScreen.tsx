import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GRADIENTS, GLASS, SPACING, RADIUS } from '../lib/theme';

type PlantType = 'Vegetable' | 'Herb' | 'Flower' | 'Fruit';
type GardenTab = 'plants' | 'beds' | 'gallery';

interface Plant {
  id: string;
  name: string;
  type: PlantType;
  species: string;
  datePlanted: string;
  bedLocation: string;
  notes: string;
  emoji: string;
}

interface Bed {
  id: string;
  name: string;
  sizeSqFt: number;
  crops: string;
  healthScore: number;
  lastActivity: string;
}

const PLANT_TYPE_EMOJIS: Record<PlantType, string> = {
  Vegetable: '🥦',
  Herb: '🌿',
  Flower: '🌸',
  Fruit: '🍓',
};

const SAMPLE_BEDS: Bed[] = [
  { id: '1', name: 'Main Veggie Bed', sizeSqFt: 32, crops: 'Tomatoes, Peppers, Basil', healthScore: 82, lastActivity: '2 days ago' },
  { id: '2', name: 'Herb Garden', sizeSqFt: 12, crops: 'Rosemary, Thyme, Mint', healthScore: 91, lastActivity: 'Today' },
  { id: '3', name: 'Fruit Border', sizeSqFt: 48, crops: 'Strawberries, Raspberries', healthScore: 67, lastActivity: '5 days ago' },
];

function AddPlantModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (p: Plant) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PlantType>('Vegetable');
  const [species, setSpecies] = useState('');
  const [datePlanted, setDatePlanted] = useState(new Date().toISOString().slice(0, 10));
  const [bedLocation, setBedLocation] = useState('');
  const [notes, setNotes] = useState('');

  const save = () => {
    if (!name.trim()) return;
    onSave({
      id: Date.now().toString(),
      name: name.trim(),
      type,
      species: species.trim(),
      datePlanted,
      bedLocation: bedLocation.trim(),
      notes: notes.trim(),
      emoji: PLANT_TYPE_EMOJIS[type],
    });
    setName(''); setSpecies(''); setBedLocation(''); setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[GLASS.cardElevated, styles.modalSheet]}>
          <Text style={styles.modalTitle}>Add Plant</Text>

          <TextInput style={styles.input} placeholder="Plant name *" placeholderTextColor={COLORS.textDisabled}
            value={name} onChangeText={setName} />

          <View style={styles.typeRow}>
            {(['Vegetable', 'Herb', 'Flower', 'Fruit'] as PlantType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typePill, type === t && styles.typePillActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typePillText, type === t && styles.typePillTextActive]}>
                  {PLANT_TYPE_EMOJIS[t]} {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput style={styles.input} placeholder="Species (optional)" placeholderTextColor={COLORS.textDisabled}
            value={species} onChangeText={setSpecies} />
          <TextInput style={styles.input} placeholder="Date planted (YYYY-MM-DD)" placeholderTextColor={COLORS.textDisabled}
            value={datePlanted} onChangeText={setDatePlanted} />
          <TextInput style={styles.input} placeholder="Bed location" placeholderTextColor={COLORS.textDisabled}
            value={bedLocation} onChangeText={setBedLocation} />
          <TextInput style={[styles.input, { height: 70 }]} placeholder="Notes" placeholderTextColor={COLORS.textDisabled}
            value={notes} onChangeText={setNotes} multiline />

          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <LinearGradient colors={[COLORS.freshGrowth, COLORS.vineGreen]} style={styles.saveBtnGrad}>
                <Text style={styles.saveBtnText}>Save Plant</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MyGardenScreen() {
  const [activeTab, setActiveTab] = useState<GardenTab>('plants');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const fabAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const raw = await AsyncStorage.getItem('gardenPlants');
      if (raw) setPlants(JSON.parse(raw));
    } catch (_) {}
  };

  const savePlants = async (updated: Plant[]) => {
    setPlants(updated);
    await AsyncStorage.setItem('gardenPlants', JSON.stringify(updated));
  };

  const addPlant = async (p: Plant) => {
    await savePlants([p, ...plants]);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const daysSince = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  };

  const tapFAB = () => {
    Animated.sequence([
      Animated.spring(fabAnim, { toValue: 0.9, damping: 8, stiffness: 200, useNativeDriver: true }),
      Animated.spring(fabAnim, { toValue: 1, damping: 8, stiffness: 200, useNativeDriver: true }),
    ]).start();
    setShowAddModal(true);
  };

  const renderPlantsTab = () => (
    <View>
      {plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>🪴</Text>
          <Text style={styles.emptyText}>Add your first plant to start tracking your garden!</Text>
        </View>
      ) : (
        <View style={styles.plantGrid}>
          {plants.map((plant) => (
            <View key={plant.id} style={[GLASS.card, styles.plantCard]}>
              <Text style={{ fontSize: 32, marginBottom: 6 }}>{plant.emoji}</Text>
              <Text style={styles.plantName}>{plant.name}</Text>
              {plant.species !== '' && (
                <Text style={styles.plantSpecies}>{plant.species}</Text>
              )}
              <Text style={styles.plantDays}>{daysSince(plant.datePlanted)} days old</Text>
              <View style={[styles.plantTypeBadge]}>
                <Text style={styles.plantTypeBadgeText}>{plant.type}</Text>
              </View>
              <Text style={styles.plantAddedDate}>Added {new Date(plant.datePlanted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderBedsTab = () => (
    <View style={{ paddingHorizontal: SPACING.md }}>
      {SAMPLE_BEDS.map((bed) => (
        <View key={bed.id} style={[GLASS.card, styles.bedCard]}>
          <View style={styles.bedHeader}>
            <Text style={styles.bedName}>{bed.name}</Text>
            <View style={[styles.bedScore, { backgroundColor: bed.healthScore >= 80 ? COLORS.springLeaf + '33' : COLORS.sunflower + '33', borderColor: bed.healthScore >= 80 ? COLORS.springLeaf : COLORS.sunflower }]}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: bed.healthScore >= 80 ? COLORS.springLeaf : COLORS.sunflower }}>{bed.healthScore}</Text>
            </View>
          </View>
          <Text style={styles.bedMeta}>{bed.sizeSqFt} sq ft · Last active {bed.lastActivity}</Text>
          <Text style={styles.bedCrops}>🌱 {bed.crops}</Text>
        </View>
      ))}
    </View>
  );

  const renderGalleryTab = () => (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 48 }}>📸</Text>
      <Text style={styles.emptyText}>No photos yet — start scanning! 📸</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface0 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient colors={GRADIENTS.header} style={styles.header}>
          <Text style={styles.headerTitle}>My Garden</Text>
        </LinearGradient>

        {/* Tab pills */}
        <View style={styles.tabRow}>
          {([
            { key: 'plants', label: '🪴 Plants' },
            { key: 'beds', label: '🌿 Beds' },
            { key: 'gallery', label: '📸 Gallery' },
          ] as { key: GardenTab; label: string }[]).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabPillText, activeTab === tab.key && styles.tabPillTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={{ marginTop: SPACING.md }}>
            {activeTab === 'plants' && renderPlantsTab()}
            {activeTab === 'beds' && renderBedsTab()}
            {activeTab === 'gallery' && renderGalleryTab()}
          </View>
        </ScrollView>

        {/* FAB */}
        {(activeTab === 'plants' || activeTab === 'beds') && (
          <Animated.View style={[styles.fab, { transform: [{ scale: fabAnim }] }]}>
            <TouchableOpacity onPress={tapFAB} style={styles.fabInner}>
              <LinearGradient colors={[COLORS.freshGrowth, COLORS.vineGreen]} style={styles.fabGrad}>
                <Text style={styles.fabText}>+ Add {activeTab === 'plants' ? 'Plant' : 'Bed'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        <AddPlantModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={addPlant}
        />
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.dewBorder,
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: COLORS.vineGreen,
    borderColor: COLORS.springLeaf,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabPillTextActive: {
    color: COLORS.white,
  },
  plantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  plantCard: {
    width: '47%',
    padding: SPACING.md,
    alignItems: 'center',
  },
  plantName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  plantSpecies: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  plantDays: {
    fontSize: 12,
    color: COLORS.springLeaf,
    marginTop: 4,
  },
  plantTypeBadge: {
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    marginTop: 4,
  },
  plantTypeBadgeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  plantAddedDate: {
    fontSize: 10,
    color: COLORS.textDisabled,
    marginTop: 4,
  },
  bedCard: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  bedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bedName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
  },
  bedScore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bedMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  bedCrops: {
    fontSize: 13,
    color: COLORS.petalCream,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.md,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  fabInner: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    shadowColor: COLORS.springLeaf,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGrad: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    padding: SPACING.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.dewBorder,
    marginBottom: SPACING.sm,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  typePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.dewBorder,
  },
  typePillActive: {
    backgroundColor: COLORS.vineGreen,
    borderColor: COLORS.springLeaf,
  },
  typePillText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  typePillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.dewBorder,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  saveBtn: {
    flex: 2,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: RADIUS.pill,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
});

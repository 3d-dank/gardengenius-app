import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  COLORS, GRADIENTS, GLASS, RADIUS, SPACING,
} from '../lib/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface CardData {
  id: string;
  icon: string;
  title: string;
  content: string[];
}

interface RegionData {
  id: string;
  label: string;
  mapEmoji: string;
  states: string;
  grasses: string;
  soil: string;
  challenges: string;
  tips: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const POLLINATOR_CARDS: CardData[] = [
  { id: 'p1', icon: '🕐', title: 'Best Times to Apply Chemicals', content: ['Apply pesticides early morning (before 8 AM) or evening (after 7 PM) when bees are least active.', 'Never spray when flowers are blooming — even "bee-safe" labels require caution during bloom.', 'Avoid spraying on windy days to prevent drift onto flowering plants nearby.', 'Always check the weather: don\'t spray before rain (wash-off) or extreme heat (volatilization).'] },
  { id: 'p2', icon: '🚧', title: 'No-Spray Buffer Zones', content: ['Create a 3–6 ft buffer strip around all garden beds and flower borders.', 'Use physical markers (edging, mulch, stones) to remind yourself of no-spray zones.', 'If using a broadcast spreader for herbicide, manually flag all buffer zones first.', 'Buffer zones also protect ground-nesting bees that nest in bare soil patches.'] },
  { id: 'p3', icon: '🍀', title: 'Benefits of Clover in Your Lawn', content: ['White clover fixes atmospheric nitrogen, reducing your fertilizer needs by up to 50%.', 'Clover blooms feed bumblebees, honeybees, and native bees throughout the season.', 'Stays green during drought when grass goes dormant — great natural filler.', 'Low-growing micro clover varieties blend seamlessly with grass (3–4" height).', 'Tip: Mix 5–10% clover seed into your lawn seed blend for best results.'] },
  { id: 'p4', icon: '✂️', title: 'No-Mow May & Low-Mow Zones', content: ['No-Mow May: skip mowing for the month of May to let early spring wildflowers bloom.', 'Dandelions and violets that emerge in May are critical early food for emerging queen bees.', 'Designate a "low-mow zone" in a corner of your yard — mow every 3–4 weeks instead of weekly.', 'Raise mowing height to 4" throughout summer to allow flowering weeds to feed pollinators.'] },
  { id: 'p5', icon: '🌾', title: 'Bee-Friendly Grass Alternatives', content: ['Fine fescue blends (creeping red, hard, sheep fescue) require less mowing and allow more wildflowers.', 'Eco-lawn mixes include clover, yarrow, and low-growing herbs — mow just 2–3× per season.', 'Buffalo grass (warm-season) is very low-input and supports native bee habitat.', 'Consider converting turf areas near gardens to native plant meadow strips.'] },
  { id: 'p6', icon: '🏷️', title: 'Reading Pesticide Labels for Pollinators', content: ['Look for the bee hazard symbol (🐝 icon) on the front panel — it indicates bee toxicity.', '"Caution" = lowest toxicity; "Warning" = moderate; "Danger" = highest — avoid the last two near blooms.', 'Look for "Do not apply when bees are foraging" or "Do not apply to blooming plants" language.', 'Neonicotinoids (imidacloprid, clothianidin, thiamethoxam) are systemic — avoid entirely near bee habitat.', 'Pyrethrin (organic) is still toxic to bees when wet — apply at dusk and allow to dry.'] },
];

const CHEMICAL_CARDS: CardData[] = [
  { id: 'c1', icon: '🌿', title: 'Herbicides: Pre vs Post-Emergent', content: ['Pre-emergent: Applied before weed seeds germinate. Prevents crabgrass, goosegrass, foxtail.', 'Timing: Apply when soil temp reaches 50–55°F for 3+ consecutive days (spring). In MN, typically mid-April.', 'Rain window: Water in within 2–3 days, but avoid heavy rain immediately after (wash-off risk).', 'Post-emergent: Applied to actively growing weeds. Works best when weeds are young (< 4 leaf stage).', 'Common post-emergents: 2,4-D (broadleaf), MSMA (grass weeds). Never apply in heat > 85°F.'] },
  { id: 'c2', icon: '🧪', title: 'Fertilizers: N-P-K Explained', content: ['N (Nitrogen): Drives leaf/shoot growth and green color. Most important number for lawns.', 'P (Phosphorus): Root development. Important for new seedings; established lawns rarely need extra P.', 'K (Potassium): Stress tolerance, disease resistance, drought hardiness. Often overlooked.', 'Slow-release: Feeds for 6–12 weeks, gentler, lower burn risk. Best for summer applications.', 'Fast-release: Greens up within days. Use in spring/fall when temps are cool. Can burn in heat.', 'Granular vs Liquid: Granular is easier to store/apply. Liquid is faster-acting for quick fixes.'] },
  { id: 'c3', icon: '🍄', title: 'Fungicides: When & How to Use', content: ['Use fungicides when you see brown patch, dollar spot, gray leaf spot, or red thread symptoms.', 'Preventive applications are more effective than curative — start when conditions favor disease (warm + humid nights).', 'Rotate fungicide classes (FRAC codes) each application to prevent resistance buildup.', 'Common classes: DMI (propiconazole), QoI (azoxystrobin), SDHI (fluxapyroxad). Never use same class twice in a row.', 'Apply in the morning so foliage dries before evening — wet overnight conditions spread fungus.'] },
  { id: 'c4', icon: '🐛', title: 'Pesticides: Spot Treat vs Broadcast', content: ['Always spot treat first — apply only to affected areas rather than blanket spraying.', 'Broadcast treatment justified when >30% of lawn shows pest damage (grubs, sod webworm, etc.).', 'Re-entry intervals: Most lawn pesticides require 24–48 hrs before kids and pets can return.', 'Granular pesticides: water in immediately after application to activate. Keep kids/pets off until dry.', 'Store unused pesticides in original containers in a cool, dry, locked location.'] },
  { id: 'c5', icon: '⚠️', title: 'Never Mix These Chemicals', content: ['🚫 Bleach + Ammonia → produces toxic chloramine gas. Never combine.', '🚫 Herbicide + Fungicide (most combinations) → reduced efficacy of both, possible phytotoxicity.', '🚫 Iron sulfate + Phosphorus fertilizer → locks up both nutrients, neither becomes available.', '🚫 Neonicotinoid insecticide + Fungicide (DMI class) → dramatically increases bee toxicity.', '🚫 Copper fungicide + Acidic fertilizers → can cause severe leaf burn.', 'Rule of thumb: Always read both labels before mixing. If one says "do not mix with other chemicals," don\'t.'] },
];

const REGIONS: RegionData[] = [
  { id: 'midwest', label: 'Midwest', mapEmoji: '🌾', states: 'MN, WI, IA, IL', grasses: 'Kentucky Bluegrass, Tall Fescue, Fine Fescue, Perennial Ryegrass', soil: 'Clay-heavy soils with high water retention. pH typically 6.5–7.2.', challenges: 'Freeze/thaw cycles heave roots; late spring green-up (May); summer heat stress; crabgrass pressure in July–August.', tips: ['Overseed in late August–September when soil is still warm — best germination window.', 'Apply pre-emergent in mid-April when forsythia blooms (soil temp 50°F signal).', 'Core aerate in fall to break up compacted clay and improve drainage.', 'Spring green-up begins when soil temps hit 50°F — typically early May in zone 4b (Minneapolis).', 'Winter: final mow at 2.5" in late October to reduce snow mold risk.'] },
  { id: 'northeast', label: 'Northeast', mapEmoji: '🍁', states: 'NY, NJ, PA', grasses: 'Kentucky Bluegrass, Tall Fescue, Fine Fescue, Perennial Ryegrass', soil: 'Acidic soils (pH 5.5–6.5). Variable texture from sandy (NJ Shore) to rocky/clay (upstate NY).', challenges: 'Japanese beetle grubs, crabgrass, dollar spot fungus, harsh winters, spring flooding.', tips: ['Grub prevention: apply Merit (imidacloprid) or Acelepryn in June before beetles lay eggs.', 'Pre-emergent timing: forsythia bloom = apply pre-emergent. Usually late April in zone 6.', 'Fall is the BEST time to seed in the Northeast — soil warm, air cool, fewer weed competitors.', 'Soil test every 2–3 years; lime applications of 50 lbs/1000 sq ft correct acidity over 6–12 months.', 'Crabgrass germinates when soil hits 55°F for 3+ days — don\'t miss the pre-emergent window.'] },
  { id: 'southeast', label: 'Southeast', mapEmoji: '🌴', states: 'FL, GA, SC', grasses: 'St. Augustine, Bermuda, Zoysia, Centipede', soil: 'Sandy, fast-draining soils with low CEC. Low nutrient retention, pH 5.5–6.5.', challenges: 'Year-round growing season; chinch bugs in St. Augustine; grey leaf spot fungus; intense summer heat and humidity.', tips: ['Fertilize monthly May–September with slow-release N. Back off in Oct–Nov.', 'Water 2–3× per week in summer (1" total/week). Sandy soils dry out fast.', 'Chinch bugs: look for irregular brown patches in sunny areas in summer. Treat with bifenthrin.', 'St. Augustine won\'t tolerate shade — overseed shady areas with fine fescue or remove turf.', 'Scalp Bermuda to 0.5–1" in early spring (before green-up) to remove thatch and stimulate growth.'] },
  { id: 'southwest', label: 'Southwest', mapEmoji: '🌵', states: 'TX, AZ, NM', grasses: 'Bermuda, Buffalo, Zoysia, St. Augustine (TX coast), Blue Grama', soil: 'Alkaline soils (pH 7.5–8.5). Caliche hardpan layers block drainage and root growth.', challenges: 'Extreme heat (115°F+), drought, alkaline soils locking up iron/manganese, caliche barriers.', tips: ['Water deeply 1–2×/week rather than daily. Caliche prevents deep drainage — watch for root rot.', 'Apply sulfur or iron sulfate annually to lower pH and green up iron-deficient lawns.', 'Break through caliche layer when planting: drill holes 18–24" deep and fill with amended soil.', 'Buffalo grass: only mow 2–3×/season. Extremely drought-tolerant. Ideal for low-input yards.', 'Bermuda goes dormant in winter — overseed with annual ryegrass for winter color if desired.'] },
  { id: 'pnw', label: 'Pacific NW', mapEmoji: '🌲', states: 'WA, OR', grasses: 'Tall Fescue, Fine Fescue, Perennial Ryegrass, Colonial Bentgrass', soil: 'Acidic soils (pH 5.5–6.5). Often compacted. High moss pressure in low-light/wet areas.', challenges: 'Wet winters promote moss; acidic soil limits nutrient uptake; limited sunlight; slugs and leatherjackets.', tips: ['Apply lime (dolomitic) in fall to raise pH and suppress moss. Test soil every 2–3 years.', 'Moss control: iron sulfate works fast. Address root cause (drainage, light, pH) for lasting fix.', 'Overseed in September — the Pacific NW\'s cool, moist fall is ideal for germination.', 'Avoid excess nitrogen in fall — promotes lush growth that\'s susceptible to Fusarium patch.', 'Core aerate in fall to improve drainage in compacted soils before the rainy season.'] },
  { id: 'plains', label: 'Plains', mapEmoji: '🌻', states: 'KS, NE, OK', grasses: 'Buffalo Grass, Blue Grama, Zoysia, Tall Fescue (north), Bermuda (south)', soil: 'Deep loam soils (prairie heritage). Excellent fertility, pH 6.5–7.5. Wind erosion risk.', challenges: 'Extreme temperature swings (100°F summer, -20°F winter), wind desiccation, tornado season disruption.', tips: ['Buffalo grass and blue grama require almost no inputs — ideal for large low-maintenance properties.', 'Water deeply 1× per week in summer. Plains soils hold moisture well but wind speeds up evaporation.', 'Fall fertilization (October) with potassium boosts winter hardiness for cool-season grasses.', 'In Oklahoma/southern KS, bermuda outperforms fescue — transition zone is challenging for cool-season.', 'Avoid seeding in spring when wind is high — wait for fall or use erosion-control blankets.'] },
];

const WATERING_CARDS: CardData[] = [
  { id: 'w1', icon: '📏', title: 'Deep & Infrequent vs Shallow & Frequent', content: ['Deep & infrequent: Water 1" per week in 1–2 sessions. Encourages roots to grow 6–8" deep.', 'Shallow & frequent: Watering daily with small amounts keeps roots in top 2" — prone to drought stress.', 'Test depth: Push a screwdriver 6" into soil after watering. It should go in easily if moisture is adequate.', 'How to measure 1": Place a tuna can in the spray zone — when it\'s full, you\'ve applied ~1".'] },
  { id: 'w2', icon: '🌅', title: 'Best Time to Water', content: ['Early morning (5–9 AM) is ideal. Water pressure is highest, temperatures are cool, evaporation is low.', 'Afternoon watering wastes 20–30% to evaporation and can stress heat-scorched leaves.', 'Evening watering leaves foliage wet overnight — major contributor to fungal disease (brown patch, pythium).', 'If you must water in evening, run sprinklers early enough for foliage to dry before 10 PM.'] },
  { id: 'w3', icon: '🔍', title: 'Signs of Overwatering vs Underwatering', content: ['Overwatering signs: Mushy soil, yellowing grass, increased weed/moss/fungus, runoff on hard surfaces.', 'Underwatering signs: Grass folds/curls, blue-gray tint (instead of bright green), footprints remain visible.', 'Footprint test: Step on grass and walk away. If blades spring back quickly → adequate water. If stay flat → dry.', 'Overwatering is more common than underwatering. When in doubt, skip a watering cycle.'] },
  { id: 'w4', icon: '🌵', title: 'Drought Stress Recovery', content: ['Cool-season grasses (fescue, bluegrass) go dormant in drought — this is normal, not death.', 'Dormant grass needs just 0.5" every 2–3 weeks to stay alive (survival watering).', 'Recovery: Resume normal 1"/week irrigation when temps drop below 85°F. Green-up takes 2–3 weeks.', 'Avoid fertilizing stressed/dormant grass — you\'ll burn roots and compound the damage.', 'Aerate and overseed after recovery in fall to fill in thin areas damaged by drought.'] },
];

const SEASONAL_CARDS: CardData[] = [
  { id: 's1', icon: '🌸', title: 'Spring: Waking Up Your Lawn', content: ['Dethatch when thatch layer exceeds 0.5" — use a power rake in early spring before green-up.', 'Pre-emergent: Apply when soil temp hits 50–55°F. Missing this window means crabgrass all summer.', 'Overseed bare spots once soil temps are above 50°F. Don\'t overseed if you\'ve applied pre-emergent.', 'First fertilization: Light application (0.5 lb N/1000 sq ft) after green-up. Don\'t push heavy growth yet.', 'First mow: Set blade high (3–3.5"). Never remove more than 1/3 of blade height at once.'] },
  { id: 's2', icon: '☀️', title: 'Summer: Heat Survival Mode', content: ['Raise mowing height to 3.5–4.5" in summer. Taller grass shades soil, reduces water loss.', 'Limit or skip nitrogen fertilizer in summer heat (above 85°F) — promotes disease and burn.', 'Watch for heat stress: blue-gray color, footprints remaining = drought stress signal.', 'Brown patch fungus thrives in warm, humid summers. Don\'t water in the evening.', 'Grub treatment window: Apply preventive insecticide in June–July before white grubs hatch.'] },
  { id: 's3', icon: '🍂', title: 'Fall: The Most Important Season', content: ['Best time to overseed cool-season grasses: late August through September.', 'Core aeration: Run aerator when soil is moist but not wet. Aerate before overseeding for best seed contact.', 'Fall fertilizer: Apply a "winterizer" fertilizer (high K, lower N) in October to build root reserves.', 'Phosphorus in fall fertilizer helps root development — look for 5-10-30 or similar blends.', 'Leaf management: Mulch leaves with mower (thin layer ok) or remove heavy accumulation before winter.', 'Final mow: Cut to 2.5–3" before first frost to reduce snow mold risk from long blades matting down.'] },
  { id: 's4', icon: '❄️', title: 'Winter: Prepare & Plan', content: ['Final mow: 2.5–3" height reduces snow mold pressure under heavy snow cover.', 'Equipment storage: Drain fuel from mower or add stabilizer. Sharpen blades before storing.', 'Soil testing: Winter is the best time to send in soil samples (labs are less backed up).', 'Plan for spring: Order seed, lime, pre-emergent now so you\'re ready when temps warm.', 'Avoid walking on frozen grass — ice crystals in grass blades break when compressed, causing crown damage.'] },
];

// ─── ContentCard ─────────────────────────────────────────────────────────────

function ContentCard({ card, accentColor, isFeatured }: { card: CardData; accentColor: string; isFeatured?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = async () => {
    await Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={toggle} style={[styles.card, isFeatured && styles.featuredCard]}>
      {/* Left accent border */}
      <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />

      <View style={styles.cardInner}>
        {/* Icon + expand hint */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardIcon}>{card.icon}</Text>
          <Text style={[styles.expandHint, { color: accentColor }]}>{expanded ? '▲' : '▼'}</Text>
        </View>

        <Text style={[styles.cardTitle, isFeatured && styles.featuredTitle]}>{card.title}</Text>

        {!expanded && (
          <Text style={styles.cardPreview} numberOfLines={2}>{card.content[0]}</Text>
        )}

        {expanded && (
          <View style={styles.cardBody}>
            {card.content.map((line, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: accentColor }]}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── RegionPill ───────────────────────────────────────────────────────────────

function RegionPill({ region, selected, onPress }: { region: RegionData; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.regionBtn, selected && styles.regionBtnActive]}
      activeOpacity={0.75}
    >
      <Text style={styles.regionEmoji}>{region.mapEmoji}</Text>
      <Text style={[styles.regionBtnLabel, selected && styles.regionBtnLabelActive]}>{region.label}</Text>
      <Text style={[styles.regionBtnStates, selected && styles.regionBtnStatesActive]}>{region.states}</Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AcademyScreen() {
  const [selectedRegionId, setSelectedRegionId] = useState('midwest');
  const selectedRegion = REGIONS.find(r => r.id === selectedRegionId)!;

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background} style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Hero ──────────────────────────────────────────────────── */}
          <LinearGradient colors={GRADIENTS.header} style={styles.heroBanner}>
            <Text style={styles.heroEmoji}>{selectedRegion.mapEmoji}</Text>
            <Text style={styles.heroTitle}>Your {selectedRegion.label} Lawn</Text>
            <Text style={styles.heroSub}>Lawn Academy · Personalized</Text>
          </LinearGradient>

          {/* ── Region Selector ──────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>Select Your Region</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: SPACING.md }}
              contentContainerStyle={{ gap: SPACING.sm, paddingVertical: 4 }}
            >
              {REGIONS.map(r => (
                <RegionPill
                  key={r.id}
                  region={r}
                  selected={r.id === selectedRegionId}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedRegionId(r.id);
                  }}
                />
              ))}
            </ScrollView>

            {/* Region detail */}
            <View style={[GLASS.card, styles.regionDetail]}>
              <View style={styles.regionDetailHeader}>
                <Text style={styles.regionDetailEmoji}>{selectedRegion.mapEmoji}</Text>
                <View>
                  <Text style={styles.regionDetailName}>{selectedRegion.label} Region</Text>
                  <Text style={styles.regionDetailStates}>{selectedRegion.states}</Text>
                </View>
              </View>
              <View style={styles.regionDivider} />
              {[
                { label: '🌾 Grasses', text: selectedRegion.grasses },
                { label: '🪨 Soil', text: selectedRegion.soil },
                { label: '⚠️ Challenges', text: selectedRegion.challenges },
              ].map(item => (
                <View key={item.label} style={{ marginTop: SPACING.sm }}>
                  <Text style={styles.regionDetailLabel}>{item.label}</Text>
                  <Text style={styles.regionDetailText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Seasonal Tips for Region ──────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>🌱 {selectedRegion.label} Seasonal Care</Text>
            <View style={[GLASS.card, styles.tipsCard]}>
              <Text style={styles.tipsHeading}>📍 {selectedRegion.label} Priorities</Text>
              {selectedRegion.tips.map((tip, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: COLORS.limeAccent }]}>•</Text>
                  <Text style={styles.bulletText}>{tip}</Text>
                </View>
              ))}
            </View>
            {SEASONAL_CARDS.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor={COLORS.limeAccent} isFeatured={idx === 0} />
            ))}
          </View>

          {/* ── Watering ─────────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>💧 Watering</Text>
            {WATERING_CARDS.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor={COLORS.skyBlue} isFeatured={idx === 0} />
            ))}
          </View>

          {/* ── Chemicals ────────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>⚗️ Chemicals & Products</Text>
            {CHEMICAL_CARDS.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor="#A78BFA" isFeatured={idx === 0} />
            ))}
          </View>

          {/* ── Pollinators ──────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>🐝 Eco & Pollinators</Text>
            {POLLINATOR_CARDS.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor={COLORS.earthWarm} isFeatured={idx === 0} />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface0 },
  scrollContent: { paddingBottom: 16 },

  // Hero
  heroBanner: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 44, marginBottom: SPACING.sm },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heroSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 6,
  },

  // Sections
  sectionWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },

  // Region pills
  regionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    minWidth: 72,
  },
  regionBtnActive: {
    backgroundColor: COLORS.limeAccent + '25',
    borderColor: COLORS.limeAccent,
  },
  regionEmoji: { fontSize: 20, marginBottom: 3 },
  regionBtnLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  regionBtnLabelActive: { color: COLORS.limeAccent },
  regionBtnStates: { fontSize: 9, color: COLORS.textMuted, marginTop: 1 },
  regionBtnStatesActive: { color: COLORS.limeAccent + 'AA' },

  // Region detail
  regionDetail: { padding: SPACING.md },
  regionDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  regionDetailEmoji: { fontSize: 36 },
  regionDetailName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  regionDetailStates: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  regionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  regionDetailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.limeAccent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  regionDetailText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  // Tips card
  tipsCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  tipsHeading: { fontSize: 14, fontWeight: '700', color: COLORS.limeAccent, marginBottom: SPACING.sm },

  // Content card
  card: {
    ...GLASS.card,
    marginBottom: SPACING.sm,
    padding: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  featuredCard: {
    backgroundColor: 'rgba(126,200,69,0.08)',
    borderColor: 'rgba(126,200,69,0.25)',
  },
  cardAccentBar: {
    width: 4,
    borderTopLeftRadius: RADIUS.xl,
    borderBottomLeftRadius: RADIUS.xl,
  },
  cardInner: { flex: 1, padding: SPACING.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardIcon: { fontSize: 20 },
  expandHint: { fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 20, marginBottom: 4 },
  featuredTitle: { fontSize: 16, fontWeight: '800' },
  cardPreview: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  cardBody: { marginTop: 6 },

  // Bullets
  bulletRow: { flexDirection: 'row', marginTop: 6, gap: 8 },
  bulletDot: { fontSize: 14, lineHeight: 22, fontWeight: '800' },
  bulletText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
});

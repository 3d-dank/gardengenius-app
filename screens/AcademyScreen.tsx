import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, GRADIENTS, GLASS, RADIUS, SPACING } from '../lib/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  climate: string;
  soilType: string;
  challenges: string;
  tips: string[];
}

// ─── Region Data ──────────────────────────────────────────────────────────────
const REGIONS: RegionData[] = [
  {
    id: 'midwest',
    label: 'Midwest',
    mapEmoji: '🌾',
    states: 'MN, WI, IA, IL',
    climate: 'Cold winters, warm summers. Zones 4–6.',
    soilType: 'Heavy clay to loam. Excellent fertility but compacts easily.',
    challenges: 'Short growing season, late frosts, clay drainage, Japanese beetles.',
    tips: [
      'Start tomatoes & peppers indoors 6–8 weeks before May 15 last frost.',
      'Raised beds help with clay soil drainage and warm up faster in spring.',
      'Plant garlic in October for harvest next July.',
      'Succession plant lettuce every 2 weeks to extend harvest through June.',
      'Cover crops (winter rye, crimson clover) protect soil from fall through spring.',
    ],
  },
  {
    id: 'northeast',
    label: 'Northeast',
    mapEmoji: '🍁',
    states: 'NY, NJ, PA, MA',
    climate: 'Variable, humid. Zones 5–7. Frost risk until May.',
    soilType: 'Acidic, rocky, ranges from sandy (coast) to clay-loam.',
    challenges: 'Late spring frosts, Japanese beetles, cabbage worms, acidic soil.',
    tips: [
      'Lime applications raise pH to 6.5 for most vegetables — test every 2–3 years.',
      'Use floating row covers to extend the season and keep out cabbage moths.',
      'Fall is excellent for planting garlic, overwintered spinach, and kale.',
      'Rotate brassicas annually to prevent clubroot and cabbage worm buildup.',
      'Asparagus beds take 3 years but produce for 20+ years — plant them now!',
    ],
  },
  {
    id: 'southeast',
    label: 'Southeast',
    mapEmoji: '🌴',
    states: 'FL, GA, SC, AL',
    climate: 'Hot, humid summers. Mild winters. Zones 7–10.',
    soilType: 'Sandy, fast-draining, low pH (5.5–6.5). Low organic matter.',
    challenges: 'Heat stress, root rot, nematodes, fire ants, fungal diseases.',
    tips: [
      'Two growing seasons: spring (Feb–June) and fall (Aug–Nov). Skip July/Aug planting in FL.',
      'Add heavy compost amendments to sandy soils every season for water retention.',
      'Plant resistant tomato varieties (Celebrity, Better Boy) to combat nematodes.',
      'Use soaker hoses + thick mulch to conserve moisture in summer heat.',
      'Sweet potatoes, okra, and Southern peas thrive in the heat — great summer crops.',
    ],
  },
  {
    id: 'southwest',
    label: 'Southwest',
    mapEmoji: '🌵',
    states: 'TX, AZ, NM',
    climate: 'Hot, dry. Alkaline soil. Zones 7–10. Intense UV.',
    soilType: 'Caliche hardpan, alkaline pH (7.5–8.5), low organic matter.',
    challenges: 'Extreme heat, alkaline soil locking nutrients, caliche, monsoon flooding.',
    tips: [
      'Use shade cloth (30–50%) over tomatoes and peppers during July–Aug heat.',
      'Drip irrigation is essential — water deeply 2–3x/week to beat evaporation.',
      'Add sulfur to lower pH for iron absorption; yellowing often signals iron deficiency.',
      'Build raised beds over caliche — roots can\'t penetrate the hardpan.',
      'Fall gardens (Sept–Nov) are excellent for cool-season crops in this region.',
    ],
  },
  {
    id: 'pnw',
    label: 'Pacific NW',
    mapEmoji: '🌲',
    states: 'WA, OR',
    climate: 'Cool, wet winters. Warm, dry summers. Zones 7–9.',
    soilType: 'Acidic, often compacted. High organic matter in coastal valleys.',
    challenges: 'Slugs, late blight on tomatoes, short warm season, moss, powdery mildew.',
    tips: [
      'Use black plastic mulch to warm soil and grow tomatoes successfully in cool summers.',
      'Slug control: iron phosphate bait (Sluggo) is safe around pets and vegetables.',
      'Excellent climate for brassicas, root crops, leeks, and potatoes year-round.',
      'Blight-resistant tomato varieties (Defiant, Jasper) are worth the extra cost.',
      'Fall-sown garlic and overwintered brassicas thrive in mild PNW winters.',
    ],
  },
  {
    id: 'mountains',
    label: 'Mountains',
    mapEmoji: '🏔️',
    states: 'CO, UT, MT',
    climate: 'Short, intense season. High altitude, intense UV. Zones 3–6.',
    soilType: 'Alkaline, low organic matter. Wide variation by elevation.',
    challenges: 'Frost risk year-round at altitude, hail, intense UV, short season.',
    tips: [
      'Row covers extend the season on both ends — use them aggressively.',
      'Plant fast-maturing varieties: Stupice tomatoes, early corn, short-season squash.',
      'Hail cloth over raised beds is a worthwhile investment in hail-prone areas.',
      'Container gardens on south-facing decks warm up faster and beat frost risk.',
      'Root vegetables (carrots, beets, parsnips) handle cold better than tomatoes — lean on them.',
    ],
  },
];

// ─── Content Cards ────────────────────────────────────────────────────────────
const SOIL_CARDS: CardData[] = [
  {
    id: 'soil1', icon: '🧪', title: 'Soil Testing: The Foundation of a Healthy Garden',
    content: [
      'Test your soil pH every 2–3 years. Most vegetables thrive in pH 6.0–7.0.',
      'pH below 6.0: add lime (dolomitic for Mg, calcitic for Ca) at 5–10 lbs/100 sq ft.',
      'pH above 7.5: add elemental sulfur or acidifying fertilizer to lower pH over 6–12 months.',
      'N-P-K: nitrogen drives leafy growth; phosphorus builds roots; potassium boosts stress tolerance.',
      'Micronutrients matter: iron deficiency causes yellowing (chlorosis) in alkaline soils — use chelated iron.',
    ],
  },
  {
    id: 'soil2', icon: '🪱', title: 'Building Healthy Garden Soil',
    content: [
      'Add 2–4" of compost annually — the single most impactful soil improvement.',
      'Worm castings supercharge soil biology: apply 1/4" as top dressing or brew a tea.',
      'Avoid tilling when possible — no-till builds soil structure and worm population.',
      'Cover crops (buckwheat, clover, winter rye) add organic matter and fix nitrogen.',
      'Mulch bare soil: 2–3" of straw or wood chip prevents erosion, suppresses weeds, retains moisture.',
    ],
  },
  {
    id: 'soil3', icon: '♻️', title: 'Composting at Home',
    content: [
      'Ratio: 2–3 parts "brown" (dried leaves, straw, cardboard) to 1 part "green" (kitchen scraps, grass).',
      'Chop materials into smaller pieces to accelerate decomposition — aim for tennis ball size or smaller.',
      'Maintain moisture like a wrung-out sponge. Too dry = stalls. Too wet = anaerobic and smelly.',
      'Turn pile every 2–4 weeks to introduce oxygen and speed the process.',
      'Compost is ready when it looks like dark, crumbly soil and smells earthy — typically 2–6 months.',
    ],
  },
];

const PEST_CARDS: CardData[] = [
  {
    id: 'pest1', icon: '🐛', title: 'Common Garden Pests & Organic Controls',
    content: [
      'Aphids: blast off with hose; spray neem oil or insecticidal soap. Attract ladybugs with dill & fennel.',
      'Cabbage worms: use Bacillus thuringiensis (Bt) — targets caterpillars, safe for everything else.',
      'Squash vine borers: use row covers until flowers appear; inject Bt into entry holes.',
      'Tomato hornworms: hand-pick at night with a UV flashlight (they glow!). Parasitic wasps help.',
      'Spider mites: spray with water + neem oil. Avoid during hot, dry weather when mites thrive.',
    ],
  },
  {
    id: 'pest2', icon: '🍄', title: 'Plant Diseases: Diagnosis & Treatment',
    content: [
      'Powdery mildew (white coating): spray baking soda + water (1 tbsp/gallon) or potassium bicarbonate.',
      'Early blight (brown concentric rings on tomato): remove affected leaves, apply copper fungicide.',
      'Damping off (seedling collapse): use sterile seed mix, avoid overwatering, improve air circulation.',
      'Gray mold (Botrytis): reduce humidity, improve spacing, remove affected tissue. Apply sulfur spray.',
      'Root rot: caused by overwatering + poor drainage. Add perlite to mix; let soil dry between waterings.',
    ],
  },
  {
    id: 'pest3', icon: '🏡', title: 'Integrated Pest Management (IPM)',
    content: [
      'Start with the least toxic solution first: physical removal → biological controls → organic sprays → chemicals.',
      'Companion planting: basil repels aphids from tomatoes; marigolds deter nematodes; nasturtiums trap aphids.',
      'Yellow sticky traps catch fungus gnats, whiteflies, and aphids — use for monitoring.',
      'Beneficial insect habitat: plant dill, fennel, yarrow, and flowers to attract predatory wasps and ladybugs.',
      'Crop rotation prevents soil-borne diseases — never plant the same crop family in the same spot consecutively.',
    ],
  },
];

const WATERING_CARDS: CardData[] = [
  {
    id: 'w1', icon: '💧', title: 'Watering: Deep & Infrequent Is Better',
    content: [
      'Water deeply 1–2" per week rather than light daily watering — encourages deep, drought-tolerant roots.',
      'Drip irrigation is the gold standard: delivers water directly to roots, minimizes foliar disease.',
      'Soaker hoses are the budget alternative — lay under mulch for efficient, even delivery.',
      'Overhead watering works but wet foliage at night promotes fungal disease. Water in the morning.',
      'Raised beds dry out faster than in-ground — may need 2–3x/week in summer heat.',
    ],
  },
  {
    id: 'w2', icon: '🌡️', title: 'Reading Plant Water Stress Signs',
    content: [
      'Underwatering: wilting in the afternoon (when it\'s hottest), leaves curl inward, soil is dry 2" down.',
      'Overwatering: yellowing lower leaves, soft stems, root rot smell, algae on soil surface.',
      'Tomatoes: crack when soil moisture is inconsistent — even watering prevents blossom end rot.',
      'Finger test: stick your finger 2" into soil. Water only if it feels dry at that depth.',
      'Self-watering containers and drip ollas drastically reduce watering effort in beds.',
    ],
  },
];

const SEASONAL_CARDS: CardData[] = [
  {
    id: 's1', icon: '🌸', title: 'Spring: Garden Prep & Early Season',
    content: [
      'Amend soil with 2–4" of compost before planting. Work in with broad fork, not rototiller.',
      'Soil temp 50°F+ for peas, lettuce, spinach, radishes. 60°F+ for tomatoes, beans, squash.',
      'Harden off seedlings over 7–10 days before transplanting outdoors.',
      'Set up trellises and cages before plants need them — avoids damaging roots later.',
      'Apply pre-emergent weed barrier (mulch or corn gluten) before weeds emerge.',
    ],
  },
  {
    id: 's2', icon: '☀️', title: 'Summer: Peak Season Management',
    content: [
      'Side-dress heavy feeders (tomatoes, corn, squash) with compost tea or balanced fertilizer monthly.',
      'Pinch tomato suckers for indeterminate varieties to direct energy to fruit production.',
      'Harvest regularly — leaving overgrown vegetables on the vine stops new production.',
      'Apply 3–4" of straw mulch to conserve moisture and regulate soil temperature.',
      'Watch for heat stress above 90°F: shade cloth, extra water, and avoid foliar feeding in heat.',
    ],
  },
  {
    id: 's3', icon: '🍂', title: 'Fall: Extend Season & Prep for Next Year',
    content: [
      'Plant fall crops 6–8 weeks before first frost: kale, spinach, lettuce, beets, carrots.',
      'Use row covers to extend harvest 4–6 weeks past first frost date.',
      'Plant garlic in October (or Nov in mild climates) for harvest next summer.',
      'Sow cover crops in empty beds to protect soil through winter.',
      'Amend beds with compost before frost — it breaks down over winter and feeds spring plants.',
    ],
  },
  {
    id: 's4', icon: '❄️', title: 'Winter: Rest & Plan',
    content: [
      'Clean and oil metal tools to prevent rust. Sharpen hoe and pruner blades.',
      'Cold stratify seeds that need it (many wildflowers and perennials) in the fridge for 30–90 days.',
      'Review season notes: what grew well, pest patterns, yield records. Plan rotation.',
      'Order seeds early — popular varieties sell out by February.',
      'Force amaryllis and paper whites for indoor winter blooms.',
    ],
  },
];

const PLANT_GUIDES: CardData[] = [
  {
    id: 'pg1', icon: '🍅', title: 'Tomatoes: Growing the Perfect Crop',
    content: [
      'Plant deep — bury 2/3 of stem; roots form along buried stem for a stronger plant.',
      'Spacing: 2–3 ft for determinate; 3–4 ft for indeterminate. Good airflow prevents disease.',
      'Blossom end rot: calcium deficiency worsened by inconsistent watering. Keep moisture even.',
      'Fertilize: high nitrogen at transplant; switch to low-N, high-K when flowers appear.',
      'Pruning: remove suckers on indeterminate types for better fruit; leave them on determinate.',
    ],
  },
  {
    id: 'pg2', icon: '🌶️', title: 'Peppers: Hot & Sweet',
    content: [
      'Peppers love heat — don\'t rush transplanting. Wait until nights are consistently 55°F+.',
      'Use black plastic mulch to warm soil and boost yield in cooler climates.',
      'Too much nitrogen = lush foliage, poor fruiting. Use low-N fertilizer after transplant.',
      'Underwatered peppers drop flowers. Water consistently — 1" per week minimum.',
      'Green peppers can be harvested early; leaving them to ripen red doubles the vitamin C content.',
    ],
  },
  {
    id: 'pg3', icon: '🥒', title: 'Cucumbers & Squash',
    content: [
      'Trellising cucumbers saves space, reduces disease, and makes harvest much easier.',
      'Squash vine borers: protect with row cover until flowers open. Inject Bt into entry holes after.',
      'Bitter cucumbers: caused by heat stress, inconsistent watering, or open-pollination with wild relatives.',
      'Male flowers appear first — don\'t panic when they fall off without fruiting.',
      'Harvest zucchini at 6–8" — they turn into bats if left on the vine overnight.',
    ],
  },
  {
    id: 'pg4', icon: '🌿', title: 'Herbs: Easy & Rewarding',
    content: [
      'Basil loves heat — plant after last frost; bring indoors before temperatures hit 50°F.',
      'Prevent basil bolting: pinch off flower heads as soon as they appear.',
      'Perennial herbs (thyme, oregano, sage, rosemary) get better with each year.',
      'Mint is invasive — grow in containers or install a root barrier 12" deep.',
      'Harvest herbs in the morning after dew dries — highest essential oil concentration.',
    ],
  },
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
      <View style={[styles.cardAccentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardInner}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardIcon}>{card.icon}</Text>
          <Text style={[styles.expandHint, { color: accentColor }]}>{expanded ? '▲' : '▼'}</Text>
        </View>
        <Text style={[styles.cardTitle, isFeatured && styles.featuredTitle]}>{card.title}</Text>
        {!expanded && <Text style={styles.cardPreview} numberOfLines={2}>{card.content[0]}</Text>}
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

export default function GardenAcademyScreen() {
  const [selectedRegionId, setSelectedRegionId] = useState('midwest');
  const selectedRegion = REGIONS.find(r => r.id === selectedRegionId)!;

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <LinearGradient colors={GRADIENTS.header} style={styles.heroBanner}>
            <Text style={styles.heroEmoji}>{selectedRegion.mapEmoji}</Text>
            <Text style={styles.heroTitle}>Your {selectedRegion.label} Garden</Text>
            <Text style={styles.heroSub}>Garden Academy · Personalized</Text>
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
                { label: '🌤️ Climate', text: selectedRegion.climate },
                { label: '🪨 Soil', text: selectedRegion.soilType },
                { label: '⚠️ Challenges', text: selectedRegion.challenges },
              ].map(item => (
                <View key={item.label} style={{ marginTop: SPACING.sm }}>
                  <Text style={styles.regionDetailLabel}>{item.label}</Text>
                  <Text style={styles.regionDetailText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Regional Tips ─────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>🌱 {selectedRegion.label} Garden Priorities</Text>
            <View style={[GLASS.card, styles.tipsCard]}>
              <Text style={styles.tipsHeading}>📍 {selectedRegion.label} Top Tips</Text>
              {selectedRegion.tips.map((tip, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: COLORS.limeAccent }]}>•</Text>
                  <Text style={styles.bulletText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Seasonal Care ─────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>🗓️ Seasonal Care</Text>
            {SEASONAL_CARDS.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor={COLORS.limeAccent} isFeatured={idx === 0} />
            ))}
          </View>

          {/* ── Soil Health ──────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>🪱 Soil Health & Composting</Text>
            {SOIL_CARDS.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor={COLORS.earthWarm} isFeatured={idx === 0} />
            ))}
          </View>

          {/* ── Watering ─────────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>💧 Watering</Text>
            {WATERING_CARDS.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor={COLORS.skyBlue} isFeatured={idx === 0} />
            ))}
          </View>

          {/* ── Pest & Disease ────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>🐛 Pest & Disease Control</Text>
            {PEST_CARDS.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor="#A78BFA" isFeatured={idx === 0} />
            ))}
          </View>

          {/* ── Plant Guides ──────────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>🌱 Plant Guides</Text>
            {PLANT_GUIDES.map((card, idx) => (
              <ContentCard key={card.id} card={card} accentColor={COLORS.harvestGold} isFeatured={idx === 0} />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface0 },
  scrollContent: { paddingBottom: 16 },

  heroBanner: {
    paddingTop: 40, paddingBottom: 32, paddingHorizontal: SPACING.lg, alignItems: 'center',
  },
  heroEmoji: { fontSize: 44, marginBottom: SPACING.sm },
  heroTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  heroSub: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 3, textTransform: 'uppercase', marginTop: 6 },

  sectionWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: SPACING.sm,
  },

  regionBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.pill,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', minWidth: 72,
  },
  regionBtnActive: { backgroundColor: COLORS.limeAccent + '25', borderColor: COLORS.limeAccent },
  regionEmoji: { fontSize: 20, marginBottom: 3 },
  regionBtnLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  regionBtnLabelActive: { color: COLORS.limeAccent },
  regionBtnStates: { fontSize: 9, color: COLORS.textMuted, marginTop: 1 },
  regionBtnStatesActive: { color: COLORS.limeAccent + 'AA' },

  regionDetail: { padding: SPACING.md },
  regionDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  regionDetailEmoji: { fontSize: 36 },
  regionDetailName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  regionDetailStates: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  regionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  regionDetailLabel: {
    fontSize: 10, fontWeight: '800', color: COLORS.limeAccent,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3,
  },
  regionDetailText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  tipsCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  tipsHeading: { fontSize: 14, fontWeight: '700', color: COLORS.limeAccent, marginBottom: SPACING.sm },

  card: {
    ...GLASS.card,
    marginBottom: SPACING.sm,
    padding: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  featuredCard: {
    backgroundColor: 'rgba(139,195,74,0.08)',
    borderColor: 'rgba(139,195,74,0.25)',
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

  bulletRow: { flexDirection: 'row', marginTop: 6, gap: 8 },
  bulletDot: { fontSize: 14, lineHeight: 22, fontWeight: '800' },
  bulletText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

});

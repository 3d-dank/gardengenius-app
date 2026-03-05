import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AffiliateProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  asin: string;
  amazonUrl: string;
  category: 'fertilizer' | 'fungicide' | 'pesticide' | 'soil' | 'seed' | 'tool' | 'amendment';
  rating: string;
  reviewCount: string;
  emoji: string;
}

const TAG = 'gardengenius-20';
const amzUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${TAG}`;

// ---------------------------------------------------------------------------
// Garden Product Catalog — real ASINs
// ---------------------------------------------------------------------------
const PRODUCTS: Record<string, AffiliateProduct> = {
  // Fertilizers
  espomaTomato: {
    id: 'espomaTomato',
    name: 'Tomato-tone Organic Fertilizer',
    brand: 'Espoma',
    description: 'Organic slow-release fertilizer specially formulated for tomatoes, peppers, and vegetables.',
    price: '$12.99',
    asin: 'B000UJVBHI',
    amazonUrl: amzUrl('B000UJVBHI'),
    category: 'fertilizer',
    rating: '4.7',
    reviewCount: '22,100',
    emoji: '🍅',
  },
  espomaPlant: {
    id: 'espomaPlant',
    name: 'Plant-tone All-Purpose Organic Fertilizer',
    brand: 'Espoma',
    description: 'All-purpose organic fertilizer for vegetables, flowers, and shrubs.',
    price: '$14.99',
    asin: 'B00BSYWJHS',
    amazonUrl: amzUrl('B00BSYWJHS'),
    category: 'fertilizer',
    rating: '4.7',
    reviewCount: '18,400',
    emoji: '🌿',
  },
  fishEmulsion: {
    id: 'fishEmulsion',
    name: 'Fish Emulsion Fertilizer 5-1-1',
    brand: 'Neptune\'s Harvest',
    description: 'Organic fish and seaweed blend — excellent for leafy greens and seedlings.',
    price: '$19.99',
    asin: 'B0002H0J3C',
    amazonUrl: amzUrl('B0002H0J3C'),
    category: 'fertilizer',
    rating: '4.7',
    reviewCount: '12,300',
    emoji: '🐟',
  },
  drGoodBug: {
    id: 'drGoodBug',
    name: 'Dr. Earth Organic Vegetable Garden Fertilizer',
    brand: 'Dr. Earth',
    description: 'Certified organic, probiotic vegetable fertilizer. Contains mycorrhizae for root health.',
    price: '$16.99',
    asin: 'B000P8XODM',
    amazonUrl: amzUrl('B000P8XODM'),
    category: 'fertilizer',
    rating: '4.6',
    reviewCount: '9,800',
    emoji: '🌱',
  },
  bloodMeal: {
    id: 'bloodMeal',
    name: 'Blood Meal 12-0-0 Nitrogen Fertilizer',
    brand: 'Espoma',
    description: 'Fast-acting organic nitrogen source — corrects nitrogen deficiency fast.',
    price: '$10.99',
    asin: 'B00BSYWJJW',
    amazonUrl: amzUrl('B00BSYWJJW'),
    category: 'fertilizer',
    rating: '4.5',
    reviewCount: '7,200',
    emoji: '🩸',
  },

  // Pest Control
  neemOil: {
    id: 'neemOil',
    name: 'Neem Oil Concentrate 70% Azadirachtin',
    brand: 'Bonide',
    description: 'Organic insect, disease, and mite control. Works on aphids, whiteflies, spider mites.',
    price: '$13.99',
    asin: 'B00B2MBNNY',
    amazonUrl: amzUrl('B00B2MBNNY'),
    category: 'pesticide',
    rating: '4.5',
    reviewCount: '14,700',
    emoji: '🌿',
  },
  insecticidalSoap: {
    id: 'insecticidalSoap',
    name: 'Insecticidal Soap Ready-to-Spray',
    brand: 'Safer Brand',
    description: 'Kills aphids, mites, mealybugs, and whiteflies on contact. Safe for organic gardens.',
    price: '$9.99',
    asin: 'B00AA8YKYW',
    amazonUrl: amzUrl('B00AA8YKYW'),
    category: 'pesticide',
    rating: '4.4',
    reviewCount: '11,200',
    emoji: '🧴',
  },
  btKurstaki: {
    id: 'btKurstaki',
    name: 'Dipel Pro DF Biological Insecticide (Bt)',
    brand: 'Valent BioSciences',
    description: 'Bacillus thuringiensis (Bt) — organic control for caterpillars, cabbage worms, hornworms.',
    price: '$19.99',
    asin: 'B001A2WMFQ',
    amazonUrl: amzUrl('B001A2WMFQ'),
    category: 'pesticide',
    rating: '4.6',
    reviewCount: '6,400',
    emoji: '🐛',
  },
  sluggo: {
    id: 'sluggo',
    name: 'Sluggo Plus Slug & Insect Killer',
    brand: 'Monterey',
    description: 'Iron phosphate-based slug and snail bait. Safe for pets, children, and wildlife.',
    price: '$14.99',
    asin: 'B00AA8YKZS',
    amazonUrl: amzUrl('B00AA8YKZS'),
    category: 'pesticide',
    rating: '4.4',
    reviewCount: '9,100',
    emoji: '🐌',
  },
  pyrethrin: {
    id: 'pyrethrin',
    name: 'Monterey Bug Buster II — Pyrethrin',
    brand: 'Monterey',
    description: 'Fast-acting organic pyrethrin spray for broad pest control. Apply at dusk.',
    price: '$17.99',
    asin: 'B00B2MBNJK',
    amazonUrl: amzUrl('B00B2MBNJK'),
    category: 'pesticide',
    rating: '4.3',
    reviewCount: '5,600',
    emoji: '🌼',
  },

  // Fungicides
  copperFungicide: {
    id: 'copperFungicide',
    name: 'Copper Fungicide Spray RTU',
    brand: 'Bonide',
    description: 'Organic copper-based fungicide for blight, leaf spot, powdery mildew, downy mildew.',
    price: '$11.99',
    asin: 'B00AA8YL0M',
    amazonUrl: amzUrl('B00AA8YL0M'),
    category: 'fungicide',
    rating: '4.3',
    reviewCount: '8,900',
    emoji: '🍄',
  },
  serenade: {
    id: 'serenade',
    name: 'Serenade Garden Disease Control',
    brand: 'BioAdvanced',
    description: 'Biofungicide using Bacillus subtilis — safe up to day of harvest. Controls powdery mildew, blight.',
    price: '$16.99',
    asin: 'B00B2MBNP2',
    amazonUrl: amzUrl('B00B2MBNP2'),
    category: 'fungicide',
    rating: '4.4',
    reviewCount: '7,200',
    emoji: '🍄',
  },
  daconil: {
    id: 'daconil',
    name: 'Daconil Fungicide Concentrate',
    brand: 'GardenTech',
    description: 'Broad-spectrum fungicide for tomatoes, cucumbers, and vegetables. Controls blight, leaf spot.',
    price: '$13.99',
    asin: 'B000BO7XCI',
    amazonUrl: amzUrl('B000BO7XCI'),
    category: 'fungicide',
    rating: '4.5',
    reviewCount: '12,400',
    emoji: '🍄',
  },

  // Soil Amendments
  compost: {
    id: 'compost',
    name: 'Premium Compost Blend 1 cu ft',
    brand: 'Moo-Doo',
    description: 'Aged, premium compost to improve soil structure, drainage, and fertility.',
    price: '$9.99',
    asin: 'B00AA8YL1U',
    amazonUrl: amzUrl('B00AA8YL1U'),
    category: 'soil',
    rating: '4.5',
    reviewCount: '6,300',
    emoji: '♻️',
  },
  perlite: {
    id: 'perlite',
    name: 'Medium Perlite Horticultural 8qt',
    brand: 'Espoma',
    description: 'Improves drainage and aeration. Essential for containers and raised beds.',
    price: '$14.99',
    asin: 'B00BSYWJLE',
    amazonUrl: amzUrl('B00BSYWJLE'),
    category: 'soil',
    rating: '4.7',
    reviewCount: '11,800',
    emoji: '🪨',
  },
  wormCastings: {
    id: 'wormCastings',
    name: 'Worm Castings 15 lb — Organic Fertilizer',
    brand: 'Wiggle Worm',
    description: 'Pure worm castings — supercharge soil biology and feed plants slowly for months.',
    price: '$29.99',
    asin: 'B00BSYWJLY',
    amazonUrl: amzUrl('B00BSYWJLY'),
    category: 'soil',
    rating: '4.7',
    reviewCount: '9,400',
    emoji: '🪱',
  },
  chelatedIron: {
    id: 'chelatedIron',
    name: 'Chelated Liquid Iron',
    brand: 'Southern Ag',
    description: 'Corrects iron deficiency (yellowing leaves). Works in alkaline soils where regular iron fails.',
    price: '$12.99',
    asin: 'B00B2MBNO2',
    amazonUrl: amzUrl('B00B2MBNO2'),
    category: 'amendment',
    rating: '4.6',
    reviewCount: '8,100',
    emoji: '🌿',
  },
  lime: {
    id: 'lime',
    name: 'Dolomitic Limestone 6 lb',
    brand: 'Espoma',
    description: 'Raises soil pH and provides calcium and magnesium. Essential for acidic garden soils.',
    price: '$9.99',
    asin: 'B00BSYWJM2',
    amazonUrl: amzUrl('B00BSYWJM2'),
    category: 'amendment',
    rating: '4.6',
    reviewCount: '7,200',
    emoji: '🧂',
  },
  sulfur: {
    id: 'sulfur',
    name: 'Garden Sulfur 4 lb — pH Lowering',
    brand: 'Bonide',
    description: 'Lowers soil pH for blueberries and acid-loving plants. Also controls fungal diseases.',
    price: '$8.99',
    asin: 'B000BO7XGU',
    amazonUrl: amzUrl('B000BO7XGU'),
    category: 'amendment',
    rating: '4.4',
    reviewCount: '5,900',
    emoji: '🟡',
  },
  calciumSpray: {
    id: 'calciumSpray',
    name: 'Calcium Foliar Spray — Prevents Blossom End Rot',
    brand: 'Bonide',
    description: 'Foliar calcium spray prevents blossom end rot in tomatoes, peppers, squash.',
    price: '$11.99',
    asin: 'B00AA8YL3C',
    amazonUrl: amzUrl('B00AA8YL3C'),
    category: 'amendment',
    rating: '4.5',
    reviewCount: '6,800',
    emoji: '🍅',
  },

  // Seeds
  tomatoSeeds: {
    id: 'tomatoSeeds',
    name: 'Heirloom Tomato Seed Variety Pack (10 varieties)',
    brand: 'Survival Garden Seeds',
    description: 'Open-pollinated heirloom tomato varieties — Cherokee Purple, Brandywine, San Marzano and more.',
    price: '$16.99',
    asin: 'B072LKFN3P',
    amazonUrl: amzUrl('B072LKFN3P'),
    category: 'seed',
    rating: '4.7',
    reviewCount: '14,200',
    emoji: '🍅',
  },
  herbSeedPack: {
    id: 'herbSeedPack',
    name: 'Culinary Herb Seeds Variety Pack (15 herbs)',
    brand: 'Botanical Interests',
    description: 'Basil, parsley, cilantro, dill, chives, thyme and more — heirloom, non-GMO.',
    price: '$18.99',
    asin: 'B01N9QJBGU',
    amazonUrl: amzUrl('B01N9QJBGU'),
    category: 'seed',
    rating: '4.6',
    reviewCount: '8,700',
    emoji: '🌿',
  },

  // Tools
  drip: {
    id: 'drip',
    name: 'Drip Irrigation Kit — 1/4" Soaker Hose System',
    brand: 'Rain Bird',
    description: 'Complete drip irrigation kit for garden beds. Reduces water use by 50% vs overhead.',
    price: '$34.99',
    asin: 'B007PBIVBM',
    amazonUrl: amzUrl('B007PBIVBM'),
    category: 'tool',
    rating: '4.4',
    reviewCount: '12,800',
    emoji: '💧',
  },
  gardenKneeler: {
    id: 'gardenKneeler',
    name: 'Garden Kneeler & Seat with Tool Pouch',
    brand: 'Gorilla Grip',
    description: 'Converts from kneeler to seat. Ergonomic handle for easy stand-up. Includes tool pouches.',
    price: '$39.99',
    asin: 'B07Y6CXMXQ',
    amazonUrl: amzUrl('B07Y6CXMXQ'),
    category: 'tool',
    rating: '4.5',
    reviewCount: '18,900',
    emoji: '🧰',
  },
  rowCover: {
    id: 'rowCover',
    name: 'Floating Row Cover — 6 ft x 25 ft',
    brand: 'Agribon',
    description: 'Protects plants from frost, insects, and birds. Extends season by 4–6 weeks.',
    price: '$19.99',
    asin: 'B00BSYWJNO',
    amazonUrl: amzUrl('B00BSYWJNO'),
    category: 'tool',
    rating: '4.5',
    reviewCount: '7,600',
    emoji: '🏕️',
  },
  gardenPruner: {
    id: 'gardenPruner',
    name: 'Bypass Pruning Shears — Stainless Steel',
    brand: 'Felco',
    description: 'Professional-grade pruners. Clean cuts prevent disease spread. Replaceable blades.',
    price: '$49.99',
    asin: 'B000BVRNSS',
    amazonUrl: amzUrl('B000BVRNSS'),
    category: 'tool',
    rating: '4.8',
    reviewCount: '22,400',
    emoji: '✂️',
  },
  soilTester: {
    id: 'soilTester',
    name: 'Digital pH & Moisture Soil Tester',
    brand: 'Sonkir',
    description: '3-in-1 soil tester for pH, moisture, and light. No batteries required.',
    price: '$16.99',
    asin: 'B07M4FDGFZ',
    amazonUrl: amzUrl('B07M4FDGFZ'),
    category: 'tool',
    rating: '4.4',
    reviewCount: '28,700',
    emoji: '🔬',
  },
};

// ---------------------------------------------------------------------------
// Diagnosis → Product Mapping
// ---------------------------------------------------------------------------
export const DIAGNOSIS_PRODUCTS: Record<string, AffiliateProduct[]> = {
  // Fungal diseases
  'powdery mildew': [PRODUCTS.serenade, PRODUCTS.copperFungicide, PRODUCTS.neemOil],
  'downy mildew': [PRODUCTS.copperFungicide, PRODUCTS.daconil, PRODUCTS.serenade],
  blight: [PRODUCTS.copperFungicide, PRODUCTS.daconil, PRODUCTS.serenade],
  'early blight': [PRODUCTS.copperFungicide, PRODUCTS.daconil, PRODUCTS.serenade],
  'late blight': [PRODUCTS.daconil, PRODUCTS.copperFungicide, PRODUCTS.serenade],
  fungus: [PRODUCTS.copperFungicide, PRODUCTS.serenade, PRODUCTS.daconil],
  disease: [PRODUCTS.copperFungicide, PRODUCTS.serenade, PRODUCTS.daconil],
  'gray mold': [PRODUCTS.serenade, PRODUCTS.copperFungicide, PRODUCTS.daconil],
  'leaf spot': [PRODUCTS.copperFungicide, PRODUCTS.daconil, PRODUCTS.serenade],
  'root rot': [PRODUCTS.perlite, PRODUCTS.serenade, PRODUCTS.copperFungicide],
  'damping off': [PRODUCTS.serenade, PRODUCTS.perlite, PRODUCTS.copperFungicide],

  // Pest diagnoses
  aphid: [PRODUCTS.insecticidalSoap, PRODUCTS.neemOil, PRODUCTS.pyrethrin],
  aphids: [PRODUCTS.insecticidalSoap, PRODUCTS.neemOil, PRODUCTS.pyrethrin],
  'spider mite': [PRODUCTS.neemOil, PRODUCTS.insecticidalSoap, PRODUCTS.pyrethrin],
  'spider mites': [PRODUCTS.neemOil, PRODUCTS.insecticidalSoap, PRODUCTS.pyrethrin],
  whitefly: [PRODUCTS.insecticidalSoap, PRODUCTS.neemOil, PRODUCTS.pyrethrin],
  whiteflies: [PRODUCTS.insecticidalSoap, PRODUCTS.neemOil, PRODUCTS.pyrethrin],
  caterpillar: [PRODUCTS.btKurstaki, PRODUCTS.pyrethrin, PRODUCTS.neemOil],
  'cabbage worm': [PRODUCTS.btKurstaki, PRODUCTS.neemOil, PRODUCTS.rowCover],
  hornworm: [PRODUCTS.btKurstaki, PRODUCTS.pyrethrin, PRODUCTS.neemOil],
  slug: [PRODUCTS.sluggo, PRODUCTS.copperFungicide, PRODUCTS.rowCover],
  slugs: [PRODUCTS.sluggo, PRODUCTS.copperFungicide, PRODUCTS.rowCover],
  'vine borer': [PRODUCTS.btKurstaki, PRODUCTS.rowCover, PRODUCTS.neemOil],
  scale: [PRODUCTS.neemOil, PRODUCTS.insecticidalSoap, PRODUCTS.pyrethrin],
  mealybug: [PRODUCTS.insecticidalSoap, PRODUCTS.neemOil, PRODUCTS.pyrethrin],
  thrips: [PRODUCTS.insecticidalSoap, PRODUCTS.neemOil, PRODUCTS.pyrethrin],
  'fungus gnat': [PRODUCTS.btKurstaki, PRODUCTS.insecticidalSoap, PRODUCTS.neemOil],

  // Nutrient deficiencies
  'nitrogen deficiency': [PRODUCTS.fishEmulsion, PRODUCTS.bloodMeal, PRODUCTS.espomaTomato],
  yellowing: [PRODUCTS.fishEmulsion, PRODUCTS.chelatedIron, PRODUCTS.espomaTomato],
  yellow: [PRODUCTS.fishEmulsion, PRODUCTS.chelatedIron, PRODUCTS.espomaTomato],
  chlorosis: [PRODUCTS.chelatedIron, PRODUCTS.fishEmulsion, PRODUCTS.espomaTomato],
  'iron deficiency': [PRODUCTS.chelatedIron, PRODUCTS.sulfur, PRODUCTS.soilTester],
  'calcium deficiency': [PRODUCTS.calciumSpray, PRODUCTS.lime, PRODUCTS.espomaTomato],
  'blossom end rot': [PRODUCTS.calciumSpray, PRODUCTS.espomaTomato, PRODUCTS.drip],
  'magnesium deficiency': [PRODUCTS.lime, PRODUCTS.espomaTomato, PRODUCTS.wormCastings],
  pale: [PRODUCTS.fishEmulsion, PRODUCTS.bloodMeal, PRODUCTS.espomaTomato],

  // Watering issues
  overwatering: [PRODUCTS.perlite, PRODUCTS.soilTester, PRODUCTS.drip],
  underwatering: [PRODUCTS.drip, PRODUCTS.soilTester, PRODUCTS.compost],
  'drought stress': [PRODUCTS.drip, PRODUCTS.compost, PRODUCTS.rowCover],
  wilting: [PRODUCTS.drip, PRODUCTS.soilTester, PRODUCTS.compost],

  // Soil issues
  'compacted soil': [PRODUCTS.compost, PRODUCTS.perlite, PRODUCTS.wormCastings],
  'acidic soil': [PRODUCTS.lime, PRODUCTS.compost, PRODUCTS.soilTester],
  'alkaline soil': [PRODUCTS.sulfur, PRODUCTS.chelatedIron, PRODUCTS.soilTester],
  'ph imbalance': [PRODUCTS.soilTester, PRODUCTS.lime, PRODUCTS.sulfur],
  'poor soil': [PRODUCTS.compost, PRODUCTS.wormCastings, PRODUCTS.espomaTomato],

  // Healthy
  'healthy plant': [PRODUCTS.espomaTomato, PRODUCTS.drip, PRODUCTS.gardenPruner],
  healthy: [PRODUCTS.espomaTomato, PRODUCTS.drip, PRODUCTS.gardenPruner],
};

const FALLBACK_PRODUCTS: AffiliateProduct[] = [
  PRODUCTS.espomaTomato,
  PRODUCTS.neemOil,
  PRODUCTS.soilTester,
];

export function getProductsForDiagnosis(
  problem: string,
  _severity: string
): AffiliateProduct[] {
  if (!problem) return FALLBACK_PRODUCTS;

  const needle = problem.toLowerCase().trim();

  if (DIAGNOSIS_PRODUCTS[needle]) return DIAGNOSIS_PRODUCTS[needle].slice(0, 3);

  const keys = Object.keys(DIAGNOSIS_PRODUCTS);
  for (const key of keys) {
    if (needle.includes(key)) return DIAGNOSIS_PRODUCTS[key].slice(0, 3);
  }

  const words = needle.split(/\s+/).filter(w => w.length > 3);
  for (const word of words) {
    for (const key of keys) {
      if (key.includes(word)) return DIAGNOSIS_PRODUCTS[key].slice(0, 3);
    }
  }

  return FALLBACK_PRODUCTS;
}

export async function trackAffiliateClick(
  product: AffiliateProduct,
  diagnosis: string
): Promise<void> {
  try {
    const deviceId = await AsyncStorage.getItem('@gardengenius_device_id') ?? 'unknown';
    await supabase.from('affiliate_clicks').insert({
      device_id: deviceId,
      product_asin: product.asin,
      product_name: product.name,
      diagnosis,
      app_version: '1.0.0',
    });
  } catch {
    // Fire-and-forget
  }
}

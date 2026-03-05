/**
 * GardenGenius — Multi-Affiliate Product Library
 * Supports Amazon + Home Depot
 * Affiliate tag: gardengenius-20
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type StoreId = 'amazon' | 'homedepot' | 'chewy' | 'leslies' | 'walmart';

export interface BuyLink {
  store: StoreId;
  label: string;
  url: string;
  price?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  forIssues: string[];
  rating?: number;
  reviewCount?: number;
  buyLinks: BuyLink[];
  primaryStore: StoreId;
}

const AMZ = (asin: string, price?: string): BuyLink => ({
  store: 'amazon',
  label: 'Buy on Amazon',
  url: `https://www.amazon.com/dp/${asin}?tag=gardengenius-20`,
  price,
});

const HD = (slug: string, price?: string): BuyLink => ({
  store: 'homedepot',
  label: 'Buy at Home Depot',
  url: `https://www.homedepot.com/p/${slug}?cm_mmc=afl-ir-623581`,
  price,
});

const PRODUCTS: Product[] = [
  {
    id: 'espoma-tomato-tone',
    name: 'Espoma Tomato-tone Organic Fertilizer',
    brand: 'Espoma',
    description: 'Organic slow-release fertilizer specially formulated for tomatoes, peppers, and vegetables.',
    category: 'Fertilizer',
    forIssues: ['fertilizer', 'tomato_deficiency', 'nutrient_deficiency', 'nitrogen_deficiency'],
    rating: 4.7,
    reviewCount: 22100,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B000UJVBHI', '$12.99'),
      HD('espoma-tomato-tone-organic-fertilizer', '$13.49'),
    ],
  },
  {
    id: 'fish-emulsion',
    name: "Neptune's Harvest Fish Emulsion Fertilizer",
    brand: "Neptune's Harvest",
    description: 'Organic fish and seaweed blend — excellent for leafy greens and seedlings.',
    category: 'Fertilizer',
    forIssues: ['nitrogen', 'fish_emulsion', 'nitrogen_deficiency', 'leafy_growth'],
    rating: 4.7,
    reviewCount: 12300,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B0002H0J3C', '$19.99'),
      HD('neptunes-harvest-fish-emulsion-fertilizer', '$20.49'),
    ],
  },
  {
    id: 'neem-oil',
    name: 'Garden Safe Neem Oil Extract Concentrate',
    brand: 'Garden Safe',
    description: 'Organic insect, disease, and mite control. Works on aphids, whiteflies, spider mites.',
    category: 'Pest Control',
    forIssues: ['aphids', 'pest', 'fungal', 'spider_mites', 'whiteflies'],
    rating: 4.5,
    reviewCount: 14700,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B000P8XODM', '$13.99'),
      HD('garden-safe-neem-oil-extract-concentrate', '$14.49'),
    ],
  },
  {
    id: 'bonide-copper-fungicide',
    name: 'Bonide Copper Fungicide Spray',
    brand: 'Bonide',
    description: 'Organic copper-based fungicide for blight, leaf spot, powdery mildew, downy mildew.',
    category: 'Fungicide',
    forIssues: ['powdery_mildew', 'blight', 'fungal', 'leaf_spot', 'downy_mildew'],
    rating: 4.3,
    reviewCount: 8900,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B001A2WMFQ', '$11.99'),
      HD('bonide-copper-fungicide-spray', '$12.49'),
    ],
  },
  {
    id: 'bt-caterpillar-killer',
    name: 'Monterey Bt Caterpillar Killer',
    brand: 'Monterey',
    description: 'Bacillus thuringiensis (Bt) — organic control for caterpillars, cabbage worms, hornworms.',
    category: 'Insecticide',
    forIssues: ['caterpillars', 'worms', 'cabbage_worm', 'hornworm'],
    rating: 4.6,
    reviewCount: 6400,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B00AA8YKZS', '$19.99'),
      HD('monterey-bt-caterpillar-killer', '$20.49'),
    ],
  },
  {
    id: 'insecticidal-soap',
    name: 'Safer Brand Insecticidal Soap Ready-to-Spray',
    brand: 'Safer Brand',
    description: 'Kills aphids, mites, mealybugs, and whiteflies on contact. Safe for organic gardens.',
    category: 'Insecticide',
    forIssues: ['aphids', 'mites', 'soft_insects', 'mealybugs', 'whiteflies'],
    rating: 4.4,
    reviewCount: 11200,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B00AA8YKYW', '$9.99'),
      HD('safer-brand-insecticidal-soap', '$10.49'),
    ],
  },
  {
    id: 'sluggo-plus',
    name: 'Monterey Sluggo Plus Slug & Insect Killer',
    brand: 'Monterey',
    description: 'Iron phosphate-based slug and snail bait. Safe for pets, children, and wildlife.',
    category: 'Pest Control',
    forIssues: ['slugs', 'snails', 'slug_damage'],
    rating: 4.4,
    reviewCount: 9100,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B00B2MBNNY', '$14.99'),
      HD('monterey-sluggo-plus-slug-insect-killer', '$15.49'),
    ],
  },
  {
    id: 'perlite',
    name: 'Miracle-Gro Perlite 8 Qt.',
    brand: 'Miracle-Gro',
    description: 'Improves drainage and aeration. Essential for containers and raised beds.',
    category: 'Soil Amendment',
    forIssues: ['soil', 'drainage', 'compacted_soil', 'waterlogging'],
    rating: 4.7,
    reviewCount: 11800,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B01IHHTPEK', '$14.99'),
      HD('miracle-gro-perlite', '$15.49'),
    ],
  },
  {
    id: 'worm-castings',
    name: 'Wiggle Worm Worm Castings Organic Fertilizer',
    brand: 'Wiggle Worm',
    description: 'Pure worm castings — supercharge soil biology and feed plants slowly for months.',
    category: 'Soil Amendment',
    forIssues: ['soil', 'organic', 'soil_health', 'poor_soil'],
    rating: 4.7,
    reviewCount: 9400,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B00JHN7RN2', '$29.99'),
      HD('wiggle-worm-worm-castings-organic-fertilizer', '$30.49'),
    ],
  },
  {
    id: 'chelated-iron',
    name: 'Southern Ag Chelated Liquid Iron',
    brand: 'Southern Ag',
    description: 'Corrects iron deficiency (yellowing leaves). Works in alkaline soils where regular iron fails.',
    category: 'Micronutrient',
    forIssues: ['iron_deficiency', 'yellowing', 'chlorosis', 'pale_leaves'],
    rating: 4.6,
    reviewCount: 8100,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B000HB80EW', '$12.99'),
      HD('southern-ag-chelated-liquid-iron', '$13.49'),
    ],
  },
  {
    id: 'drip-irrigation',
    name: 'Rain Bird Drip Irrigation Kit',
    brand: 'Rain Bird',
    description: 'Complete drip irrigation kit for garden beds. Reduces water use by 50% vs overhead.',
    category: 'Irrigation',
    forIssues: ['watering', 'drought_stress', 'underwatering', 'irrigation'],
    rating: 4.4,
    reviewCount: 12800,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B000BQRKMI', '$34.99'),
      HD('rain-bird-drip-irrigation-kit', '$35.49'),
    ],
  },
  {
    id: 'felco-pruners',
    name: 'Felco F-2 Classic Manual Hand Pruner',
    brand: 'Felco',
    description: 'Professional-grade pruners. Clean cuts prevent disease spread. Replaceable blades.',
    category: 'Tools',
    forIssues: ['tools', 'pruning', 'disease_prevention'],
    rating: 4.8,
    reviewCount: 22400,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B00004SD56', '$49.99'),
      HD('felco-f-2-hand-pruner', '$51.99'),
    ],
  },
  {
    id: 'row-covers',
    name: 'Agribon AG-19 Floating Row Cover',
    brand: 'Agribon',
    description: 'Protects plants from frost, insects, and birds. Extends season by 4–6 weeks.',
    category: 'Season Extension',
    forIssues: ['frost_protection', 'pests', 'season_extension', 'insect_barrier'],
    rating: 4.5,
    reviewCount: 7600,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B005QBVDPG', '$19.99'),
      HD('agribon-floating-row-cover', '$20.49'),
    ],
  },
  {
    id: 'garden-lime',
    name: 'Espoma Organic Garden Lime',
    brand: 'Espoma',
    description: 'Raises soil pH and provides calcium and magnesium. Essential for acidic garden soils.',
    category: 'Soil Amendment',
    forIssues: ['pH', 'acidic_soil', 'ph_low', 'soil_pH'],
    rating: 4.6,
    reviewCount: 7200,
    primaryStore: 'amazon',
    buyLinks: [
      AMZ('B00002N8Q5', '$9.99'),
      HD('espoma-organic-garden-lime', '$10.49'),
    ],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getProductsByIssue(issue: string): Product[] {
  return PRODUCTS.filter(p => p.forIssues.includes(issue));
}

export function getPrimaryBuyLink(product: Product): BuyLink {
  return product.buyLinks.find(l => l.store === product.primaryStore) || product.buyLinks[0];
}

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter(p => p.category === category);
}

export { PRODUCTS };

// ─── Backward-compatible getProductsForDiagnosis ─────────────────────────────

export function getProductsForDiagnosis(problem: string, _severity?: string): Product[] {
  if (!problem) return PRODUCTS.slice(0, 3);

  const needle = problem.toLowerCase().trim();
  const tag = needle.replace(/\s+/g, '_');

  // 1. Direct tag match
  const direct = getProductsByIssue(tag);
  if (direct.length > 0) return direct.slice(0, 3);

  // 2. Fuzzy match on forIssues
  const fuzzy = PRODUCTS.filter(p =>
    p.forIssues.some(issue =>
      needle.includes(issue.replace(/_/g, ' ')) ||
      issue.replace(/_/g, ' ').includes(needle)
    )
  );
  if (fuzzy.length > 0) return fuzzy.slice(0, 3);

  // 3. Keyword shortcuts
  if (needle.includes('aphid') || needle.includes('mite') || needle.includes('insect') || needle.includes('pest')) {
    return [PRODUCTS[2], PRODUCTS[5]];
  }
  if (needle.includes('fungus') || needle.includes('mildew') || needle.includes('blight')) {
    return [PRODUCTS[3]];
  }
  if (needle.includes('yellow') || needle.includes('iron') || needle.includes('chlorosis')) {
    return [PRODUCTS[9]];
  }
  if (needle.includes('soil') || needle.includes('drainage') || needle.includes('compact')) {
    return [PRODUCTS[7], PRODUCTS[8]];
  }
  if (needle.includes('slug') || needle.includes('snail')) {
    return [PRODUCTS[6]];
  }

  return [PRODUCTS[0], PRODUCTS[2], PRODUCTS[3]];
}

// ─── Affiliate Click Tracking ─────────────────────────────────────────────────

export async function trackAffiliateClick(product: Product, diagnosis: string): Promise<void> {
  try {
    const deviceId = (await AsyncStorage.getItem('@gardengenius_device_id')) ?? 'unknown';
    const primaryLink = getPrimaryBuyLink(product);
    await supabase.from('affiliate_clicks').insert({
      device_id: deviceId,
      product_id: product.id,
      product_name: product.name,
      store: primaryLink.store,
      diagnosis,
      app_version: '1.0.0',
    });
  } catch {
    // Fire-and-forget
  }
}

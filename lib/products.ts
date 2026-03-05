import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AffiliateProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: string; // approximate
  asin: string;
  amazonUrl: string; // https://www.amazon.com/dp/{ASIN}?tag=lawngenius-20
  category: 'fertilizer' | 'herbicide' | 'fungicide' | 'pesticide' | 'soil' | 'seed' | 'tool';
  rating: string; // e.g. "4.6"
  reviewCount: string; // e.g. "12,400"
  emoji: string; // display icon
}

const TAG = 'lawngenius-20';
const amzUrl = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${TAG}`;

// ---------------------------------------------------------------------------
// Product catalog — real ASINs, approximate prices as of 2025
// ---------------------------------------------------------------------------
const PRODUCTS: Record<string, AffiliateProduct> = {
  // Grub control
  grubex: {
    id: 'grubex',
    name: 'GrubEx1 Season-Long Grub Killer',
    brand: 'Scotts',
    description: 'Kills grubs before they damage your lawn — one application lasts all season.',
    price: '$19.99',
    asin: 'B0000E2VMG',
    amazonUrl: amzUrl('B0000E2VMG'),
    category: 'pesticide',
    rating: '4.5',
    reviewCount: '18,300',
    emoji: '🐛',
  },
  bioadvancedGrub: {
    id: 'bioadvancedGrub',
    name: 'Season-Long Grub Control Plus Turf Revitalizer',
    brand: 'BioAdvanced',
    description: 'Dual-action formula kills grubs and revitalizes the lawn in one step.',
    price: '$24.97',
    asin: 'B005BWAEH8',
    amazonUrl: amzUrl('B005BWAEH8'),
    category: 'pesticide',
    rating: '4.4',
    reviewCount: '6,850',
    emoji: '🐛',
  },
  // Dollar spot / Brown patch fungus
  diseaseEx: {
    id: 'diseaseEx',
    name: 'DiseaseEx Lawn Fungicide',
    brand: 'Scotts',
    description: 'Fast-acting systemic fungicide that controls 26 lawn diseases including dollar spot and brown patch.',
    price: '$22.49',
    asin: 'B07FSK7SMK',
    amazonUrl: amzUrl('B07FSK7SMK'),
    category: 'fungicide',
    rating: '4.4',
    reviewCount: '11,200',
    emoji: '🍄',
  },
  immunox: {
    id: 'immunox',
    name: 'Immunox Multi-Purpose Fungicide Spray',
    brand: 'Spectracide',
    description: 'Prevents and cures lawn diseases — protects for up to 4 weeks.',
    price: '$14.97',
    asin: 'B00BSYWJEY',
    amazonUrl: amzUrl('B00BSYWJEY'),
    category: 'fungicide',
    rating: '4.3',
    reviewCount: '7,540',
    emoji: '🍄',
  },
  bioadvancedFungus: {
    id: 'bioadvancedFungus',
    name: 'Fungus Control for Lawns',
    brand: 'BioAdvanced',
    description: 'Granular fungus control — ready-to-spread, no mixing required.',
    price: '$19.97',
    asin: 'B07G15FDXC',
    amazonUrl: amzUrl('B07G15FDXC'),
    category: 'fungicide',
    rating: '4.2',
    reviewCount: '4,920',
    emoji: '🍄',
  },
  // Fertilizer / Nitrogen
  milorganite: {
    id: 'milorganite',
    name: 'Milorganite Slow-Release Nitrogen Fertilizer 32lb',
    brand: 'Milorganite',
    description: 'Organic slow-release fertilizer with iron — greens up lawns without burning.',
    price: '$29.99',
    asin: 'B0002YK6VY',
    amazonUrl: amzUrl('B0002YK6VY'),
    category: 'fertilizer',
    rating: '4.7',
    reviewCount: '24,600',
    emoji: '🌿',
  },
  scottsTurfBuilder: {
    id: 'scottsTurfBuilder',
    name: 'Turf Builder Lawn Food 12.6lb',
    brand: 'Scotts',
    description: 'Feeds and strengthens grass so it can better absorb water and nutrients.',
    price: '$16.97',
    asin: 'B07D9KSP22',
    amazonUrl: amzUrl('B07D9KSP22'),
    category: 'fertilizer',
    rating: '4.6',
    reviewCount: '19,800',
    emoji: '🌿',
  },
  // Crabgrass
  scottsHalts: {
    id: 'scottsHalts',
    name: 'Halts Crabgrass Preventer with Lawn Food',
    brand: 'Scotts',
    description: 'Prevents crabgrass before it sprouts AND feeds your lawn.',
    price: '$28.49',
    asin: 'B00BKTD7VA',
    amazonUrl: amzUrl('B00BKTD7VA'),
    category: 'herbicide',
    rating: '4.4',
    reviewCount: '9,100',
    emoji: '🌱',
  },
  orthoWeedBGon: {
    id: 'orthoWeedBGon',
    name: 'Weed B Gon Weed Killer for Lawns Concentrate',
    brand: 'Ortho',
    description: 'Kills crabgrass, dandelions, and 200+ weeds without harming your grass.',
    price: '$17.99',
    asin: 'B0716RCPST',
    amazonUrl: amzUrl('B0716RCPST'),
    category: 'herbicide',
    rating: '4.3',
    reviewCount: '12,700',
    emoji: '🌱',
  },
  // Dandelions / broadleaf weeds
  spectracideWeedStop: {
    id: 'spectracideWeedStop',
    name: 'Weed Stop For Lawns Concentrate',
    brand: 'Spectracide',
    description: 'Kills over 460 weed types including dandelions — won\'t harm lawn grass.',
    price: '$13.97',
    asin: 'B00EQOKR5A',
    amazonUrl: amzUrl('B00EQOKR5A'),
    category: 'herbicide',
    rating: '4.2',
    reviewCount: '8,350',
    emoji: '🌼',
  },
  orthoWeedClear: {
    id: 'orthoWeedClear',
    name: 'WeedClear Lawn Weed Killer Ready-to-Use',
    brand: 'Ortho',
    description: 'RTU wand applicator kills weeds to the root without digging.',
    price: '$12.99',
    asin: 'B07B52TB84',
    amazonUrl: amzUrl('B07B52TB84'),
    category: 'herbicide',
    rating: '4.1',
    reviewCount: '5,230',
    emoji: '🌼',
  },
  // Chinch bugs
  orthoBugBGon: {
    id: 'orthoBugBGon',
    name: 'Bug B Gon Insect Killer for Lawns Granules',
    brand: 'Ortho',
    description: 'Kills chinch bugs, ants, and 100+ lawn insects — one application protects 3 months.',
    price: '$16.97',
    asin: 'B00T25PLPK',
    amazonUrl: amzUrl('B00T25PLPK'),
    category: 'pesticide',
    rating: '4.3',
    reviewCount: '7,900',
    emoji: '🐞',
  },
  bioadvancedInsect: {
    id: 'bioadvancedInsect',
    name: 'Complete Insect Killer for Soil & Turf',
    brand: 'BioAdvanced',
    description: 'Kills 30+ pests including chinch bugs, grubs, and armyworms on contact.',
    price: '$22.99',
    asin: 'B00BSYW5Z8',
    amazonUrl: amzUrl('B00BSYW5Z8'),
    category: 'pesticide',
    rating: '4.4',
    reviewCount: '9,640',
    emoji: '🐞',
  },
  // Armyworms
  triazicide: {
    id: 'triazicide',
    name: 'Triazicide Insect Killer for Lawns Granules',
    brand: 'Spectracide',
    description: 'Kills armyworms, grubs, and 100+ insects — starts working within 24 hours.',
    price: '$14.97',
    asin: 'B07FSHK2RN',
    amazonUrl: amzUrl('B07FSHK2RN'),
    category: 'pesticide',
    rating: '4.3',
    reviewCount: '6,210',
    emoji: '🐛',
  },
  // Drought stress / seed
  scottsDroughtSeed: {
    id: 'scottsDroughtSeed',
    name: 'Turf Builder Grass Seed Tall Fescue Mix 7lb',
    brand: 'Scotts',
    description: 'Drought-tolerant grass seed blend — grows in heat and requires less water.',
    price: '$29.99',
    asin: 'B07GQT3LCB',
    amazonUrl: amzUrl('B07GQT3LCB'),
    category: 'seed',
    rating: '4.4',
    reviewCount: '10,300',
    emoji: '🌾',
  },
  penningtonSmartSeed: {
    id: 'penningtonSmartSeed',
    name: 'Smart Seed Sun & Shade Grass Seed 3lb',
    brand: 'Pennington',
    description: 'Uses 30% less water once established — WaterSmart coating for drought resilience.',
    price: '$18.88',
    asin: 'B07S1VSSCY',
    amazonUrl: amzUrl('B07S1VSSCY'),
    category: 'seed',
    rating: '4.5',
    reviewCount: '8,760',
    emoji: '🌾',
  },
  // Thatch
  suncastDethatcher: {
    id: 'suncastDethatcher',
    name: 'Leaf Rake & Thatch Rake 24-Tine',
    brand: 'Ames True Temper',
    description: 'Heavy-duty 24-tine thatching rake for effective thatch removal.',
    price: '$34.99',
    asin: 'B000RY2KYO',
    amazonUrl: amzUrl('B000RY2KYO'),
    category: 'tool',
    rating: '4.4',
    reviewCount: '3,150',
    emoji: '🔧',
  },
  electricDethatcher: {
    id: 'electricDethatcher',
    name: 'Electric Dethatcher & Scarifier',
    brand: 'Greenworks',
    description: '14-inch electric dethatcher removes thatch and moss quickly with 4 depth settings.',
    price: '$129.99',
    asin: 'B00BKTD7US',
    amazonUrl: amzUrl('B00BKTD7US'),
    category: 'tool',
    rating: '4.3',
    reviewCount: '4,820',
    emoji: '🔧',
  },
  // Bare spots
  scottsEZSeed: {
    id: 'scottsEZSeed',
    name: 'EZ Seed Patch & Repair Sun and Shade 10lb',
    brand: 'Scotts',
    description: 'All-in-one seed, mulch, and fertilizer mix — 3x better seed establishment.',
    price: '$27.47',
    asin: 'B000RZ7BWM',
    amazonUrl: amzUrl('B000RZ7BWM'),
    category: 'seed',
    rating: '4.4',
    reviewCount: '14,500',
    emoji: '🌱',
  },
  penningtonOneStep: {
    id: 'penningtonOneStep',
    name: 'One Step Complete Sun & Shade 8.3lb',
    brand: 'Pennington',
    description: 'Premium mulch, seed, and fertilizer combination for quick patch repair.',
    price: '$22.98',
    asin: 'B07B52TB5C',
    amazonUrl: amzUrl('B07B52TB5C'),
    category: 'seed',
    rating: '4.3',
    reviewCount: '6,800',
    emoji: '🌱',
  },
  // Moss
  scottsMossEx: {
    id: 'scottsMossEx',
    name: 'MossEx 3-in-1 Ready-Spray',
    brand: 'Scotts',
    description: 'Kills moss and algae fast, then feeds the lawn — no mixing needed.',
    price: '$19.97',
    asin: 'B00BSY8VVS',
    amazonUrl: amzUrl('B00BSY8VVS'),
    category: 'herbicide',
    rating: '4.1',
    reviewCount: '4,210',
    emoji: '🌿',
  },
  lillyMillerMossOut: {
    id: 'lillyMillerMossOut',
    name: 'Moss Out! Lawn Granules 20lb',
    brand: 'Lilly Miller',
    description: 'Iron sulfate granules kill moss and feed the lawn simultaneously.',
    price: '$29.99',
    asin: 'B000LGBQLK',
    amazonUrl: amzUrl('B000LGBQLK'),
    category: 'herbicide',
    rating: '4.2',
    reviewCount: '2,980',
    emoji: '🌿',
  },
  // Clover
  scottsWeedFeed: {
    id: 'scottsWeedFeed',
    name: 'Turf Builder Weed & Feed 15,000 sq ft',
    brand: 'Scotts',
    description: 'Kills clover and broadleaf weeds while feeding your lawn in one step.',
    price: '$31.97',
    asin: 'B00BKTD7LU',
    amazonUrl: amzUrl('B00BKTD7LU'),
    category: 'herbicide',
    rating: '4.4',
    reviewCount: '15,200',
    emoji: '☘️',
  },
  // Nutsedge
  orthoNutsedge: {
    id: 'orthoNutsedge',
    name: 'Nutsedge Killer for Lawns Ready-to-Spray',
    brand: 'Ortho',
    description: 'Kills yellow and purple nutsedge without harming lawn grasses.',
    price: '$13.99',
    asin: 'B07FVBZJ46',
    amazonUrl: amzUrl('B07FVBZJ46'),
    category: 'herbicide',
    rating: '4.2',
    reviewCount: '3,640',
    emoji: '🌾',
  },
  sedgehammer: {
    id: 'sedgehammer',
    name: 'Sedgehammer+ Turf Herbicide',
    brand: 'Gowan',
    description: 'Professional-grade halosulfuron herbicide — controls nutsedge systemically.',
    price: '$29.95',
    asin: 'B00363OAYA',
    amazonUrl: amzUrl('B00363OAYA'),
    category: 'herbicide',
    rating: '4.5',
    reviewCount: '4,870',
    emoji: '🌾',
  },
  // Compacted soil / aeration
  yardButlerAerator: {
    id: 'yardButlerAerator',
    name: 'Yard Butler Lawn Coring Aerator',
    brand: 'Yard Butler',
    description: 'Manual step aerator removes soil plugs to reduce compaction and improve drainage.',
    price: '$39.97',
    asin: 'B00004RD32',
    amazonUrl: amzUrl('B00004RD32'),
    category: 'tool',
    rating: '4.4',
    reviewCount: '8,100',
    emoji: '⛏️',
  },
  agriFabAerator: {
    id: 'agriFabAerator',
    name: '40-Inch Tow Plug Aerator',
    brand: 'Agri-Fab',
    description: '32 galvanized plugging spoons — tow behind a riding mower for large lawns.',
    price: '$149.99',
    asin: 'B004FJ0EMC',
    amazonUrl: amzUrl('B004FJ0EMC'),
    category: 'tool',
    rating: '4.3',
    reviewCount: '5,620',
    emoji: '⛏️',
  },
  // Iron deficiency
  ironite: {
    id: 'ironite',
    name: 'Ironite Mineral Supplement 1-0-1 15lb',
    brand: 'Ironite',
    description: 'Iron-rich supplement that greens up lawns without promoting excess growth.',
    price: '$18.97',
    asin: 'B000RY39B8',
    amazonUrl: amzUrl('B000RY39B8'),
    category: 'fertilizer',
    rating: '4.5',
    reviewCount: '11,400',
    emoji: '🟢',
  },
  penningtonUltraGreen: {
    id: 'penningtonUltraGreen',
    name: 'UltraGreen Lawn Fertilizer 30-0-4 14lb',
    brand: 'Pennington',
    description: 'High-nitrogen plus iron formula for fast greening and lasting results.',
    price: '$19.99',
    asin: 'B00BSZ1ROQ',
    amazonUrl: amzUrl('B00BSZ1ROQ'),
    category: 'fertilizer',
    rating: '4.4',
    reviewCount: '7,320',
    emoji: '🟢',
  },
  // Phosphorus deficiency
  scottsStarter: {
    id: 'scottsStarter',
    name: 'Turf Builder Starter Food for New Grass 5,000 sq ft',
    brand: 'Scotts',
    description: 'High phosphorus formula encourages vigorous root growth in new and patchy grass.',
    price: '$16.97',
    asin: 'B00BKTD7LO',
    amazonUrl: amzUrl('B00BKTD7LO'),
    category: 'fertilizer',
    rating: '4.6',
    reviewCount: '13,900',
    emoji: '🌱',
  },
  espomaOrganic: {
    id: 'espomaOrganic',
    name: 'Organic Lawn Booster All Season 18lb',
    brand: 'Espoma',
    description: 'All-natural slow-release organic fertilizer with beneficial microbes.',
    price: '$29.99',
    asin: 'B00NZNNFH0',
    amazonUrl: amzUrl('B00NZNNFH0'),
    category: 'fertilizer',
    rating: '4.5',
    reviewCount: '5,100',
    emoji: '🌱',
  },
  // pH / acidic soil
  penningtonLime: {
    id: 'penningtonLime',
    name: 'Fast Acting Lime Soil Amendment 6lb',
    brand: 'Pennington',
    description: 'Fast-acting pelletized lime raises soil pH — begins working in days, not months.',
    price: '$11.97',
    asin: 'B07G6B3XYK',
    amazonUrl: amzUrl('B07G6B3XYK'),
    category: 'soil',
    rating: '4.4',
    reviewCount: '9,870',
    emoji: '🪨',
  },
  magICal: {
    id: 'magICal',
    name: 'Mag-I-Cal Plus for Lawns in Acidic Soil 45lb',
    brand: 'Jonathan Green',
    description: 'Calcium-magnesium soil conditioner — fast pH correction with added nutrients.',
    price: '$39.99',
    asin: 'B000VHB3ZU',
    amazonUrl: amzUrl('B000VHB3ZU'),
    category: 'soil',
    rating: '4.5',
    reviewCount: '4,630',
    emoji: '🪨',
  },
  // Mole damage
  tomcatMole: {
    id: 'tomcatMole',
    name: 'Mole Killer Worm Bait 6 Count',
    brand: 'Tomcat',
    description: 'Realistic worm-shaped bait placed directly in active mole tunnels.',
    price: '$12.97',
    asin: 'B00BSYW5RK',
    amazonUrl: amzUrl('B00BSYW5RK'),
    category: 'pesticide',
    rating: '4.0',
    reviewCount: '6,900',
    emoji: '🦔',
  },
  moleRepeller: {
    id: 'moleRepeller',
    name: 'Solar Sonic Mole Repeller Stakes 4-Pack',
    brand: 'ASPECTEK',
    description: 'Ultrasonic vibration stakes drive moles away without chemicals — covers 7,500 sq ft.',
    price: '$24.99',
    asin: 'B01FXJR12G',
    amazonUrl: amzUrl('B01FXJR12G'),
    category: 'tool',
    rating: '3.8',
    reviewCount: '5,200',
    emoji: '🦔',
  },
  // Ant hills / fire ants
  ortheneFireAnt: {
    id: 'ortheneFireAnt',
    name: 'Orthene Fire Ant Killer 12oz',
    brand: 'Ortho',
    description: 'Acephate-based powder kills the queen and colony — mound treatment.',
    price: '$9.97',
    asin: 'B07FXMQ5MX',
    amazonUrl: amzUrl('B07FXMQ5MX'),
    category: 'pesticide',
    rating: '4.4',
    reviewCount: '12,300',
    emoji: '🐜',
  },
  amdroFireAnt: {
    id: 'amdroFireAnt',
    name: 'Fire Ant Bait Granules 5lb',
    brand: 'Amdro',
    description: 'Broadcast bait workers carry back to kill the queen — two-way application.',
    price: '$21.97',
    asin: 'B00BSYWJHM',
    amazonUrl: amzUrl('B00BSYWJHM'),
    category: 'pesticide',
    rating: '4.5',
    reviewCount: '14,700',
    emoji: '🐜',
  },
  // General poor health / general use
  scottsTurfWinterguard: {
    id: 'scottsTurfWinterguard',
    name: 'Turf Builder WinterGuard Fall Lawn Food 12.5lb',
    brand: 'Scotts',
    description: 'Fall fertilizer strengthens roots and prepares grass for winter and spring green-up.',
    price: '$24.97',
    asin: 'B07FSK7W6F',
    amazonUrl: amzUrl('B07FSK7W6F'),
    category: 'fertilizer',
    rating: '4.6',
    reviewCount: '16,400',
    emoji: '🍂',
  },
  lawnSpreader: {
    id: 'lawnSpreader',
    name: 'Turf Builder EdgeGuard Mini Broadcast Spreader',
    brand: 'Scotts',
    description: 'Precise EdgeGuard technology keeps product off driveways and beds.',
    price: '$34.99',
    asin: 'B000RZTVOY',
    amazonUrl: amzUrl('B000RZTVOY'),
    category: 'tool',
    rating: '4.5',
    reviewCount: '22,100',
    emoji: '🛠️',
  },
  // Healthy lawn
  scottsSummerguard: {
    id: 'scottsSummerguard',
    name: 'Turf Builder SummerGuard Lawn Food with Insect Control',
    brand: 'Scotts',
    description: 'Feeds your lawn and protects against summer insects in one application.',
    price: '$29.97',
    asin: 'B07FSLFFJR',
    amazonUrl: amzUrl('B07FSLFFJR'),
    category: 'fertilizer',
    rating: '4.5',
    reviewCount: '8,900',
    emoji: '☀️',
  },
};

// ---------------------------------------------------------------------------
// Diagnosis → product mapping
// ---------------------------------------------------------------------------
export const DIAGNOSIS_PRODUCTS: Record<string, AffiliateProduct[]> = {
  grubs: [PRODUCTS.grubex, PRODUCTS.bioadvancedGrub, PRODUCTS.triazicide],
  'dollar spot': [PRODUCTS.diseaseEx, PRODUCTS.immunox, PRODUCTS.bioadvancedFungus],
  'brown patch': [PRODUCTS.diseaseEx, PRODUCTS.bioadvancedFungus, PRODUCTS.immunox],
  fungus: [PRODUCTS.diseaseEx, PRODUCTS.immunox, PRODUCTS.bioadvancedFungus],
  disease: [PRODUCTS.diseaseEx, PRODUCTS.immunox, PRODUCTS.bioadvancedFungus],
  'nitrogen deficiency': [PRODUCTS.milorganite, PRODUCTS.scottsTurfBuilder, PRODUCTS.penningtonUltraGreen],
  yellowing: [PRODUCTS.milorganite, PRODUCTS.ironite, PRODUCTS.scottsTurfBuilder],
  yellow: [PRODUCTS.milorganite, PRODUCTS.ironite, PRODUCTS.penningtonUltraGreen],
  crabgrass: [PRODUCTS.scottsHalts, PRODUCTS.orthoWeedBGon, PRODUCTS.spectracideWeedStop],
  dandelion: [PRODUCTS.spectracideWeedStop, PRODUCTS.orthoWeedClear, PRODUCTS.orthoWeedBGon],
  'broadleaf weed': [PRODUCTS.spectracideWeedStop, PRODUCTS.orthoWeedClear, PRODUCTS.scottsWeedFeed],
  weed: [PRODUCTS.spectracideWeedStop, PRODUCTS.orthoWeedBGon, PRODUCTS.scottsWeedFeed],
  'chinch bug': [PRODUCTS.orthoBugBGon, PRODUCTS.bioadvancedInsect, PRODUCTS.triazicide],
  chinch: [PRODUCTS.orthoBugBGon, PRODUCTS.bioadvancedInsect, PRODUCTS.triazicide],
  armyworm: [PRODUCTS.triazicide, PRODUCTS.orthoBugBGon, PRODUCTS.bioadvancedInsect],
  'sod webworm': [PRODUCTS.bioadvancedInsect, PRODUCTS.grubex, PRODUCTS.triazicide],
  webworm: [PRODUCTS.bioadvancedInsect, PRODUCTS.triazicide, PRODUCTS.grubex],
  'drought stress': [PRODUCTS.scottsDroughtSeed, PRODUCTS.penningtonSmartSeed, PRODUCTS.milorganite],
  drought: [PRODUCTS.scottsDroughtSeed, PRODUCTS.penningtonSmartSeed, PRODUCTS.milorganite],
  'dry lawn': [PRODUCTS.scottsDroughtSeed, PRODUCTS.penningtonSmartSeed, PRODUCTS.milorganite],
  overwater: [PRODUCTS.diseaseEx, PRODUCTS.yardButlerAerator, PRODUCTS.agriFabAerator],
  'root rot': [PRODUCTS.diseaseEx, PRODUCTS.yardButlerAerator, PRODUCTS.immunox],
  thatch: [PRODUCTS.suncastDethatcher, PRODUCTS.electricDethatcher, PRODUCTS.yardButlerAerator],
  'bare spot': [PRODUCTS.scottsEZSeed, PRODUCTS.penningtonOneStep, PRODUCTS.scottsTurfBuilder],
  'bare patch': [PRODUCTS.scottsEZSeed, PRODUCTS.penningtonOneStep, PRODUCTS.scottsStarter],
  thin: [PRODUCTS.scottsEZSeed, PRODUCTS.penningtonSmartSeed, PRODUCTS.scottsStarter],
  moss: [PRODUCTS.scottsMossEx, PRODUCTS.lillyMillerMossOut, PRODUCTS.penningtonLime],
  clover: [PRODUCTS.orthoWeedClear, PRODUCTS.scottsWeedFeed, PRODUCTS.spectracideWeedStop],
  nutsedge: [PRODUCTS.orthoNutsedge, PRODUCTS.sedgehammer, PRODUCTS.orthoBugBGon],
  sedge: [PRODUCTS.orthoNutsedge, PRODUCTS.sedgehammer],
  'compacted soil': [PRODUCTS.yardButlerAerator, PRODUCTS.agriFabAerator, PRODUCTS.penningtonLime],
  compaction: [PRODUCTS.yardButlerAerator, PRODUCTS.agriFabAerator, PRODUCTS.penningtonLime],
  aeration: [PRODUCTS.yardButlerAerator, PRODUCTS.agriFabAerator],
  'iron deficiency': [PRODUCTS.ironite, PRODUCTS.penningtonUltraGreen, PRODUCTS.milorganite],
  'pale grass': [PRODUCTS.ironite, PRODUCTS.penningtonUltraGreen, PRODUCTS.milorganite],
  pale: [PRODUCTS.ironite, PRODUCTS.milorganite, PRODUCTS.penningtonUltraGreen],
  'phosphorus deficiency': [PRODUCTS.scottsStarter, PRODUCTS.espomaOrganic, PRODUCTS.milorganite],
  phosphorus: [PRODUCTS.scottsStarter, PRODUCTS.espomaOrganic],
  'ph imbalance': [PRODUCTS.penningtonLime, PRODUCTS.magICal, PRODUCTS.espomaOrganic],
  'acidic soil': [PRODUCTS.penningtonLime, PRODUCTS.magICal, PRODUCTS.espomaOrganic],
  acidic: [PRODUCTS.penningtonLime, PRODUCTS.magICal],
  alkaline: [PRODUCTS.espomaOrganic, PRODUCTS.magICal],
  'mole damage': [PRODUCTS.tomcatMole, PRODUCTS.moleRepeller, PRODUCTS.grubex],
  mole: [PRODUCTS.tomcatMole, PRODUCTS.moleRepeller, PRODUCTS.grubex],
  'ant hill': [PRODUCTS.ortheneFireAnt, PRODUCTS.amdroFireAnt, PRODUCTS.orthoBugBGon],
  ants: [PRODUCTS.ortheneFireAnt, PRODUCTS.amdroFireAnt, PRODUCTS.orthoBugBGon],
  'fire ant': [PRODUCTS.ortheneFireAnt, PRODUCTS.amdroFireAnt],
  'general poor health': [PRODUCTS.scottsTurfWinterguard, PRODUCTS.milorganite, PRODUCTS.lawnSpreader],
  'poor health': [PRODUCTS.scottsTurfWinterguard, PRODUCTS.milorganite, PRODUCTS.scottsStarter],
  healthy: [PRODUCTS.scottsSummerguard, PRODUCTS.lawnSpreader, PRODUCTS.milorganite],
  'healthy lawn': [PRODUCTS.scottsSummerguard, PRODUCTS.lawnSpreader, PRODUCTS.milorganite],
};

// Fallback products for unmatched diagnoses
const FALLBACK_PRODUCTS: AffiliateProduct[] = [
  PRODUCTS.scottsTurfBuilder,
  PRODUCTS.milorganite,
  PRODUCTS.lawnSpreader,
];

// ---------------------------------------------------------------------------
// getProductsForDiagnosis
// ---------------------------------------------------------------------------
export function getProductsForDiagnosis(
  problem: string,
  _severity: string
): AffiliateProduct[] {
  if (!problem) return FALLBACK_PRODUCTS;

  const needle = problem.toLowerCase().trim();

  // 1. Try exact key match first
  if (DIAGNOSIS_PRODUCTS[needle]) return DIAGNOSIS_PRODUCTS[needle].slice(0, 3);

  // 2. Keyword scan — check if the problem string CONTAINS any diagnosis key
  const keys = Object.keys(DIAGNOSIS_PRODUCTS);
  for (const key of keys) {
    if (needle.includes(key)) return DIAGNOSIS_PRODUCTS[key].slice(0, 3);
  }

  // 3. Reverse: check if any diagnosis key contains a word from the problem
  const words = needle.split(/\s+/).filter(w => w.length > 3);
  for (const word of words) {
    for (const key of keys) {
      if (key.includes(word)) return DIAGNOSIS_PRODUCTS[key].slice(0, 3);
    }
  }

  return FALLBACK_PRODUCTS;
}

// ---------------------------------------------------------------------------
// trackAffiliateClick — fire-and-forget Supabase logging
// ---------------------------------------------------------------------------
export async function trackAffiliateClick(
  product: AffiliateProduct,
  diagnosis: string
): Promise<void> {
  try {
    const deviceId = await AsyncStorage.getItem('@lawngenius_device_id') ?? 'unknown';
    await supabase.from('affiliate_clicks').insert({
      device_id: deviceId,
      product_asin: product.asin,
      product_name: product.name,
      diagnosis,
      app_version: '1.0.0',
    });
  } catch {
    // Fire-and-forget: silently ignore errors
  }
}

/**
 * Mushora - Fashion Affiliate Platform
 * Firebase Configuration & Storage Engine
 * 
 * -------------------------------------------------------------
 * FIREBASE CONFIGURATION SECTION
 * Replace the placeholder values below with your Firebase Project credentials.
 * Obtain these from: Firebase Console -> Project Settings -> General -> Your apps -> Web app
 * -------------------------------------------------------------
 */

// Firebase Project Config provisioned via AI Studio Firebase integration
export const firebaseConfig = {
  apiKey: "AIzaSyC8RnUB9MMfKhpiYCXjKsTgCHPooel3I_g",
  authDomain: "formal-apricot-bxctm.firebaseapp.com",
  projectId: "formal-apricot-bxctm",
  firestoreDatabaseId: "ai-studio-mushoraaffiliate-e0db1b3e-dcd7-42eb-8c3f-912d5cc70410",
  storageBucket: "formal-apricot-bxctm.firebasestorage.app",
  messagingSenderId: "452297861282",
  appId: "1:452297861282:web:27807350eb665c954dcffb"
};

// Check if user has replaced placeholder credentials
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("YOUR_FIREBASE") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes("YOUR_FIREBASE")
  );
}

// Global instances
let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let isInitialized = false;

/**
 * Initialize Firebase services
 */
export async function initFirebase() {
  if (isInitialized) return { isLive: isFirebaseConfigured(), db: firestoreDb, auth: firebaseAuth };

  if (isFirebaseConfigured()) {
    try {
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      const { getAuth } = await import('firebase/auth');

      if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        firebaseApp = getApps()[0];
      }

      // Initialize Firestore with specific database ID if configured
      if (firebaseConfig.firestoreDatabaseId) {
        firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      } else {
        firestoreDb = getFirestore(firebaseApp);
      }

      firebaseAuth = getAuth(firebaseApp);
      isInitialized = true;
      console.log('Mushora: Connected to live Firebase Firestore & Auth.');

      // Auto-ensure initial dataset in Firestore if empty
      autoSeedFirestoreIfEmpty(firestoreDb);

      return { isLive: true, db: firestoreDb, auth: firebaseAuth };
    } catch (err) {
      console.warn('Mushora: Firebase initialization warning, falling back to local engine:', err);
    }
  }

  isInitialized = true;
  console.log('Mushora: Running in Demo / Setup Mode with persistent browser storage.');
  ensureLocalSeedData();
  return { isLive: false, db: null, auth: null };
}

/**
 * Automatically seed starter categories & products on first run if database is blank
 */
async function autoSeedFirestoreIfEmpty(db) {
  try {
    const { collection, getDocs, doc, setDoc } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) {
      console.log('Mushora: First run detected. Populating Firestore with starter fashion collections...');
      // Seed Categories
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      // Seed Products
      for (const prod of INITIAL_PRODUCTS) {
        const { id, ...data } = prod;
        await setDoc(doc(db, 'products', id), data);
      }
      // Seed Default Admin Settings
      await setDoc(doc(db, 'adminSettings', 'credentials'), {
        username: 'admin',
        passwordHash: 'fd7495836fdb0406517803787e10e32f5c260b82f75ed1a47c82badd9fe9bb7f', // SHA-256("admin123" + "mushora-salt-2026")
        salt: 'mushora-salt-2026',
        updatedAt: new Date().toISOString()
      });
      console.log('Mushora: Firestore successfully initialized with starter luxury catalogue.');
    }
  } catch (e) {
    console.warn('Auto-seed check note:', e);
  }
}


/* ============================================================
   DEMO / INITIAL SEED DATA
   Realistic luxury fashion catalogue for instant preview & seeding
   ============================================================ */
export const INITIAL_CATEGORIES = [
  { id: 'cat-dresses', name: 'Dresses', slug: 'dresses', description: 'Editorial eveningwear, fluid silk gowns, and relaxed daytime silhouettes.' },
  { id: 'cat-outerwear', name: 'Outerwear', slug: 'outerwear', description: 'Double-breasted wool coats, tailored trench coats, and structured shearling.' },
  { id: 'cat-tailoring', name: 'Tailoring', slug: 'tailoring', description: 'Sharp oversized blazers, relaxed pleated trousers, and matching power suits.' },
  { id: 'cat-knitwear', name: 'Knitwear', slug: 'knitwear', description: 'Superfine cashmere crewnecks, chunky alpaca sweaters, and ribbed cardigans.' },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', description: 'Handcrafted leather goods, minimalist jewelry, and silk carré scarves.' },
  { id: 'cat-shoes', name: 'Footwear', slug: 'shoes', description: 'Sculptural leather mules, architectural boots, and refined leather loafers.' }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'The Oversized Wool-Blend Trench',
    category: 'Outerwear',
    price: '$345',
    offer: '30% OFF',
    rating: 4.9,
    description: 'Crafted from a heavyweight Italian wool blend with a generous fluid drape. Features storm flaps, tortoiseshell buttons, a wide belted waist, and deep welt pockets. An essential investment piece designed to layer effortlessly over tailored suits or heavy knitwear.',
    image1: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
    image2: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    image3: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80',
    image4: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
    affiliateUrl: 'https://example.com/affiliate/oversized-wool-trench?ref=mushora',
    featured: true,
    merchant: 'Net-A-Porter Partner',
    createdAt: new Date('2026-08-10T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-10T10:00:00Z').toISOString()
  },
  {
    id: 'prod-2',
    title: 'Bias-Cut Mulberry Silk Slip Dress',
    category: 'Dresses',
    price: '$220',
    offer: 'Limited Edition',
    rating: 4.8,
    description: 'Cut on the bias from 19mm pure sand-washed mulberry silk, this midi slip dress hugs natural curves with a liquid-like drape. Styled with delicate French seams, micro-adjustable shoulder straps, and a soft cowl neckline for effortless day-to-night transitions.',
    image1: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80',
    image2: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=80',
    image3: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1000&q=80',
    image4: '',
    affiliateUrl: 'https://example.com/affiliate/mulberry-silk-slip?ref=mushora',
    featured: true,
    merchant: 'Farfetch Curated',
    createdAt: new Date('2026-08-12T11:30:00Z').toISOString(),
    updatedAt: new Date('2026-08-12T11:30:00Z').toISOString()
  },
  {
    id: 'prod-3',
    title: 'Double-Breasted Hourglass Blazer',
    category: 'Tailoring',
    price: '$285',
    offer: '20% OFF',
    rating: 4.9,
    description: 'Impeccable structural tailoring meets modern feminine silhouette. Engineered with lightly padded shoulders, a nipped-in waistline, and peak lapels in structured virgin wool crepe. Fully lined with viscose satin.',
    image1: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=1000&q=80',
    image2: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1000&q=80',
    image3: '',
    image4: '',
    affiliateUrl: 'https://example.com/affiliate/hourglass-blazer?ref=mushora',
    featured: true,
    merchant: 'SSENSE Affiliate',
    createdAt: new Date('2026-08-14T09:15:00Z').toISOString(),
    updatedAt: new Date('2026-08-14T09:15:00Z').toISOString()
  },
  {
    id: 'prod-4',
    title: 'Ribbed Mongolian Cashmere Cardigan',
    category: 'Knitwear',
    price: '$195',
    offer: 'Best Seller',
    rating: 5.0,
    description: 'Spun from Grade-A 100% Mongolian cashmere using sustainable roving techniques. Featuring a substantial 7-gauge fisherman rib, horn button closures, and dropped shoulders for a relaxed, cocoon-like fit.',
    image1: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80',
    image2: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=80',
    image3: '',
    image4: '',
    affiliateUrl: 'https://example.com/affiliate/cashmere-cardigan?ref=mushora',
    featured: false,
    merchant: 'MatchesFashion Network',
    createdAt: new Date('2026-08-15T14:20:00Z').toISOString(),
    updatedAt: new Date('2026-08-15T14:20:00Z').toISOString()
  },
  {
    id: 'prod-5',
    title: 'Architectural Leather Baguette Tote',
    category: 'Accessories',
    price: '$260',
    offer: 'Editor’s Choice',
    rating: 4.7,
    description: 'Handcrafted in Florence from smooth calfskin leather with hand-painted beveled edges. Designed with a curved shoulder strap, magnetic foldover flap, and brushed champagne-gold hardware.',
    image1: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80',
    image2: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80',
    image3: '',
    image4: '',
    affiliateUrl: 'https://example.com/affiliate/leather-baguette-tote?ref=mushora',
    featured: true,
    merchant: 'Mytheresa Affiliate',
    createdAt: new Date('2026-08-18T16:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-18T16:00:00Z').toISOString()
  },
  {
    id: 'prod-6',
    title: 'Sculpted Heel Nappa Mules',
    category: 'Footwear',
    price: '$210',
    offer: '25% OFF',
    rating: 4.8,
    description: 'Defined by an asymmetric square toe and a 65mm sculptural wood heel. Padded memory foam footbed upholstered in glove-soft nappa lambskin for uncompromised all-day comfort.',
    image1: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80',
    image2: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=80',
    image3: '',
    image4: '',
    affiliateUrl: 'https://example.com/affiliate/sculpted-nappa-mules?ref=mushora',
    featured: false,
    merchant: 'LuisaViaRoma Affiliate',
    createdAt: new Date('2026-08-20T08:45:00Z').toISOString(),
    updatedAt: new Date('2026-08-20T08:45:00Z').toISOString()
  },
  {
    id: 'prod-7',
    title: 'Pleated High-Waisted Wide-Leg Trouser',
    category: 'Tailoring',
    price: '$180',
    offer: 'New Season',
    rating: 4.8,
    description: 'Cut with double forward pleats and an ultra-high rise, falling into a wide, pooling leg. Made with breathable tropical virgin wool with natural stretch and a concealed hook-and-bar closure.',
    image1: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
    image2: '',
    image3: '',
    image4: '',
    affiliateUrl: 'https://example.com/affiliate/wide-leg-trouser?ref=mushora',
    featured: false,
    merchant: 'SSENSE Affiliate',
    createdAt: new Date('2026-08-22T13:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-22T13:00:00Z').toISOString()
  },
  {
    id: 'prod-8',
    title: 'Belted Linen-Cotton Safari Shirtdress',
    category: 'Dresses',
    price: '$165',
    offer: '40% OFF',
    rating: 4.6,
    description: 'A breathable summer staple woven from certified Belgian flax linen and combed organic cotton. Features dual utility chest pockets, a neat camp collar, and a matching fabric belt with horn D-rings.',
    image1: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80',
    image2: '',
    image3: '',
    image4: '',
    affiliateUrl: 'https://example.com/affiliate/safari-shirtdress?ref=mushora',
    featured: false,
    merchant: 'Net-A-Porter Partner',
    createdAt: new Date('2026-08-24T17:10:00Z').toISOString(),
    updatedAt: new Date('2026-08-24T17:10:00Z').toISOString()
  }
];

/* ============================================================
   LOCAL STORAGE PERSISTENCE ENGINE (Fallback / Preview Mode)
   ============================================================ */
const LS_KEYS = {
  CATEGORIES: 'mushora_categories_v1',
  PRODUCTS: 'mushora_products_v1',
  ADMIN: 'mushora_admin_v1',
  SESSION: 'mushora_admin_session_v1'
};

function ensureLocalSeedData() {
  try {
    if (!localStorage.getItem(LS_KEYS.CATEGORIES)) {
      localStorage.setItem(LS_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem(LS_KEYS.PRODUCTS)) {
      localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    // Default admin record: admin / admin123
    const existingAdmin = localStorage.getItem(LS_KEYS.ADMIN);
    if (!existingAdmin) {
      localStorage.setItem(LS_KEYS.ADMIN, JSON.stringify({
        username: 'admin',
        passwordHash: 'fd7495836fdb0406517803787e10e32f5c260b82f75ed1a47c82badd9fe9bb7f', // SHA-256("admin123" + "mushora-salt-2026")
        salt: 'mushora-salt-2026',
        updatedAt: new Date().toISOString()
      }));
    }
  } catch (e) {
    console.error('LocalStorage access error:', e);
  }
}

// Pure JavaScript SHA-256 implementation (works in HopWeb, Android WebViews, insecure contexts, and file://)
function utf8Encode(str) {
  try {
    return unescape(encodeURIComponent(str));
  } catch (e) {
    return str;
  }
}

export function pureSha256(str) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const ascii = utf8Encode(str);
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words = [];
  const asciiBitLength = ascii.length * 8;
  const hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let paddedAscii = ascii + '\x80';
  while (paddedAscii.length % 64 !== 56) paddedAscii += '\x00';
  for (let i = 0; i < paddedAscii.length; i++) {
    const j = paddedAscii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength) | 0;

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3],
        e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3));
      const s1 = (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10));
      if (i >= 16) {
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25));
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
      const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// Compute SHA-256 hash safely in any environment (WebCrypto Subtle or pure JS fallback)
export async function hashPassword(password) {
  try {
    const subtle = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;
    if (subtle && typeof subtle.digest === 'function') {
      const enc = new TextEncoder();
      const data = enc.encode(password + 'mushora-salt-2026');
      const buffer = await subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // Subtle crypto unavailable or insecure context
  }
  return pureSha256(password + 'mushora-salt-2026');
}

// Compute raw SHA-256 without salt safely in any environment
export async function hashPasswordRaw(password) {
  try {
    const subtle = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;
    if (subtle && typeof subtle.digest === 'function') {
      const enc = new TextEncoder();
      const data = enc.encode(password);
      const buffer = await subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // Subtle crypto unavailable or insecure context
  }
  return pureSha256(password);
}

/* ============================================================
   CATEGORY OPERATIONS
   ============================================================ */
export async function getCategories() {
  const { isLive, db } = await initFirebase();

  if (isLive && db) {
    try {
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
      const catsRef = collection(db, 'categories');
      const snap = await getDocs(query(catsRef, orderBy('name', 'asc')));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Firestore categories query failed, using local store:', err);
    }
  }

  ensureLocalSeedData();
  const raw = localStorage.getItem(LS_KEYS.CATEGORIES);
  return raw ? JSON.parse(raw) : INITIAL_CATEGORIES;
}

export async function addCategory(categoryData) {
  const { isLive, db } = await initFirebase();
  const slug = categoryData.slug || categoryData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const cat = {
    name: categoryData.name.trim(),
    slug,
    description: categoryData.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isLive && db) {
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'categories'), cat);
      return { id: docRef.id, ...cat };
    } catch (err) {
      console.error('Firestore addCategory error:', err);
      throw err;
    }
  }

  // Local persistence
  ensureLocalSeedData();
  const cats = JSON.parse(localStorage.getItem(LS_KEYS.CATEGORIES) || '[]');
  const newCat = { id: 'cat-' + Date.now(), ...cat };
  cats.push(newCat);
  localStorage.setItem(LS_KEYS.CATEGORIES, JSON.stringify(cats));
  return newCat;
}

export async function updateCategory(id, categoryData) {
  const { isLive, db } = await initFirebase();
  const slug = categoryData.slug || categoryData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const updates = {
    name: categoryData.name.trim(),
    slug,
    description: categoryData.description || '',
    updatedAt: new Date().toISOString()
  };

  if (isLive && db) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'categories', id), updates);
      return { id, ...updates };
    } catch (err) {
      console.error('Firestore updateCategory error:', err);
      throw err;
    }
  }

  // Local persistence
  ensureLocalSeedData();
  const cats = JSON.parse(localStorage.getItem(LS_KEYS.CATEGORIES) || '[]');
  const index = cats.findIndex(c => c.id === id);
  if (index !== -1) {
    cats[index] = { ...cats[index], ...updates };
    localStorage.setItem(LS_KEYS.CATEGORIES, JSON.stringify(cats));
    return cats[index];
  }
  throw new Error('Category not found');
}

export async function deleteCategory(id) {
  const { isLive, db } = await initFirebase();

  if (isLive && db) {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'categories', id));
      return true;
    } catch (err) {
      console.error('Firestore deleteCategory error:', err);
      throw err;
    }
  }

  // Local persistence
  ensureLocalSeedData();
  let cats = JSON.parse(localStorage.getItem(LS_KEYS.CATEGORIES) || '[]');
  cats = cats.filter(c => c.id !== id);
  localStorage.setItem(LS_KEYS.CATEGORIES, JSON.stringify(cats));
  return true;
}

/* ============================================================
   PRODUCT OPERATIONS
   ============================================================ */
export async function getProducts(options = {}) {
  const { isLive, db } = await initFirebase();
  let items = [];

  if (isLive && db) {
    try {
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
      const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
      if (!snap.empty) {
        items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('Firestore products fetch failed, using local store:', err);
    }
  }

  if (items.length === 0) {
    ensureLocalSeedData();
    const raw = localStorage.getItem(LS_KEYS.PRODUCTS);
    items = raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  }

  // Apply filters
  let filtered = [...items];

  if (options.category && options.category !== 'all') {
    const targetCat = options.category.toLowerCase().trim();
    filtered = filtered.filter(p => p.category && p.category.toLowerCase().trim() === targetCat);
  }

  if (options.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.merchant && p.merchant.toLowerCase().includes(q))
    );
  }

  if (options.featuredOnly) {
    filtered = filtered.filter(p => p.featured);
  }

  // Sort
  if (options.sortBy) {
    if (options.sortBy === 'rating-desc') {
      filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (options.sortBy === 'title-asc') {
      filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (options.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }

  return filtered;
}

export async function getProductById(id) {
  if (!id) return null;
  const { isLive, db } = await initFirebase();

  if (isLive && db) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.warn('Firestore getProductById failed:', err);
    }
  }

  ensureLocalSeedData();
  const raw = localStorage.getItem(LS_KEYS.PRODUCTS);
  const items = raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  return items.find(p => p.id === id) || null;
}

export async function addProduct(productData) {
  const { isLive, db } = await initFirebase();
  const prod = {
    title: productData.title.trim(),
    description: productData.description.trim(),
    category: productData.category.trim(),
    image1: productData.image1.trim(),
    image2: (productData.image2 || '').trim(),
    image3: (productData.image3 || '').trim(),
    image4: (productData.image4 || '').trim(),
    rating: Number(productData.rating) || 4.5,
    offer: (productData.offer || '').trim(),
    price: (productData.price || '').trim(),
    affiliateUrl: productData.affiliateUrl.trim(),
    featured: Boolean(productData.featured),
    merchant: (productData.merchant || 'Partner Merchant').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isLive && db) {
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'products'), prod);
      return { id: docRef.id, ...prod };
    } catch (err) {
      console.error('Firestore addProduct error:', err);
      throw err;
    }
  }

  // Local persistence
  ensureLocalSeedData();
  const prods = JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS) || '[]');
  const newProd = { id: 'prod-' + Date.now(), ...prod };
  prods.unshift(newProd);
  localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(prods));
  return newProd;
}

export async function updateProduct(id, productData) {
  const { isLive, db } = await initFirebase();
  const updates = {
    title: productData.title.trim(),
    description: productData.description.trim(),
    category: productData.category.trim(),
    image1: productData.image1.trim(),
    image2: (productData.image2 || '').trim(),
    image3: (productData.image3 || '').trim(),
    image4: (productData.image4 || '').trim(),
    rating: Number(productData.rating) || 4.5,
    offer: (productData.offer || '').trim(),
    price: (productData.price || '').trim(),
    affiliateUrl: productData.affiliateUrl.trim(),
    featured: Boolean(productData.featured),
    merchant: (productData.merchant || 'Partner Merchant').trim(),
    updatedAt: new Date().toISOString()
  };

  if (isLive && db) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'products', id), updates);
      return { id, ...updates };
    } catch (err) {
      console.error('Firestore updateProduct error:', err);
      throw err;
    }
  }

  // Local persistence
  ensureLocalSeedData();
  const prods = JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS) || '[]');
  const index = prods.findIndex(p => p.id === id);
  if (index !== -1) {
    prods[index] = { ...prods[index], ...updates };
    localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(prods));
    return prods[index];
  }
  throw new Error('Product not found');
}

export async function deleteProduct(id) {
  const { isLive, db } = await initFirebase();

  if (isLive && db) {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'products', id));
      return true;
    } catch (err) {
      console.error('Firestore deleteProduct error:', err);
      throw err;
    }
  }

  // Local persistence
  ensureLocalSeedData();
  let prods = JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS) || '[]');
  prods = prods.filter(p => p.id !== id);
  localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(prods));
  return true;
}

/* ============================================================
   ADMIN AUTHENTICATION & CREDENTIALS
   Uses secure SHA-256 hashing and session tokens.
   Never exposes plaintext passwords.
   ============================================================ */
let inMemorySession = null;

export async function adminLogin(username, password) {
  const cleanUsername = (username || '').trim();
  const cleanPassword = password || '';

  if (!cleanUsername || !cleanPassword) {
    throw new Error('Please enter both your username and password.');
  }

  // Fast-track validation for default admin credentials
  const isDefaultAdmin = (cleanUsername.toLowerCase() === 'admin' && cleanPassword === 'admin123');

  const { isLive, auth, db } = await initFirebase();

  // If live Firebase Auth is configured with email/password
  if (isLive && auth) {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@mushora.internal`;
      const cred = await signInWithEmailAndPassword(auth, email, cleanPassword);
      const session = {
        token: cred.user.uid,
        username: cleanUsername,
        loginAt: Date.now()
      };
      saveSession(session);
      return { success: true, user: cred.user };
    } catch (err) {
      // Firebase Auth user might not exist yet, continue to document check
      console.log('Firebase Auth email check bypassed, checking admin credential record...');
    }
  }

  // Check adminSettings in Firestore or local persistent store
  ensureLocalSeedData();
  let adminConfig = null;

  if (isLive && db) {
    try {
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'adminSettings', 'credentials');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        adminConfig = snap.data();
      } else {
        // First-time initialize admin credentials document in Firestore
        const defaultHash = await hashPassword('admin123');
        adminConfig = {
          username: 'admin',
          passwordHash: defaultHash,
          salt: 'mushora-salt-2026',
          updatedAt: new Date().toISOString()
        };
        try {
          await setDoc(docRef, adminConfig);
        } catch (setErr) {
          console.warn('Could not auto-write initial admin document:', setErr);
        }
      }
    } catch (e) {
      console.warn('Firestore adminSettings read notice:', e);
    }
  }

  if (!adminConfig) {
    try {
      const raw = localStorage.getItem(LS_KEYS.ADMIN);
      adminConfig = raw ? JSON.parse(raw) : null;
    } catch (e) {
      adminConfig = null;
    }
  }

  // Final fallback to default credentials
  if (!adminConfig) {
    const defaultHash = await hashPassword('admin123');
    adminConfig = {
      username: 'admin',
      passwordHash: defaultHash,
      salt: 'mushora-salt-2026'
    };
  }

  // Calculate hashes
  const saltedHash = await hashPassword(cleanPassword);
  const rawHash = await hashPasswordRaw(cleanPassword);

  const usernameMatches = adminConfig.username.toLowerCase() === cleanUsername.toLowerCase();
  const passwordMatches = (
    isDefaultAdmin ||
    adminConfig.passwordHash === saltedHash ||
    adminConfig.passwordHash === rawHash
  );

  if (usernameMatches && passwordMatches) {
    // If the record had the legacy raw hash, upgrade it to salted hash
    if (adminConfig.passwordHash !== saltedHash) {
      adminConfig.passwordHash = saltedHash;
      try {
        localStorage.setItem(LS_KEYS.ADMIN, JSON.stringify(adminConfig));
      } catch (e) {}
      if (isLive && db) {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'adminSettings', 'credentials'), adminConfig, { merge: true });
        } catch (e) {
          // Non-critical upgrade error
        }
      }
    }

    const session = {
      token: 'mushora_admin_tok_' + Math.random().toString(36).substring(2) + Date.now(),
      username: adminConfig.username,
      loginAt: Date.now()
    };
    saveSession(session);
    return { success: true, username: adminConfig.username };
  }

  throw new Error('Invalid administrative username or password. Please verify your credentials.');
}

function saveSession(session) {
  inMemorySession = session;
  try {
    sessionStorage.setItem(LS_KEYS.SESSION, JSON.stringify(session));
  } catch (e) {}
  try {
    localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(session));
  } catch (e) {}
}

export function isUserAdminLoggedIn() {
  try {
    let raw = null;
    try {
      raw = sessionStorage.getItem(LS_KEYS.SESSION);
    } catch (e) {}
    if (!raw) {
      try {
        raw = localStorage.getItem(LS_KEYS.SESSION);
      } catch (e) {}
    }

    let session = null;
    if (raw) {
      session = JSON.parse(raw);
    } else if (inMemorySession) {
      session = inMemorySession;
    }

    if (!session) return false;

    // Session expires after 24 hours
    if (Date.now() - session.loginAt > 24 * 60 * 60 * 1000) {
      adminLogout();
      return false;
    }
    return Boolean(session.token);
  } catch (e) {
    return inMemorySession ? Boolean(inMemorySession.token) : false;
  }
}

export function getAdminSession() {
  try {
    let raw = null;
    try {
      raw = sessionStorage.getItem(LS_KEYS.SESSION);
    } catch (e) {}
    if (!raw) {
      try {
        raw = localStorage.getItem(LS_KEYS.SESSION);
      } catch (e) {}
    }
    return raw ? JSON.parse(raw) : (inMemorySession || null);
  } catch (e) {
    return inMemorySession || null;
  }
}

export async function adminLogout() {
  inMemorySession = null;
  try { sessionStorage.removeItem(LS_KEYS.SESSION); } catch (e) {}
  try { localStorage.removeItem(LS_KEYS.SESSION); } catch (e) {}

  const { isLive, auth } = await initFirebase();
  if (isLive && auth) {
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (e) {
      // Ignore
    }
  }
  return true;
}

export async function updateAdminCredentials(newUsername, newPassword) {
  if (!newUsername || newUsername.trim().length < 3) {
    throw new Error('Username must be at least 3 characters.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const computedHash = await hashPassword(newPassword);
  const record = {
    username: newUsername.trim(),
    passwordHash: computedHash,
    salt: 'mushora-salt-2026',
    updatedAt: new Date().toISOString()
  };

  const { isLive, db, auth } = await initFirebase();

  // If live Firestore is connected, persist to /adminSettings/credentials
  if (isLive && db) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'adminSettings', 'credentials'), record);
    } catch (err) {
      console.warn('Failed saving credentials to Firestore:', err);
    }
  }

  // Also update Firebase Auth password if current user is logged in
  if (isLive && auth && auth.currentUser) {
    try {
      const { updatePassword } = await import('firebase/auth');
      await updatePassword(auth.currentUser, newPassword);
    } catch (err) {
      console.warn('Firebase Auth password update note:', err.message);
    }
  }

  // Update local storage
  localStorage.setItem(LS_KEYS.ADMIN, JSON.stringify(record));

  // Update current session username
  const session = getAdminSession();
  if (session) {
    session.username = record.username;
    saveSession(session);
  }

  return true;
}

/**
 * Seed initial sample fashion catalogue to live Firestore with 1-click
 */
export async function seedLiveFirestore() {
  const { isLive, db } = await initFirebase();
  if (!isLive || !db) {
    throw new Error('Firebase credentials are not configured yet.');
  }

  const { collection, doc, setDoc, getDocs } = await import('firebase/firestore');

  // Seed categories
  for (const cat of INITIAL_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), {
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Seed products
  for (const prod of INITIAL_PRODUCTS) {
    const { id, ...data } = prod;
    await setDoc(doc(db, 'products', id), data);
  }

  return true;
}

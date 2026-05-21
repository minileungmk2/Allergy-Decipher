/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Barcode, 
  History, 
  PieChart, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  Info, 
  Smile, 
  Frown, 
  Search, 
  Camera, 
  X,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Microscope,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import appLogo from './assets/images/AllerScan Logo.jpeg';

// --- Transparent Image Helper Component to remove White Background dynamically ---
const TransparentImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(({ src, alt, className, ...props }, ref) => {
  const [processedSrc, setProcessedSrc] = useState<string>("");

  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessedSrc(src);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Remove white or near-white background pixels smoothly using alpha blending
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          
          if (a === 0) continue;

          const threshold = 230;
          if (r > threshold && g > threshold && b > threshold) {
            const maxVal = Math.max(r, g, b);
            const factor = (255 - maxVal) / (255 - threshold);
            data[i + 3] = Math.min(a, Math.round(a * Math.pow(factor, 1.5)));
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        setProcessedSrc(canvas.toDataURL("image/png"));
      } catch (e) {
        console.error("Canvas transparency process failed:", e);
        setProcessedSrc(src);
      }
    };
    img.onerror = () => {
      setProcessedSrc(src);
    };
    img.src = src;
  }, [src]);

  return (
    <img 
      ref={ref}
      src={processedSrc || src} 
      alt={alt} 
      className={className} 
      referrerPolicy="no-referrer"
      {...props} 
    />
  );
});

TransparentImage.displayName = 'TransparentImage';

const MotionTransparentImage = motion(TransparentImage);

// --- Types ---

interface Profile {
  id: string;
  name: string;
  icon: string;
  color: string;
  image?: string;
}

interface ProductLog {
  id: string;
  profileId: string;
  name: string;
  brand: string;
  barcode: string;
  ingredientsText: string;
  ingredientsList: string[];
  allergens: string[];
  image: string;
  reaction: boolean;
  date: string;
  notes?: string;
}

interface SuspectIngredient {
  ingredient: string;
  count: number;
  percentage: number;
  reactedCount?: number;
  safeCount?: number;
  reasoning?: string;
}

// --- Constants ---

const INITIAL_PROFILES: Profile[] = [
  { id: '1', name: 'Little One', icon: 'child', color: 'bg-orange-100 text-orange-500 hover:bg-orange-200' },
  { id: '2', name: 'Grown Up', icon: 'user', color: 'bg-sky-100 text-sky-600 hover:bg-sky-200' }
];

// --- Sub-components ---

const Header = ({ onShowAbout, onLogout, showLogout, saveStatus, onRetry, errorDetails }: { 
  onShowAbout: () => void, 
  onLogout: () => void, 
  showLogout: boolean, 
  saveStatus: 'idle' | 'saving' | 'saved' | 'error', 
  onRetry?: () => void,
  errorDetails?: string | null
}) => (
  <header className="h-20 flex items-center justify-between px-6 bg-white border-b border-orange-50 sticky top-0 z-50 rounded-b-[2rem] shadow-sm">
    <div className="flex items-center gap-3">
      <TransparentImage 
        src={appLogo} 
        alt="AllerScan logo" 
        className="w-12 h-12 object-contain bounce-animation"
      />
      <div className="flex flex-col max-w-[150px] sm:max-w-none">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 leading-none">AllerScan</h1>
        <AnimatePresence mode="wait">
          {saveStatus === 'saving' && (
            <motion.span 
              key="saving"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] font-black text-sky-500 uppercase tracking-tighter mt-1"
            >
              Syncing...
            </motion.span>
          )}
          {saveStatus === 'saved' && (
            <motion.span 
              key="saved"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mt-1"
            >
              Synced!
            </motion.span>
          )}
          {saveStatus === 'error' && (
            <button 
              key="error"
              onClick={onRetry}
              className="text-[10px] font-black text-orange-500 uppercase tracking-tighter mt-1 flex flex-col items-start gap-0.5 hover:bg-orange-50 rounded px-1 -ml-1 transition-colors"
            >
              <span>Sync Error! Tap to retry</span>
              {errorDetails && <span className="text-[8px] normal-case text-orange-400 truncate w-full">{errorDetails}</span>}
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
    <div className="flex items-center gap-4">
      {showLogout && (
        <button onClick={onLogout} className="text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-1 text-xs font-bold font-sans">
          <LogOut className="w-4 h-4" />
          <span>Bye-bye</span>
        </button>
      )}
      <button onClick={onShowAbout} className="bg-sky-50 text-sky-500 p-2.5 rounded-2xl hover:bg-sky-100 transition-colors">
        <Info className="w-5 h-5" />
      </button>
    </div>
  </header>
);

const NavButton = ({ active, onClick, icon: Icon, label, customIcon }: { active: boolean, onClick: () => void, icon?: any, label: string, customIcon?: boolean }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center transition-all duration-300 ${active ? 'text-orange-500' : 'text-slate-300 hover:text-slate-400'}`}
  >
    {customIcon ? (
      <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center -mt-12 shadow-xl transition-all bouncy ${active ? 'bg-orange-500 text-white scale-110' : 'bg-white text-slate-300 border-4 border-orange-50'}`}>
        <Barcode className="w-8 h-8" />
      </div>
    ) : (
      <div className={`p-3 rounded-2xl transition-all ${active ? 'bg-orange-50' : ''}`}>
        <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''}`} />
      </div>
    )}
    <span className={`text-[11px] font-bold tracking-wide mt-2 ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

// --- Allergen Detection and Normalization Helpers ---

const TYPICAL_ALLERGENS = [
  'wheat', 'gluten', 'milk', 'dairy', 'egg', 'eggs', 'soy', 'soya', 'peanut', 'peanuts', 
  'almond', 'walnut', 'pecan', 'cashew', 'hazelnut', 'sesame', 'fish', 'shellfish', 
  'shrimp', 'crab', 'lobster', 'crustacean', 'mustard', 'celery', 'lupin', 'sulphites',
  'sulfites', 'sulfur dioxide', 'barley', 'rye', 'oats', 'macadamia', 'pistachio',
  'lactose', 'whey', 'casein', 'hazelnuts', 'almonds', 'cashews', 'walnuts'
];

const COMMON_FILLERS = [
  'water', 'salt', 'sea salt', 'sugar', 'cane sugar', 'citric acid', 'ascorbic acid', 
  'carbon dioxide', 'filtered water', 'vitamin c', 'calcium carbonate', 'gum', 
  'natural flavor', 'natural flavoring', 'artificial flavor', 'artificial flavoring',
  'lecithin', 'sunflower lecithin', 'soy lecithin', 'pectin', 'yeast', 'baking powder',
  'baking soda', 'sodium bicarbonate'
];

const normalizeIngredientName = (name: string): string => {
  let cleaned = name.toLowerCase().trim();
  
  // Strip common packaging / status prefixes
  const prefixes = [
    /\borganic\b/g, /\bfreeze-dried\b/g, /\bfreeze dried\b/g, /\bdried\b/g,
    /\bconcentrate\b/g, /\bconcentrated\b/g, /\bpowder\b/g, /\bpowdered\b/g,
    /\bwhole\b/g, /\bsliced\b/g, /\bslices\b/g, /\braw\b/g, /\bpure\b/g,
    /\bwild\b/g, /\bground\b/g, /\bcrushed\b/g, /\bcooked\b/g, /\bextract\b/g,
    /\bjuice\b/g, /\bpaste\b/g, /\bsyrup\b/g, /\bflour\b/g, /\bstarch\b/g,
    /\bhealthy\b/g, /\bgrown\b/g, /\brefining\b/g, /\brefined\b/g,
    /\bfresh\b/g, /\bnatural\b/g, /\bpurified\b/g, /\bsweetened\b/g,
    /\bunsweetened\b/g, /\btoasted\b/g, /\broasted\b/g, /\bpasteurized\b/g,
    /\bvitamin\s+[a-z0-9]+\b/g, /\bvitamins\b/g, /\bfortified\b/g,
    /\bwith\s+added\b/g
  ];
  
  prefixes.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' ');
  });
  
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Plural to singular rules
  if (cleaned.endsWith('s') && !cleaned.endsWith('ss') && !cleaned.endsWith('us') && !cleaned.endsWith('is') && !cleaned.endsWith('as')) {
    if (cleaned.endsWith('ies')) {
      cleaned = cleaned.slice(0, -3) + 'y';
    } else if (cleaned.endsWith('es') && (cleaned.endsWith('ches') || cleaned.endsWith('shes') || cleaned.endsWith('xes'))) {
      cleaned = cleaned.slice(0, -2);
    } else {
      cleaned = cleaned.slice(0, -1);
    }
  }
  
  return cleaned.trim();
};

const isTypicalAllergen = (ingredient: string): boolean => {
  const norm = ingredient.toLowerCase().trim();
  return TYPICAL_ALLERGENS.some(allergen => norm.includes(allergen) || allergen.includes(norm));
};

const DEFAULT_HISTORY_SEED: ProductLog[] = [
  // Profile '1' (Little One) - milk is the secret culprit
  {
    id: 'seed-ko-1',
    profileId: '1',
    date: '2026-05-19',
    reaction: true,
    name: 'Oatmeal Milk Cookie',
    brand: 'NurtureKids',
    barcode: '4101230001',
    ingredientsText: 'organic rolled oats, whole wheat flour, cow milk, soy lecithin, cane sugar, palm oil',
    ingredientsList: ['oats', 'wheat', 'milk', 'soy lecithin', 'sugar', 'palm oil'],
    allergens: ['wheat', 'milk', 'soy'],
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=300&q=80',
    notes: 'Developed red blotches on cheeks about 12 minutes after eating'
  },
  {
    id: 'seed-ko-2',
    profileId: '1',
    date: '2026-05-18',
    reaction: false,
    name: 'Organic Wheat Spaghetti',
    brand: 'LaPasta',
    barcode: '8001230002',
    ingredientsText: 'organic semolina durum wheat, water, olive oil, tomato paste, salt',
    ingredientsList: ['wheat', 'water', 'olive oil', 'tomato paste', 'salt'],
    allergens: ['wheat'],
    image: 'https://images.unsplash.com/photo-1516100882582-76c9a386591c?auto=format&fit=crop&w=300&q=80',
    notes: 'Ate a whole bowl happily. Active and happy all night.'
  },
  {
    id: 'seed-ko-3',
    profileId: '1',
    date: '2026-05-17',
    reaction: true,
    name: 'Buttermilk Pancakes',
    brand: 'FluffyMornings',
    barcode: '0123456789',
    ingredientsText: 'wheat flour, skimmed milk powder, eggs, butter, raising agents, salt, water',
    ingredientsList: ['wheat', 'milk', 'eggs', 'butter', 'raising agents', 'salt', 'water'],
    allergens: ['wheat', 'milk', 'eggs'],
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=300&q=80',
    notes: 'Complained of tummy-ache and reflux. Refused to run.'
  },
  {
    id: 'seed-ko-4',
    profileId: '1',
    date: '2026-05-16',
    reaction: false,
    name: 'Fluffy Scrambled Eggs',
    brand: 'Homegrown Farm',
    barcode: 'MANUAL',
    ingredientsText: 'fresh eggs, butter, sea salt, pepper',
    ingredientsList: ['eggs', 'butter', 'salt', 'pepper'],
    allergens: ['eggs'],
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=300&q=80',
    notes: 'Eaten with spoon. No complaints, went to sleep peacefully.'
  },
  {
    id: 'seed-ko-5',
    profileId: '1',
    date: '2026-05-15',
    reaction: true,
    name: 'Double Cocoa Hot Chocolate',
    brand: 'SweetMornings',
    barcode: '4101230005',
    ingredientsText: 'raw cocoa powder, sweet whey powder, whole milk powder, vanilla bean, cane sugar, salt',
    ingredientsList: ['cocoa powder', 'whey powder', 'milk', 'vanilla', 'sugar', 'salt'],
    allergens: ['milk'],
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=300&q=80',
    notes: 'Gassy and restless sleep after evening cup.'
  },

  // Profile '2' (Grown Up) - peanuts is the secret culprit
  {
    id: 'seed-gu-1',
    profileId: '2',
    date: '2026-05-19',
    reaction: true,
    name: 'Crunchy Peanut Butter Granola',
    brand: 'NatureValley',
    barcode: '4101230006',
    ingredientsText: 'whole wheat flakes, honey, roasted peanuts, almond bits, coconut syrup',
    ingredientsList: ['wheat', 'honey', 'peanuts', 'almond', 'coconut syrup'],
    allergens: ['peanuts', 'almonds'],
    image: 'https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&w=300&q=80',
    notes: 'Tongue felt tingly almost immediately. Throat slightly itchy.'
  },
  {
    id: 'seed-gu-2',
    profileId: '2',
    date: '2026-05-18',
    reaction: false,
    name: 'Almond Honey Cookies',
    brand: 'NutriBakes',
    barcode: '4101230007',
    ingredientsText: 'almond flour, organic honey, butter, milk powder, salt, chocolate chips',
    ingredientsList: ['almond', 'honey', 'butter', 'milk powder', 'salt', 'chocolate chips'],
    allergens: ['nuts', 'milk'],
    image: 'https://images.unsplash.com/photo-1558961309-db0114464f7e?auto=format&fit=crop&w=300&q=80',
    notes: 'Felt vibrant! Excellent evening jog.'
  },
  {
    id: 'seed-gu-3',
    profileId: '2',
    date: '2026-05-17',
    reaction: true,
    name: 'Salty Satay Pad Thai Box',
    brand: 'NoodleBox',
    barcode: '4101230008',
    ingredientsText: 'rice noodles, peanut oil, garlic, soy sauce, tamarind pulp, crushed peanuts, sugar',
    ingredientsList: ['rice noodles', 'peanut oil', 'garlic', 'soy sauce', 'peanuts', 'sugar'],
    allergens: ['peanuts', 'soy'],
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=300&q=80',
    notes: 'Developed hives, had to use antihistamines.'
  }
];

// --- Main Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'login' | 'profile' | 'scan' | 'history' | 'analysis'>('login');
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [history, setHistory] = useState<ProductLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Partial<ProductLog> | null>(null);
  const [scannerMode, setScannerMode] = useState<'capture' | 'auto'>('capture');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [shutterActive, setShutterActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [analysisResults, setAnalysisResults] = useState<SuspectIngredient[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const startLongPress = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressedId(id);
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Profile Editor State
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');

  // Manual Form State
  const [manualName, setManualName] = useState('');
  const [manualIngredients, setManualIngredients] = useState('');
  const [manualReaction, setManualReaction] = useState(false);
  const [manualNotes, setManualNotes] = useState('');

  // Scanning Result State
  const [scanNotes, setScanNotes] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogNotes, setEditLogNotes] = useState('');

  // Sorting, Filtering & Detail Modal State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_notes' | 'scanned' | 'manual'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---

    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [fetchError, setFetchError] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
    // --- Persistence Handlers ---
  
    const fetchData = async () => {
      try {
        setFetchError(false);
        setErrorDetails(null);
        console.log("Fetching data from /api/data...");
        const response = await fetch(`/api/data?t=${Date.now()}`, {
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error("Non-JSON response received:", text.substring(0, 200));
          throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 50)}...`);
        }
        
        if (response.ok) {
          console.log("Data fetched from server successfully", data);
          
          let loadedProfiles = INITIAL_PROFILES;
          let loadedHistory = [];

          if (Array.isArray(data.profiles)) {
            if (data.profiles.length === 0 && (data.history === null || (Array.isArray(data.history) && data.history.length === 0))) {
              console.log("App looks new, or empty database.");
            } else {
              loadedProfiles = data.profiles;
            }
          } else if (data.profiles !== null && data.profiles !== undefined) {
             console.warn("Profiles in KV is not an array:", data.profiles);
          }
  
          if (Array.isArray(data.history) && data.history.length > 0) {
            loadedHistory = data.history;
          } else {
            console.log("Empty history on backend. Seeding with high-fidelity triangulation demo data...");
            loadedHistory = DEFAULT_HISTORY_SEED;
            // Persist the default seed on backend
            saveData(loadedProfiles, loadedHistory);
          }
  
          setProfiles(loadedProfiles);
          setHistory(loadedHistory);
          setIsDataLoaded(true);
        } else {
          console.error("Server error during fetch", response.status, data);
          setFetchError(true);
          setErrorDetails(data.message || data.error || `Status: ${response.status}`);
        }
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        setFetchError(true);
        setErrorDetails(error.message || String(error));
      }
    };

  const saveData = async (p: Profile[], h: ProductLog[]) => {
    setSaveStatus('saving');
    setErrorDetails(null);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles: p, history: h })
      });
      
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setErrorDetails(data?.message || data?.error || `Server Error (${res.status})`);
      }
    } catch (error: any) {
      setSaveStatus('error');
      setErrorDetails(error.message || String(error));
      console.error("Failed to save data:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Save on changes (debounced)
  useEffect(() => {
    if (!isDataLoaded) return;
    const timeout = setTimeout(() => {
      saveData(profiles, history);
    }, 800); // Faster debounce for better mobile feel
    return () => clearTimeout(timeout);
  }, [profiles, history, isDataLoaded]);

  const handleLogin = (profile: Profile) => {
    setActiveProfile(profile);
    setActiveTab('profile');
  };

  const handleLogout = () => {
    setActiveProfile(null);
    setActiveTab('login');
    stopScanner();
  };

  const handleAddProfile = () => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name: 'New Friend',
      icon: 'user',
      color: 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
    };
    setProfiles([...profiles, newProfile]);
    setEditingProfile(newProfile);
    setEditName('New Friend');
    setEditImage('');
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    const newProfiles = profiles.filter(p => p.id !== confirmDeleteId);
    setProfiles(newProfiles);
    setHistory(history.filter(h => h.profileId !== confirmDeleteId));
    if (activeProfile?.id === confirmDeleteId) handleLogout();
    setConfirmDeleteId(null);
  };

  const handleUpdateProfile = () => {
    if (!editingProfile) return;
    const updatedProfiles = profiles.map(p => 
      p.id === editingProfile.id ? { ...p, name: editName, image: editImage } : p
    );
    setProfiles(updatedProfiles);
    if (activeProfile?.id === editingProfile.id) {
      setActiveProfile({ ...activeProfile, name: editName, image: editImage });
    }
    setEditingProfile(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const stopVideoStream = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error("Failed to stop track:", e);
        }
      });
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const startVideoStream = async () => {
    stopVideoStream();
    setCameraError(null);
    setScannedProduct(null);

    try {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStreamRef.current = stream;
      setScanning(true);

      // Force video play on ref mount
      let attempts = 0;
      const bindStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video stream playback failure", e));
        } else if (attempts < 15) {
          attempts++;
          setTimeout(bindStream, 150);
        }
      };
      bindStream();

    } catch (err: any) {
      console.error("Custom video hardware acquisition failed:", err);
      let msg = "Failed to access camera.";
      if (err?.name === "NotAllowedError" || err?.message?.includes("Permission")) {
        msg = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err?.name === "NotFoundError" || err?.message?.includes("NotFound")) {
        msg = "No environment / back camera found.";
      } else if (err?.message) {
        msg = err.message;
      }
      setCameraError(msg);
      setScanning(false);
    }
  };

  const startScanner = async (retryCount = 0) => {
    if (scannerMode === 'capture') {
      await startVideoStream();
      return;
    }

    // Auto scan mode implementation
    stopVideoStream();
    if (scanner) return;
    setCameraError(null);
    
    // Check if element is mounted via Ref
    if (!scannerRef.current) {
      if (retryCount < 15) {
        setTimeout(() => startScanner(retryCount + 1), 150);
      } else {
        console.error("Scanner ref not found after retries");
        setCameraError("Camera target not ready. Please try again.");
      }
      return;
    }

    setScanning(true);
    setScannedProduct(null);
    
    try {
      // Use the ref element ID or the element itself if supported (ID is safer for this lib)
      const elementId = scannerRef.current.id || "reader";
      
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.ITF
      ];

      const newScanner = new Html5Qrcode(elementId, {
        formatsToSupport,
        verbose: false
      });
      setScanner(newScanner);

      const cameras = await Html5Qrcode.getCameras().catch(() => []);
      console.log("Cameras detected:", cameras);

      const config = { 
        fps: 20, 
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // A wide and thin box is most optimal for scanning 1D barcodes on mobile devices
          const scanWidth = Math.floor(viewfinderWidth * 0.85);
          const scanHeight = Math.floor(viewfinderHeight * 0.45);
          return {
            width: scanWidth > 320 ? 320 : scanWidth,
            height: scanHeight > 180 ? 180 : scanHeight
          };
        },
        // iOS Safari specifics:
        videoConstraints: {
          facingMode: "environment",
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 }
        }
      };

      await newScanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          fetchProduct(decodedText);
          newScanner.stop().then(() => {
            newScanner.clear(); // Clean up DOM
            setScanner(null);
            setScanning(false);
          }).catch(err => console.error("Failed to stop scanner", err));
        },
        () => {} 
      );
    } catch (err: any) {
      console.error("Scanner failed to start", err);
      let msg = "Failed to access camera.";
      if (err?.message?.includes("Permission")) msg = "Camera permission denied.";
      else if (err?.message?.includes("NotFound")) msg = "No camera found.";
      else if (err?.message) msg = err.message;
      
      setCameraError(msg);
      setScanning(false);
      setScanner(null);
    }
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.stop().then(() => {
        scanner.clear();
      }).catch(() => {});
      setScanner(null);
    }
    setScanning(false);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    setScanError(null);

    // Trigger visual capture flash
    setShutterActive(true);
    setTimeout(() => setShutterActive(false), 200);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Capture at camera stream's natural native resolutions for crystal clarity
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not acquire 2D drawing context.");
      }
      
      // Draw frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob and trigger Html5Qrcode scanFile
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsCapturing(false);
          setScanError("Oops! Failed to capture picture snapshot. Please try again.");
          return;
        }

        const imageFile = new File([blob], "picture-barcode.png", { type: "image/png" });

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.ITF
        ];

        try {
          const tempScanner = new Html5Qrcode("hidden-reader", {
            formatsToSupport,
            verbose: false
          });

          tempScanner.scanFile(imageFile, false)
            .then(async (decodedText) => {
              console.log("Barcode match found on frozen frame:", decodedText);
              
              try {
                await tempScanner.clear();
              } catch (_) {}

              // Stop camera and trigger the search automatically
              stopVideoStream();
              setIsCapturing(false);
              await fetchProduct(decodedText);
            })
            .catch(async (err) => {
              console.warn("Scan mismatch/failure on static image:", err);
              
              try {
                await tempScanner.clear();
              } catch (_) {}

              setScanError("No barcode detected. Ensure the code is centered and illuminated, then click Capture again.");
              setIsCapturing(false);
            });
        } catch (err: any) {
          console.error("Temporary scanner instantiation failed:", err);
          setScanError("Scanner start failure: " + (err.message || err));
          setIsCapturing(false);
        }
      }, "image/png");

    } catch (err: any) {
      console.error("Canvas snapshot error:", err);
      setScanError("Failed to freeze camera frame. Please try again.");
      setIsCapturing(false);
    }
  };

  const fetchProduct = async (barcode: string) => {
    setLoading(true);
    setScannedProduct(null);
    setScanError(null);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1) {
        const product = data.product;
        let ingredientsArray: string[] = [];
        
        if (product.ingredients_text) {
          ingredientsArray = product.ingredients_text
            .replace(/[0-9]+%/g, '')
            .replace(/[\(\)\[\]]/g, ',')
            .toLowerCase()
            .split(',')
            .map((i: string) => i.trim().replace(/^[*\-.\s]+|[*\-.\s]+$/g, ''))
            .filter((i: string) => i.length > 2);
        }

        setScannedProduct({
          barcode,
          name: product.product_name || "Unknown Product",
          brand: product.brands || "Unknown Brand",
          ingredientsText: product.ingredients_text || "Ingredients not listed.",
          ingredientsList: ingredientsArray,
          allergens: product.allergens_tags ? product.allergens_tags.map((a: string) => a.replace('en:', '').replace(/-/g, ' ')) : [],
          image: product.image_front_small_url || product.image_front_url || product.image_small_url || product.image_url || product.image_thumb_url || ""
        });
      } else {
        setScanError(`Product with code "${barcode}" was not found. Please try entering it manually! Check spelling or use other barcodes.`);
      }
    } catch (err) {
      setScanError("Oops! Failed to connect to product info directory. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const logConsumption = (reaction: boolean) => {
    if (!scannedProduct || !activeProfile) return;

    const newLog: ProductLog = {
      id: Date.now().toString(),
      profileId: activeProfile.id,
      date: new Date().toLocaleDateString(),
      reaction,
      notes: scanNotes,
      ...(scannedProduct as ProductLog)
    };

    setHistory([newLog, ...history]);
    setScannedProduct(null);
    setScanNotes('');
    setActiveTab('history');
  };

  const handleManualAdd = () => {
    if (!manualName || !manualIngredients || !activeProfile) return;

    const ingredientsList = manualIngredients
      .split(',')
      .map(i => i.trim().toLowerCase())
      .filter(i => i.length > 0);

    const newLog: ProductLog = {
      id: Date.now().toString(),
      profileId: activeProfile.id,
      date: new Date().toLocaleDateString(),
      reaction: manualReaction,
      name: manualName,
      brand: "Manual Entry",
      barcode: "MANUAL",
      ingredientsText: manualIngredients,
      ingredientsList,
      allergens: [],
      image: "",
      notes: manualNotes
    };

    setHistory([newLog, ...history]);
    setShowManualAdd(false);
    setManualName('');
    setManualIngredients('');
    setManualReaction(false);
    setManualNotes('');
    setActiveTab('history');
  };

  const handleUpdateLogNotes = () => {
    if (!editingLogId) return;
    const newHistory = history.map(h => 
      h.id === editingLogId ? { ...h, notes: editLogNotes } : h
    );
    setHistory(newHistory);
    setEditingLogId(null);
    setEditLogNotes('');
  };

  const runAnalysis = () => {
    if (!activeProfile) return;
    
    setAnalysisError(null);
    const profileHistory = history.filter(h => h.profileId === activeProfile.id);
    const reactedLogs = profileHistory.filter(h => h.reaction);
    const safeLogs = profileHistory.filter(h => !h.reaction);

    if (reactedLogs.length === 0) {
      setAnalysisError("no_reactions");
      setAnalysisResults([]);
      return;
    }

    const hasIngredients = reactedLogs.some(log => log.ingredientsList && log.ingredientsList.length > 0);
    if (!hasIngredients) {
      setAnalysisError("no_ingredients");
      setAnalysisResults([]);
      return;
    }

    const suspectCounts: Record<string, { reactedCount: number, safeCount: number, originalNames: Set<string> }> = {};
    
    reactedLogs.forEach((log: ProductLog) => {
      const uniqueNormalized = new Set<string>();
      (log.ingredientsList || []).forEach((ing: string) => {
        const norm = normalizeIngredientName(ing);
        if (norm.length > 1) {
          uniqueNormalized.add(norm);
          if (!suspectCounts[norm]) {
            suspectCounts[norm] = { reactedCount: 0, safeCount: 0, originalNames: new Set<string>() };
          }
          suspectCounts[norm].originalNames.add(ing);
        }
      });
      uniqueNormalized.forEach(norm => {
        suspectCounts[norm].reactedCount += 1;
      });
    });

    safeLogs.forEach((log: ProductLog) => {
      const uniqueNormalized = new Set<string>();
      (log.ingredientsList || []).forEach((ing: string) => {
        const norm = normalizeIngredientName(ing);
        if (norm.length > 1) {
          uniqueNormalized.add(norm);
        }
      });
      uniqueNormalized.forEach(norm => {
        if (suspectCounts[norm]) {
          suspectCounts[norm].safeCount += 1;
        }
      });
    });

    const results = Object.keys(suspectCounts)
      .map(normIng => {
        const { reactedCount, safeCount, originalNames } = suspectCounts[normIng];
        
        // Base scoring logic: start with ratio of reacted vs overall
        // Ouchie appearances VS safe appearances
        const penaltyValue = safeCount * 2.5; 
        let rawScore = (reactedCount / (reactedCount + penaltyValue)) * 100;
        
        // Confidence modifier for data point volume:
        // A single log doesn't yet form a reliable trend, so we soften its initial confidence
        const confidenceWeight = reactedCount === 1 ? 0.5 : reactedCount === 2 ? 0.85 : 1.0;
        let score = rawScore * confidenceWeight;
        
        // Strip common fillers or low allergen additives (water, citric acid, salt etc.)
        const isCommonFiller = COMMON_FILLERS.includes(normIng) || 
          COMMON_FILLERS.some(filler => normIng.includes(filler));
          
        if (isCommonFiller) {
          score *= 0.15; // heavily scale down common safe food additives
        }
        
        const finalPercentage = Math.round(score);

        // Generate Human reasoning based on cross-checking
        let reasoning = '';
        if (isCommonFiller) {
          reasoning = `Common food filler/additive. Low generic risk, but tracked for completeness.`;
        } else if (reactedCount === 1) {
          reasoning = `Seen in 1 ouchie meal. Needs more cross-checks to establish absolute confidence.`;
        } else if (safeCount === 0) {
          reasoning = `Strong trend: Exclusively in ${reactedCount}x ouchies and NEVER eaten safely. Primary suspect!`;
        } else if (safeCount >= reactedCount) {
          reasoning = `Unlikely suspect: Consumed safely ${safeCount}x vs ${reactedCount}x ouchies.`;
        } else {
          reasoning = `Moderate suspect: Consumed safely ${safeCount}x, but triggered reactions ${reactedCount}x. Potential trigger.`;
        }

        // Use the most common original name for display, or capitalized normalized
        const displayList = Array.from(originalNames);
        const displayLabel = displayList.length > 0 
          ? displayList.sort((a,b) => a.length - b.length)[0] 
          : normIng;

        return {
          ingredient: displayLabel,
          count: reactedCount,
          percentage: finalPercentage,
          reactedCount,
          safeCount,
          reasoning
        };
      })
      // Filter out elements with 0% risk to keep insights clean, unless user explicitly has very few entries
      .filter(item => item.percentage > 0 || history.length < 5)
      .sort((a, b) => b.percentage - a.percentage || b.count - a.count)
      .slice(0, 12);

    setAnalysisResults(results);
    if (results.length === 0) {
      setAnalysisError("no_suspects");
    }
  };

  const getStats = () => {
    const profileHistory = history.filter(h => h.profileId === activeProfile?.id);
    return {
      total: profileHistory.length,
      reactions: profileHistory.filter(h => h.reaction).length,
      safe: profileHistory.filter(h => !h.reaction).length
    };
  };

  useEffect(() => {
    if (activeTab === 'scan') {
      if (scannerMode === 'capture') {
        stopScanner();
        startVideoStream();
      } else {
        stopVideoStream();
        startScanner();
      }
    } else {
      stopScanner();
      stopVideoStream();
    }
    // Clean up on component unmount
    return () => {
      stopScanner();
      stopVideoStream();
    };
  }, [activeTab, scannerMode]);

  // Trigger analysis automatically on tab change, profile change, or history updates to keep insights fully in sync
  useEffect(() => {
    if (activeTab === 'analysis' && activeProfile) {
      runAnalysis();
    }
  }, [activeTab, activeProfile, history]);

  // --- Views ---

  const LoginView = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 relative">
      <MotionTransparentImage 
        initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ 
          duration: 0.6, 
          type: 'spring', 
          bounce: 0.6 
        }}
        src={appLogo}
        alt="AllerScan Logo"
        className="w-56 h-56 object-contain mb-8"
      />
      <h2 className="text-4xl font-bold text-slate-800 mb-3">Hi there!</h2>
      <p className="text-lg font-medium text-slate-400 mb-12">Who's checking today?</p>
      
      <div className="grid grid-cols-2 gap-6 w-full max-w-sm mb-12">
        {profiles.map(profile => (
            <motion.div
              key={profile.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
              onTouchStart={() => startLongPress(profile.id)}
              onTouchEnd={cancelLongPress}
              onContextMenu={(e) => {
                if (window.innerWidth < 768) e.preventDefault();
              }}
            >
              <motion.button
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (longPressedId === profile.id) {
                    setLongPressedId(null);
                  } else {
                    handleLogin(profile);
                  }
                }}
                className={`w-full bg-white p-8 rounded-[2.5rem] border-2 flex flex-col items-center gap-4 shadow-xl shadow-slate-100 transition-all relative overflow-hidden ${longPressedId === profile.id ? 'border-sky-200 ring-4 ring-sky-50' : 'border-slate-50'}`}
              >
                <div className={`w-16 h-16 ${profile.color} rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner relative overflow-hidden`}>
                  {profile.image ? (
                    <img src={profile.image} className="w-full h-full object-cover" alt={profile.name} />
                  ) : (
                    <UserIcon className="w-8 h-8" />
                  )}
                </div>
                <span className="text-lg font-bold text-slate-700 truncate w-full text-center px-2">{profile.name}</span>
              </motion.button>
              
              <AnimatePresence>
                {(longPressedId === profile.id || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className={`absolute top-3 right-3 flex gap-2 z-20 ${longPressedId === profile.id ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} transition-opacity`}
                  >
                    {longPressedId === profile.id && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLongPressedId(null);
                        }}
                        className="p-3 bg-white shadow-xl rounded-2xl text-slate-400 hover:bg-slate-50 transition-colors border border-slate-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setLongPressedId(null);
                        setEditingProfile(profile);
                        setEditName(profile.name);
                        setEditImage(profile.image || '');
                      }}
                      className="p-3 bg-white shadow-xl rounded-2xl text-sky-500 hover:bg-sky-50 transition-colors border border-sky-50"
                      title="Edit Friend"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setLongPressedId(null);
                        handleDeleteProfile(profile.id, e);
                      }}
                      className="p-3 bg-white shadow-xl rounded-2xl text-orange-500 hover:bg-orange-50 transition-colors border border-orange-50"
                      title="Remove Friend"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAddProfile}
        className="flex items-center gap-3 bg-white px-8 py-4 rounded-[1.5rem] shadow-lg border border-slate-50 text-slate-400 hover:text-sky-500 transition-all group"
      >
        <div className="w-8 h-8 bg-slate-50 flex items-center justify-center rounded-xl group-hover:bg-sky-50 transition-colors">
          <Plus className="w-5 h-5" />
        </div>
        <span className="text-sm font-bold">Add New Friend</span>
      </motion.button>
    </div>
  );

  const DashboardView = () => {
    const stats = getStats();
    return (
      <div className="space-y-8 py-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[3rem] p-10 text-center border border-slate-100 shadow-xl shadow-slate-100 relative group"
        >
          <div className="w-28 h-28 bg-sky-50 text-sky-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10 overflow-hidden">
            {activeProfile?.image ? (
              <img src={activeProfile.image} className="w-full h-full object-cover" alt={activeProfile.name} />
            ) : (
              <UserIcon className="w-14 h-14" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2 relative z-10">{activeProfile?.name}'s Box</h2>
          <p className="text-lg font-medium text-slate-400 relative z-10">Keep it safe & happy!</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-sky-50/50 p-8 rounded-[2.5rem] border border-sky-100 flex flex-col items-center">
            <span className="text-5xl font-bold text-sky-500 mb-3">{stats.total}</span>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Yummy Logs</span>
          </div>
          <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-100 flex flex-col items-center">
            <span className="text-5xl font-bold text-orange-500 mb-3">{stats.reactions}</span>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Ouchies</span>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('scan')}
          className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-6 rounded-[2.5rem] shadow-xl shadow-orange-100 transition-all bouncy flex items-center justify-center gap-4 text-xl"
        >
          <Barcode className="w-8 h-8" />
          Check Something!
        </button>

        <div className="pt-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 px-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-2xl flex items-center justify-center">
              <History className="w-6 h-6 text-yellow-500" />
            </div>
            Last Eats
          </h3>
          <div className="space-y-4">
            {history.filter(h => h.profileId === activeProfile?.id).slice(0, 3).map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:shadow-lg hover:border-sky-100 transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${item.reaction ? 'bg-orange-50' : 'bg-sky-50'}`}>
                     {item.reaction ? <Frown className="w-7 h-7 text-orange-400" /> : <Smile className="w-7 h-7 text-sky-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h4>
                    <p className="text-sm font-bold text-slate-300 mt-1">{item.date}</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-orange-400 transition-all transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ScannerView = () => (
    <div className="space-y-8">
      {/* Premium Segmented Scanner Mode Toggle */}
      <div className="bg-slate-150 p-1.5 rounded-[2.2rem] flex max-w-md mx-auto shadow-inner border border-slate-200/40 relative">
        <button
          onClick={() => setScannerMode('capture')}
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-[1.7rem] text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            scannerMode === 'capture'
              ? 'bg-white text-sky-600 shadow-lg shadow-slate-200/80 scale-[1.02]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Camera className="w-4 h-4" />
          Tap to Capture (Reliable)
        </button>
        <button
          onClick={() => setScannerMode('auto')}
          type="button"
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-[1.7rem] text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            scannerMode === 'auto'
              ? 'bg-white text-sky-600 shadow-lg shadow-slate-200/80 scale-[1.02]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          Auto-Scan (Beta)
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border-8 border-white relative">
        <div className="p-6 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full animate-pulse shadow-lg ${scannerMode === 'capture' ? 'bg-sky-400 shadow-sky-200' : 'bg-orange-400 shadow-orange-200'}`}></div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              {scannerMode === 'capture' ? 'Snapshot Assistant' : 'Magic Eye Active'}
            </h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {scannerMode === 'capture' ? 'Tap To Snap' : 'Point & Find'}
          </p>
        </div>
        
        <div className="relative aspect-square sm:aspect-video bg-slate-150 flex items-center justify-center overflow-hidden">
          {/* Shutter flash screen overlay */}
          {shutterActive && (
            <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 opacity-100" />
          )}

          {/* Guidelines Reticle */}
          <div className="absolute inset-0 pointer-events-none z-10">
             <div className="absolute top-10 left-10 w-20 h-20 border-t-8 border-l-8 border-white/80 rounded-tl-[3rem]"></div>
             <div className="absolute top-10 right-10 w-20 h-20 border-t-8 border-r-8 border-white/80 rounded-tr-[3rem]"></div>
             <div className="absolute bottom-10 left-10 w-20 h-20 border-b-8 border-l-8 border-white/80 rounded-bl-[3rem]"></div>
             <div className="absolute bottom-10 right-10 w-20 h-20 border-b-8 border-r-8 border-white/80 rounded-br-[3rem]"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-white/30 rounded-full animate-ping"></div>
          </div>
          
          {scannerMode === 'capture' ? (
            <video 
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div id="reader" ref={scannerRef} className="w-full h-full"></div>
          )}
          
          {cameraError && (
             <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 z-30 backdrop-blur-lg">
               <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-[2rem] flex items-center justify-center mb-6">
                 <AlertTriangle className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Camera Access Ouchie</h3>
               <p className="text-sm text-slate-400 font-bold mb-8 text-center">{cameraError}</p>
               <button 
                 onClick={() => {
                   if (scannerMode === 'capture') startVideoStream();
                   else startScanner();
                 }}
                 className="bg-sky-500 text-white font-bold px-10 py-4 rounded-3xl shadow-xl bouncy animate-bounce"
               >
                 Try Again
               </button>
             </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-6 z-20 backdrop-blur-md">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 text-sky-500 rounded-full flex items-center justify-center"><Loader2 className="w-16 h-16" /></motion.div>
              <p className="text-xl font-bold text-slate-800">Finding yummy details...</p>
            </div>
          )}

          {!scanning && !loading && !scannedProduct && !cameraError && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center gap-6 z-20">
              <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Camera className="w-10 h-10" />
              </div>
              <button 
                onClick={() => {
                  if (scannerMode === 'capture') startVideoStream();
                  else startScanner();
                }}
                className="bg-sky-500 text-white font-bold px-10 py-5 rounded-[2rem] shadow-2xl bouncy flex items-center gap-3 animate-pulse"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                Open Camera Feed
              </button>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-10">Hold the frame steady when capturing</p>
            </div>
          )}

          {!scanning && !loading && !scannedProduct && !cameraError && (
            <div className="text-slate-300 text-center p-12 absolute z-0 pointer-events-none">
              <Camera className="w-20 h-20 mx-auto mb-8 opacity-10" />
              <p className="text-lg font-bold">Wake up the Camera Feed!</p>
            </div>
          )}
        </div>

        {!loading && !scannedProduct && (
          <div className="p-10 space-y-8 bg-white">
            
            {/* Capture button overlay for manual mode */}
            {scannerMode === 'capture' && scanning && (
              <div className="flex flex-col items-center justify-center pb-8 border-b border-slate-100 gap-3">
                <button
                  onClick={captureAndScan}
                  disabled={isCapturing}
                  type="button"
                  className="w-full bg-gradient-to-r from-sky-500 to-indigo-505 bg-sky-500 hover:bg-sky-600 text-white font-black px-10 py-5 rounded-[2rem] shadow-xl hover:shadow-2xl disabled:bg-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3 bouncy"
                >
                  {isCapturing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Freezing & Scanning Barcode...
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6" />
                      CAPTURE & SCAN BARCODE
                    </>
                  )}
                </button>
                <p className="text-xs font-black text-sky-500 uppercase tracking-widest text-center">
                  Align barcode horizontally & stay steady before tapping!
                </p>
              </div>
            )}

            <p className="text-xs text-center text-slate-400 font-bold uppercase tracking-widest">
              {scannerMode === 'capture' 
                ? "Align the barcode inside the target box and click Capture" 
                : "Show the code to the Eye"}
            </p>
            
            {scanError && (
              <div className="p-5 bg-orange-50 border border-orange-100 rounded-3xl flex items-start gap-4 relative animate-in fade-in slide-in-from-top-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 pr-6">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-0.5">Scanner Notice</h4>
                  <p className="text-xs font-medium text-slate-600 leading-normal">{scanError}</p>
                </div>
                <button 
                  onClick={() => setScanError(null)} 
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-orange-100/50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                const el = document.getElementById('manual-input') as HTMLInputElement; 
                if (el && el.value) fetchProduct(el.value); 
              }} 
              className="relative flex items-center"
            >
              <input 
                id="manual-input" 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Or type the code here" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] pl-6 pr-16 py-4 text-base font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/50 shadow-inner"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { 
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) fetchProduct(val);
                  }
                }} 
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 text-white p-3.5 rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center bouncy"
                aria-label="Search barcode"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
            <button 
              onClick={() => { setShowManualAdd(true); stopScanner(); stopVideoStream(); }} 
              className="w-full py-6 text-sm font-bold text-sky-500 hover:text-sky-600 bg-sky-50/50 rounded-[2rem] border-4 border-dashed border-sky-100 transition-all uppercase"
            >
              Manual Secret Entry
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {scannedProduct && (
          <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }} className="bg-white rounded-[3.5rem] shadow-2xl p-10 space-y-8 relative border-8 border-sky-50 overflow-hidden">
            <div className="flex gap-8 items-start">
              {scannedProduct.image ? (
                <img src={scannedProduct.image} alt="Product" className="w-28 h-28 object-cover rounded-3xl shadow-lg border-4 border-white shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-28 h-28 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border-4 border-white shrink-0 shadow-inner"><Barcode className="w-14 h-14" /></div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-3xl font-bold text-slate-800 leading-tight mb-2 truncate">{scannedProduct.name}</h3>
                <p className="text-sm uppercase tracking-widest text-slate-400 font-bold mb-4">{scannedProduct.brand}</p>
                <div className="flex flex-wrap gap-2">
                  {scannedProduct.allergens?.map((alg, i) => <span key={i} className="px-3 py-1.5 bg-orange-100 text-orange-600 text-[11px] font-black uppercase tracking-wider rounded-xl">{alg}</span>)}
                </div>
              </div>
            </div>
            <div className="p-8 bg-sky-50/50 rounded-[2.5rem] border-4 border-white shadow-inner">
              <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-4">{scannedProduct.ingredientsText}</p>
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">How did it feel? (Optional notes)</label>
              <textarea 
                value={scanNotes}
                onChange={(e) => setScanNotes(e.target.value)}
                placeholder="E.g. Tummy hurt 10 mins after, or felt great!"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-sky-100 resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-6">
              <button onClick={() => logConsumption(false)} className="flex-1 bg-sky-500 text-white font-bold py-6 rounded-3xl flex flex-col items-center gap-3 transition-all bouncy shadow-xl shadow-sky-100"><Smile className="w-8 h-8" /><span className="text-sm uppercase tracking-widest">Happy Tummy</span></button>
              <button onClick={() => logConsumption(true)} className="flex-1 bg-orange-400 text-white font-bold py-6 rounded-3xl flex flex-col items-center gap-3 transition-all bouncy shadow-xl shadow-orange-100"><Frown className="w-8 h-8" /><span className="text-sm uppercase tracking-widest">A Bit Ouchie</span></button>
            </div>
            <button onClick={() => setScannedProduct(null)} className="w-full text-center text-[11px] font-bold text-slate-300 uppercase tracking-widest">Forget it</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const HistoryView = () => {
    const profileHistory = history.filter(h => h.profileId === activeProfile?.id);

    // Filter logic
    const filteredHistory = profileHistory.filter(item => {
      const matchesSearch = searchQuery.trim() === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        
      if (filterType === 'with_notes') return matchesSearch && !!item.notes;
      if (filterType === 'scanned') return matchesSearch && item.barcode !== 'MANUAL';
      if (filterType === 'manual') return matchesSearch && item.barcode === 'MANUAL';
      return matchesSearch;
    });

    // Sort logic
    const sortedHistory = [...filteredHistory].sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = isNaN(Number(a.id)) ? new Date(a.date).getTime() : Number(a.id);
        const timeB = isNaN(Number(b.id)) ? new Date(b.date).getTime() : Number(b.id);
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = isNaN(Number(a.id)) ? new Date(a.date).getTime() : Number(a.id);
        const timeB = isNaN(Number(b.id)) ? new Date(b.date).getTime() : Number(b.id);
        return timeA - timeB;
      }
      if (sortBy === 'az') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'za') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    // Subdivide columns: Safe (left) and Ouchie (right)
    const safeLogs = sortedHistory.filter(item => !item.reaction);
    const ouchieLogs = sortedHistory.filter(item => item.reaction);

    return (
      <div className="space-y-8 py-4">
        <h2 className="text-4xl font-bold text-slate-800 px-4">Food Journal</h2>

        {/* Search Bar */}
        <div className="relative px-4">
          <div className="absolute inset-y-0 left-4 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search eats, brands, comments..." 
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-12 pr-6 py-4 outline-none focus:ring-4 focus:ring-orange-100/50 transition-all font-bold text-slate-705 shadow-sm"
          />
        </div>

        {/* Filter Pills and Sort Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between px-4 pb-2">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'with_notes', 'scanned', 'manual'] as const).map((type) => {
              const labels = { 
                all: 'All', 
                with_notes: 'Notes 📝', 
                scanned: 'Scanned 📸', 
                manual: 'Manual ✍️' 
              };
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all bouncy ${filterType === type ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border-2 border-slate-100 rounded-2xl px-3 py-2 text-xs font-bold text-slate-650 outline-none focus:ring-4 focus:ring-orange-100 cursor-pointer text-slate-600"
            >
              <option value="newest">Newest Eats</option>
              <option value="oldest">Oldest Eats</option>
              <option value="az">A to Z</option>
              <option value="za">Z to A</option>
            </select>
          </div>
        </div>

        {profileHistory.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 mx-4">
            <History className="w-20 h-20 mx-auto mb-8 text-slate-100" />
            <p className="text-xl font-bold text-slate-200">No eats logged yet!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:gap-6 px-4">
            {/* Left Column: Safe */}
            <div className="space-y-4">
              <div className="bg-sky-500/15 text-sky-600 py-3.5 px-4 rounded-[1.5rem] font-black text-center text-[10px] uppercase tracking-widest border border-sky-100 flex items-center justify-center gap-1.5 shadow-sm">
                <Smile className="w-4 h-4 text-sky-550" /> Safe ({safeLogs.length})
              </div>
              <div className="space-y-4">
                {safeLogs.length === 0 ? (
                  <div className="text-center py-16 bg-white/40 rounded-[2rem] border-2 border-dashed border-slate-150 p-4">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Empty column</p>
                  </div>
                ) : (
                  safeLogs.map(item => (
                    <motion.div 
                      layout 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      key={item.id}
                      onClick={() => setSelectedLogId(item.id)}
                      className="group bg-white p-4 rounded-[2rem] border-2 border-sky-100 hover:border-sky-300 transition-all hover:shadow-lg cursor-pointer relative"
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md bg-sky-50 shrink-0">
                          {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Barcode className="w-6 h-6 text-sky-400 opacity-40" />
                          )}
                        </div>
                        <div className="w-full min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.date}</p>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-slate-900 p-1.5 rounded-xl shadow-md border border-white flex items-center justify-center">
                          <Pencil className="w-3 h-3" />
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Ouchie */}
            <div className="space-y-4">
              <div className="bg-orange-500/15 text-orange-600 py-3.5 px-4 rounded-[1.5rem] font-black text-center text-[10px] uppercase tracking-widest border border-orange-100 flex items-center justify-center gap-1.5 shadow-sm">
                <Frown className="w-4 h-4 text-orange-550" /> Ouchie ({ouchieLogs.length})
              </div>
              <div className="space-y-4">
                {ouchieLogs.length === 0 ? (
                  <div className="text-center py-16 bg-white/40 rounded-[2rem] border-2 border-dashed border-slate-150 p-4">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Empty column</p>
                  </div>
                ) : (
                  ouchieLogs.map(item => (
                    <motion.div 
                      layout 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      key={item.id}
                      onClick={() => setSelectedLogId(item.id)}
                      className="group bg-white p-4 rounded-[2rem] border-2 border-orange-100 hover:border-orange-300 transition-all hover:shadow-lg cursor-pointer relative"
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md bg-orange-50 shrink-0">
                          {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Barcode className="w-6 h-6 text-orange-400 opacity-40" />
                          )}
                        </div>
                        <div className="w-full min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.date}</p>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-slate-900 p-1.5 rounded-xl shadow-md border border-white flex items-center justify-center">
                          <Pencil className="w-3 h-3" />
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AnalysisView = () => {
    // Check calculations
    const profileHistory = history.filter(h => h.profileId === activeProfile?.id);
    const reactedLogsCount = profileHistory.filter(h => h.reaction).length;
    const safeLogsCount = profileHistory.filter(h => !h.reaction).length;

    return (
      <div className="space-y-10 py-4">
        {/* Main Banner Hero */}
        <div className="bg-sky-500 rounded-[4rem] p-16 text-white text-center relative overflow-hidden shadow-2xl shadow-sky-100 flex flex-col items-center">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-sky-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 -translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-75 translate-x-12 translate-y-12"></div>
          
          <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-6 backdrop-blur-md">
            <Microscope className="w-8 h-8 text-white rotate-12" />
          </div>
          
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight leading-none italic">The Mystery Solver</h2>
          <p className="text-sky-100 text-sm font-semibold uppercase tracking-widest mb-8 max-w-sm mx-auto leading-relaxed">
            AllerScan Triangulation Engine
          </p>
          
          <button 
            onClick={runAnalysis} 
            className="bg-white hover:bg-orange-50 text-sky-600 font-extrabold px-14 py-5 rounded-[2.5rem] bouncy text-xs uppercase tracking-widest shadow-lg shadow-sky-600/30 active:scale-95 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" /> Solve the Riddle
          </button>
        </div>

        {/* Inline Alerts & Error States */}
        {analysisError === "no_reactions" && (
          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6 mx-4 animate-in fade-in slide-in-from-bottom-3">
            <div className="w-16 h-16 bg-amber-50 text-amber-505 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
              <Frown className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-800">No Ouchie Foods Logged</h4>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                The solver works by triangulating ingredients eaten during an allergic reaction (<b>Ouchies</b>) against ingredients consumed safely. Currently, you have logged <b>{reactedLogsCount} Ouchie</b> meals.
              </p>
            </div>

            <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 border-dashed text-xs text-slate-500 leading-relaxed space-y-2">
              <span className="font-bold text-sky-600 inline-block">💡 How Triangulation Science Works:</span>
              <p>We cross-reference every ingredient in your reaction logs. If an ingredient also appears in your successfully tolerated safe meals, its danger score drops. Ingredients that exclusively appear in your Ouchies trigger a high-risk profile!</p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={() => setActiveTab('scan')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-6 rounded-2xl text-xs uppercase tracking-wider text-center bouncy shadow-md"
              >
                Scan or Add Food
              </button>
              
              <button 
                onClick={() => {
                  const loadedHistory = DEFAULT_HISTORY_SEED;
                  setHistory(loadedHistory);
                  saveData(profiles, loadedHistory);
                  setAnalysisError(null);
                  setTimeout(() => {
                    // Force state recalculation
                    runAnalysis();
                  }, 100);
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold py-4 px-6 rounded-2xl text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 bouncy"
              >
                <Sparkles className="w-4 h-4 animate-bounce" /> Loading Mock Riddle Food Logs
              </button>
            </div>
          </div>
        )}

        {analysisError === "no_ingredients" && (
          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6 mx-4 animate-in fade-in slide-in-from-bottom-3">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-800">No Ingredients Listed</h4>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                You have logged <b>{reactedLogsCount} Ouchie</b> entries, but none of them contain a list of ingredients! The Triangulation solver requires ingredients lists to analyze and isolate overlapping culinary suspects.
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              💡 <b>Tip</b>: Head over to your <b>Journal</b>, tap on your entries, and use manual edit to add ingredients separated by commas!
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={() => setActiveTab('history')}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-6 rounded-2xl text-xs uppercase tracking-wider text-center bouncy shadow-sm"
              >
                Go to Journal 📝
              </button>
              
              <button 
                onClick={() => {
                  const loadedHistory = DEFAULT_HISTORY_SEED;
                  setHistory(loadedHistory);
                  saveData(profiles, loadedHistory);
                  setAnalysisError(null);
                  setTimeout(() => {
                    runAnalysis();
                  }, 100);
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold py-4 px-6 rounded-2xl text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 bouncy"
              >
                <Sparkles className="w-4 h-4 animate-bounce" /> Populate High-Fidelity Demo Riddle Logs
              </button>
            </div>
          </div>
        )}

        {analysisError === "no_suspects" && (
          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6 mx-4 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0 mb-2">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h4 className="text-xl font-bold text-slate-800">Clear Horizon!</h4>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                We analyzed your journal entries but found no active culprits with positive risk scores. This usually means everything you ate on "Ouchie" days was also consumed safely on peaceful days!
              </p>
            </div>
            <p className="text-[10px] text-slate-350 font-bold max-w-xs mt-2 uppercase tracking-wide">
              Logged: {reactedLogsCount}x 🤢 Ouchies • {safeLogsCount}x 😊 Perfect days
            </p>
            <button 
              onClick={() => {
                const loadedHistory = DEFAULT_HISTORY_SEED;
                setHistory(loadedHistory);
                saveData(profiles, loadedHistory);
                setAnalysisError(null);
                setTimeout(() => {
                  runAnalysis();
                }, 100);
              }}
              className="mt-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold py-4 px-8 rounded-2xl text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 bouncy"
            >
              <Sparkles className="w-4 h-4 animate-bounce" /> Load Complex Overlaps Demo Dataset
            </button>
          </div>
        )}

        {/* Results Block */}
        {analysisResults.length > 0 && !analysisError && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 px-4">
            <div className="flex justify-between items-center px-1">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Likely Culprits</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Triangulation analysis based on {reactedLogsCount} Ouchies
                </p>
              </div>
              <span className="text-[9px] font-black uppercase text-sky-500 tracking-widest bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100">
                Cross-Checked AI Triangulation
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 -mt-4 leading-relaxed px-1">
              AllerScan compares ingredients found in your <b>Ouchie (reacted)</b> entries against foods you logged as <b>Safe</b>. Ingredients that triggered reactions and have never been eaten safely are ranked higher!
            </p>
            
            <div className="space-y-5">
              {analysisResults.map((suspect, idx) => {
                const allergenAlert = isTypicalAllergen(suspect.ingredient);
                return (
                  <div key={idx} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative">
                    {allergenAlert && (
                      <span className="absolute top-6 right-6 bg-orange-100 text-orange-600 font-bold uppercase text-[9px] tracking-wider px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Typical Allergen
                      </span>
                    )}
                    
                    <div>
                      <h4 className="text-xl font-bold text-slate-850 capitalize leading-snug pr-28 flex items-center gap-1.5">
                        {suspect.ingredient}
                      </h4>
                      {suspect.reasoning && (
                        <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          {suspect.reasoning}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                        <span className="text-slate-400">Risk Probabilities</span>
                        <span className={suspect.percentage > 70 ? 'text-orange-500 font-black' : suspect.percentage > 40 ? 'text-amber-500 font-black' : 'text-sky-550 font-black'}>
                          {suspect.percentage}% Risk Score
                        </span>
                      </div>
                      <div className="w-full bg-slate-50 h-3.5 rounded-full overflow-hidden border border-slate-100">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${suspect.percentage}%` }} 
                          className={`h-full rounded-full transition-all ${suspect.percentage > 70 ? 'bg-orange-500' : suspect.percentage > 40 ? 'bg-amber-400' : 'bg-sky-450 bg-sky-400'}`} 
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-1.5 border-t border-dashed border-slate-100">
                      <span className="flex items-center gap-1">
                        <Frown className="w-4 h-4 text-orange-400" />
                        Reacted: <b className="text-slate-700">{suspect.reactedCount}x</b>
                      </span>
                      <span className="flex items-center gap-1 border-l pl-4 border-slate-100">
                        <Smile className="w-4 h-4 text-sky-400" />
                        Safe: <b className="text-slate-700">{suspect.safeCount ? `${suspect.safeCount}x` : '0x'}</b>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] font-sans selection:bg-orange-100 text-slate-800 overflow-x-hidden">
      {/* Invisible container for static capture snapshot scanning */}
      <div id="hidden-reader" className="hidden" style={{ display: 'none' }}></div>

      <Header 
        onShowAbout={() => setShowAbout(true)} 
        onLogout={handleLogout} 
        showLogout={activeTab !== 'login'} 
        saveStatus={fetchError ? 'error' : saveStatus} 
        onRetry={() => fetchError ? fetchData() : saveData(profiles, history)}
        errorDetails={errorDetails}
      />
      <main className="max-w-xl mx-auto p-6 pb-36">
        <AnimatePresence mode="wait">
          {activeTab === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LoginView /></motion.div>}
          {activeTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><DashboardView /></motion.div>}
          {activeTab === 'scan' && <motion.div key="scan" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}><ScannerView /></motion.div>}
          {activeTab === 'history' && <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><HistoryView /></motion.div>}
          {activeTab === 'analysis' && <motion.div key="analysis" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}><AnalysisView /></motion.div>}
        </AnimatePresence>
      </main>

      {activeTab !== 'login' && (
        <nav className="fixed bottom-0 w-full max-w-xl left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-2xl border-t border-orange-50 pb-safe shadow-xl z-40 rounded-t-[3rem]">
          <div className="flex px-6 items-center h-28">
            <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserIcon} label="My Box" />
            <NavButton active={activeTab === 'scan'} onClick={() => setActiveTab('scan')} label="Check" customIcon />
            <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Journal" />
            <NavButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={PieChart} label="Solver" />
          </div>
        </nav>
      )}

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAbout(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="bg-white rounded-[3.5rem] w-full max-w-sm p-12 shadow-3xl relative z-10 border-8 border-sky-50 text-center">
              <TransparentImage 
                src={appLogo} 
                alt="AllerScan Logo" 
                className="w-28 h-28 object-contain mx-auto mb-10 bouncy"
              />
              <h3 className="text-3xl font-bold text-slate-800 mb-6 font-sans">Hello! Welcome!</h3>
              <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">We help you find what's making your tummy feel funny.</p>
              <button onClick={() => setShowAbout(false)} className="w-full bg-orange-400 text-white font-bold py-6 rounded-[2.5rem] shadow-xl bouncy uppercase tracking-widest">Let's Go!</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {showManualAdd && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowManualAdd(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30 }} className="bg-white rounded-t-[4rem] w-full max-w-xl p-12 pt-8 relative z-10 border-t-8 border-sky-50 max-h-[95vh] overflow-y-auto">
              <div className="w-20 h-2 bg-slate-100 rounded-full mx-auto mb-10" />
              <h3 className="text-3xl font-bold text-slate-800 mb-10 uppercase tracking-tight">Add a Secret</h3>
              <div className="space-y-8">
                <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="What is it called?" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 outline-none focus:ring-4 focus:ring-sky-100 transition-all font-bold" />
                <textarea rows={4} value={manualIngredients} onChange={(e) => setManualIngredients(e.target.value)} placeholder="List the toppings (split by comma)" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 outline-none focus:ring-4 focus:ring-sky-100 resize-none font-bold" />
                <div className="flex gap-6">
                  <button onClick={() => setManualReaction(false)} className={`flex-1 py-8 rounded-[2rem] font-bold border-4 bouncy ${!manualReaction ? 'bg-sky-500 text-white border-white' : 'bg-slate-50 border-white text-slate-300'}`}><Smile className="w-8 h-8 mx-auto mb-2" />Happy</button>
                  <button onClick={() => setManualReaction(true)} className={`flex-1 py-8 rounded-[2rem] font-bold border-4 bouncy ${manualReaction ? 'bg-orange-400 text-white border-white' : 'bg-slate-50 border-white text-slate-300'}`}><Frown className="w-8 h-8 mx-auto mb-2" />Ouchie</button>
                </div>
                <textarea rows={2} value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} placeholder="How did you feel? (Optional)" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-6 outline-none focus:ring-4 focus:ring-sky-100 resize-none font-bold" />
                <button onClick={handleManualAdd} disabled={!manualName || !manualIngredients} className="w-full bg-sky-500 text-white font-bold py-6 rounded-[2.5rem] bouncy disabled:opacity-30 shadow-xl shadow-sky-100">Save to My Box</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Editor Modal */}
      <AnimatePresence>
        {editingProfile && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProfile(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 30 }} 
              className="bg-white rounded-[3.5rem] w-full max-w-sm p-10 shadow-3xl relative z-10 border-8 border-sky-50 text-center"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-8 uppercase tracking-tight">Edit Friend</h3>
              
              <div className="relative w-32 h-32 mx-auto mb-10 group">
                <div className="w-full h-full bg-sky-50 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
                  {editImage ? (
                    <img src={editImage} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-sky-300" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-orange-400 p-3 rounded-2xl shadow-lg shadow-orange-100 text-white cursor-pointer hover:bg-orange-500 transition-all bouncy">
                  <Camera className="w-6 h-6" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="space-y-6">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Friend's Name" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-sky-100 transition-all font-bold text-center"
                />
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingProfile(null)}
                    className="flex-1 bg-slate-100 text-slate-400 font-bold py-5 rounded-3xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    className="flex-[2] bg-sky-500 text-white font-bold py-5 rounded-3xl shadow-xl shadow-sky-100 bouncy"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Note Editor Modal */}
      <AnimatePresence>
        {editingLogId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingLogId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 30 }} 
              className="bg-white rounded-[3.5rem] w-full max-w-sm p-10 shadow-3xl relative z-10 border-8 border-sky-50 text-center"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-8 uppercase tracking-tight">Journal Note</h3>
              
              <div className="space-y-6">
                <textarea 
                  value={editLogNotes}
                  onChange={(e) => setEditLogNotes(e.target.value)}
                  placeholder="Tell us more about how it felt..." 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-6 outline-none focus:ring-4 focus:ring-sky-100 transition-all font-bold text-lg min-h-[150px] resize-none"
                  autoFocus
                />
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingLogId(null)}
                    className="flex-1 bg-slate-100 text-slate-400 font-bold py-5 rounded-3xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateLogNotes}
                    className="flex-[2] bg-sky-500 text-white font-bold py-5 rounded-3xl shadow-xl shadow-sky-100 bouncy"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Log Modal */}
      <AnimatePresence>
        {selectedLogId && (() => {
          const selectedLogItem = history.find(h => h.id === selectedLogId);
          if (!selectedLogItem) return null;
          return (
            <div className="fixed inset-0 z-[105] flex items-end sm:items-center justify-center p-0 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setSelectedLogId(null)} 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ y: "100%", opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: "100%", opacity: 0 }} 
                transition={{ type: "spring", damping: 25 }}
                className="bg-white rounded-t-[3.5rem] sm:rounded-[3.5rem] w-full max-w-lg p-8 sm:p-10 relative z-10 border-t-8 sm:border-8 border-sky-50 shadow-3xl max-h-[90vh] overflow-y-auto"
              >
                <div className="w-16 h-1.5 bg-slate-105 rounded-full mx-auto mb-6 sm:hidden" />
                
                {/* Header Section */}
                <div className="flex gap-6 items-start mb-8">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-4 border-white shadow-md ${selectedLogItem.reaction ? 'bg-orange-50' : 'bg-sky-50'} shrink-0`}>
                    {selectedLogItem.image ? (
                      <img src={selectedLogItem.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Barcode className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                      {selectedLogItem.barcode === 'MANUAL' ? 'Manual Label' : `Barcode: ${selectedLogItem.barcode}`}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-800 leading-tight mb-1 truncate">{selectedLogItem.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedLogItem.brand} • {selectedLogItem.date}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedLogId(null)} 
                    className="p-2.5 bg-slate-50 border border-slate-150 text-slate-450 hover:bg-slate-100 rounded-2xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Safe & Ouchie Toggle */}
                <div className="space-y-3 mb-8">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consumption Status</label>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
                    <button 
                      type="button"
                      onClick={() => {
                        setHistory(history.map(h => h.id === selectedLogItem.id ? { ...h, reaction: false } : h));
                      }}
                      className={`flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all bouncy ${!selectedLogItem.reaction ? 'bg-sky-550 text-white shadow-md bg-sky-500' : 'text-slate-450 hover:text-slate-600'}`}
                    >
                      <Smile className="w-4 h-4" /> Safe Food
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setHistory(history.map(h => h.id === selectedLogItem.id ? { ...h, reaction: true } : h));
                      }}
                      className={`flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all bouncy ${selectedLogItem.reaction ? 'bg-orange-550 text-white shadow-md bg-orange-500' : 'text-slate-450 hover:text-slate-600'}`}
                    >
                      <Frown className="w-4 h-4" /> Ouchie Food
                    </button>
                  </div>
                </div>

                {/* Feel Notes Section */}
                <div className="space-y-3 mb-8">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <span>How did they feel? Notes</span>
                    {selectedLogItem.notes && selectedLogItem.notes.trim() !== '' ? (
                      <span className="text-[9px] text-emerald-500 font-bold font-sans">📝 Auto-saved</span>
                    ) : null}
                  </label>
                  <textarea 
                    rows={4}
                    value={selectedLogItem.notes || ''}
                    onChange={(e) => {
                      const textValue = e.target.value;
                      setHistory(history.map(h => h.id === selectedLogItem.id ? { ...h, notes: textValue } : h));
                    }}
                    placeholder="E.g. Symptoms, reaction times, or notes on how happily they ate this..." 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-6 py-4 outline-none focus:ring-4 focus:ring-orange-100/50 transition-all font-bold text-slate-700 text-sm resize-none"
                  />
                </div>

                {/* Ingredients & Allergens */}
                {((selectedLogItem.ingredientsList && selectedLogItem.ingredientsList.length > 0) || (selectedLogItem.allergens && selectedLogItem.allergens.length > 0)) && (
                  <div className="space-y-4 border-t border-dashed border-slate-100 pt-6 mb-8">
                    {selectedLogItem.allergens && selectedLogItem.allergens.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 animate-pulse">Flagged Allergens</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedLogItem.allergens.map((alg, i) => (
                            <span key={i} className="px-3 py-1.5 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider rounded-xl">
                              {alg}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedLogItem.ingredientsList && selectedLogItem.ingredientsList.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Cross-Checked Ingredients ({selectedLogItem.ingredientsList.length})
                        </span>
                        
                        {/* Table Layout */}
                        <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[220px] overflow-y-auto scrollbar-thin">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-150 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                <th className="px-4 py-3">Ingredient</th>
                                <th className="px-4 py-3 text-right">Family / Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedLogItem.ingredientsList.map((ing, k) => {
                                const allergen = isTypicalAllergen(ing);
                                return (
                                  <tr 
                                    key={k} 
                                    className={`transition-colors hover:bg-slate-50/50 ${allergen ? 'bg-orange-50/50 hover:bg-orange-50' : ''}`}
                                  >
                                    <td className="px-4 py-2.5 font-bold text-slate-700 capitalize leading-relaxed">
                                      {allergen ? (
                                        <span className="text-orange-700 font-extrabold flex items-center gap-1.5">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-orange-500" /> {ing}
                                        </span>
                                      ) : (
                                        <span className="text-slate-600 font-medium">{ing}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-semibold">
                                      {allergen ? (
                                        <span className="inline-block bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg">
                                          ⚠️ Allergen
                                        </span>
                                      ) : (
                                        <span className="inline-block bg-slate-100 text-slate-405 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg text-slate-400">
                                          Ok
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Buttons: Delete / Close */}
                <div className="flex gap-4 border-t border-slate-50 pt-6">
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this log?")) {
                        setHistory(history.filter(h => h.id !== selectedLogItem.id));
                        setSelectedLogId(null);
                      }
                    }}
                    className="flex-1 bg-red-50 text-red-500 font-bold py-5 rounded-3xl text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors bouncy cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Log
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedLogId(null)}
                    className="flex-[2] bg-sky-500 text-white font-bold py-5 rounded-3xl text-sm shadow-xl shadow-sky-100 bouncy uppercase tracking-wider cursor-pointer font-bold"
                  >
                    Okay, Done
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDeleteId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 30 }} 
              className="bg-white rounded-[3.5rem] w-full max-w-sm p-10 shadow-3xl relative z-10 border-8 border-orange-50 text-center"
            >
              <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 uppercase tracking-tight">Remove Friend?</h3>
              <p className="text-slate-400 font-bold mb-10 text-sm">This will delete all their yummy logs too. You can't undo this!</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 bg-slate-100 text-slate-400 font-bold py-5 rounded-3xl"
                >
                  No, Keep!
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-[2] bg-orange-500 text-white font-bold py-5 rounded-3xl shadow-xl shadow-orange-100 bouncy"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

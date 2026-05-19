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
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const [showAbout, setShowAbout] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [analysisResults, setAnalysisResults] = useState<SuspectIngredient[]>([]);
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
  
          if (Array.isArray(data.history)) {
            loadedHistory = data.history;
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

  const startScanner = async (retryCount = 0) => {
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
      const newScanner = new Html5Qrcode(elementId);
      setScanner(newScanner);

      const cameras = await Html5Qrcode.getCameras().catch(() => []);
      console.log("Cameras detected:", cameras);

      const config = { 
        fps: 15, 
        qrbox: { width: 250, height: 150 },
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
      setScanning(false);
    }
  };

  const fetchProduct = async (barcode: string) => {
    setLoading(true);
    setScannedProduct(null);
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
          image: product.image_front_small_url || ""
        });
      } else {
        alert("Product not found. Try manual entry.");
      }
    } catch (err) {
      alert("Failed to fetch product data.");
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
    
    const profileHistory = history.filter(h => h.profileId === activeProfile.id);
    const reactedLogs = profileHistory.filter(h => h.reaction);
    const safeLogs = profileHistory.filter(h => !h.reaction);

    if (reactedLogs.length === 0) {
      alert("Please log at least one reaction to run the analysis.");
      return;
    }

    const safeIngredients = new Set<string>();
    safeLogs.forEach(log => log.ingredientsList.forEach(ing => safeIngredients.add(ing)));

    const suspectCounts: Record<string, number> = {};
    reactedLogs.forEach((log: ProductLog) => {
      const uniqueIng = Array.from(new Set(log.ingredientsList));
      uniqueIng.forEach((ing: string) => {
        if (!safeIngredients.has(ing)) {
          suspectCounts[ing] = (suspectCounts[ing] || 0) + 1;
        }
      });
    });

    const results = Object.keys(suspectCounts)
      .map(ing => ({
        ingredient: ing,
        count: suspectCounts[ing],
        percentage: Math.round((suspectCounts[ing] / reactedLogs.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setAnalysisResults(results);
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
      startScanner();
    } else {
      stopScanner();
    }
  }, [activeTab]);

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
      <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border-8 border-white relative">
        <div className="p-6 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-200"></div>
            <h3 className="text-sm font-bold text-orange-600 uppercase tracking-widest">Magic Eye Active</h3>
          </div>
          <p className="text-xs font-bold text-yellow-600/50 uppercase tracking-widest">Point & Find</p>
        </div>
        
        <div className="relative aspect-square sm:aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-10">
             <div className="absolute top-10 left-10 w-20 h-20 border-t-8 border-l-8 border-white/80 rounded-tl-[3rem]"></div>
             <div className="absolute top-10 right-10 w-20 h-20 border-t-8 border-r-8 border-white/80 rounded-tr-[3rem]"></div>
             <div className="absolute bottom-10 left-10 w-20 h-20 border-b-8 border-l-8 border-white/80 rounded-bl-[3rem]"></div>
             <div className="absolute bottom-10 right-10 w-20 h-20 border-b-8 border-r-8 border-white/80 rounded-br-[3rem]"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-white/20 rounded-full"></div>
          </div>
          
          <div id="reader" ref={scannerRef} className="w-full h-full"></div>
          
          {cameraError && (
             <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 z-30 backdrop-blur-lg">
               <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-[2rem] flex items-center justify-center mb-6">
                 <AlertTriangle className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Camera Ouchie</h3>
               <p className="text-sm text-slate-400 font-bold mb-8 text-center">{cameraError}</p>
               <button 
                 onClick={() => startScanner()}
                 className="bg-sky-500 text-white font-bold px-10 py-4 rounded-3xl shadow-xl bouncy"
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
                onClick={() => startScanner()}
                className="bg-sky-500 text-white font-bold px-10 py-5 rounded-[2rem] shadow-2xl bouncy flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                Open Magic Eye
              </button>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-10">Sometimes the Eye needs a gentle poke to wake up</p>
            </div>
          )}
          {!scanning && !loading && !scannedProduct && !cameraError && (
            <div className="text-slate-300 text-center p-12 absolute z-0 pointer-events-none">
              <Camera className="w-20 h-20 mx-auto mb-8 opacity-10" />
              <p className="text-lg font-bold">Wake up the Magic Eye!</p>
            </div>
          )}
        </div>

        {!loading && !scannedProduct && (
          <div className="p-10 space-y-8 bg-white">
            <p className="text-sm text-center text-slate-400 font-bold uppercase tracking-widest">Show the code to the Eye</p>
            <div className="flex gap-4">
              <input 
                id="manual-input" 
                type="text" 
                placeholder="Or type the code here" 
                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-lg font-bold text-slate-700 outline-none transition-all placeholder:text-slate-200" 
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') fetchProduct((e.target as HTMLInputElement).value); }} 
              />
              <button 
                onClick={() => { const el = document.getElementById('manual-input') as HTMLInputElement; if (el && el.value) fetchProduct(el.value); }} 
                className="bg-sky-500 text-white p-5 rounded-3xl shadow-xl bouncy"
              >
                <Search className="w-7 h-7" />
              </button>
            </div>
            <button 
              onClick={() => { setShowManualAdd(true); stopScanner(); }} 
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
                <img src={scannedProduct.image} alt="Product" className="w-28 h-28 object-cover rounded-3xl shadow-lg border-4 border-white shrink-0" />
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
    return (
      <div className="space-y-10 py-4">
        <h2 className="text-4xl font-bold text-slate-800 px-4">Food Journal</h2>
        {profileHistory.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-slate-100"><History className="w-20 h-20 mx-auto mb-8 text-slate-100" /><p className="text-xl font-bold text-slate-200">History is empty!</p></div>
        ) : (
          <div className="space-y-4">
            {profileHistory.map(item => (
              <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={item.id} className={`group bg-white p-6 rounded-[2.5rem] border-2 flex flex-col gap-4 transition-all hover:shadow-xl ${item.reaction ? 'border-orange-100' : 'border-sky-100'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center overflow-hidden shrink-0 border-4 border-white shadow-lg ${item.reaction ? 'bg-orange-50' : 'bg-sky-50'}`}>{item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Barcode className="w-8 h-8 opacity-20" />}</div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="text-xl font-bold text-slate-800 truncate mb-1">{item.name}</h4>
                    <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest">{item.date}</p>
                  </div>
                  <button onClick={() => { setHistory(history.map(h => h.id === item.id ? { ...h, reaction: !h.reaction } : h)); }} className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm bouncy ${item.reaction ? 'bg-orange-400 text-white' : 'bg-sky-50 text-sky-500 border-2 border-sky-100'}`}>{item.reaction ? 'Ouchie' : 'Safe'}</button>
                </div>
                
                {item.notes ? (
                  <div className={`p-4 rounded-2xl text-sm italic ${item.reaction ? 'bg-orange-50 text-orange-700' : 'bg-sky-50 text-sky-700'}`}>
                    "{item.notes}"
                    <button 
                      onClick={() => {
                        setEditingLogId(item.id);
                        setEditLogNotes(item.notes || '');
                      }}
                      className="ml-2 inline-flex items-center p-2.5 bg-white/50 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100/50"
                    >
                      <Pencil className="w-4 h-4 text-sky-500" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setEditingLogId(item.id);
                      setEditLogNotes('');
                    }}
                    className="text-sm font-bold text-slate-400 hover:text-sky-500 transition-colors self-start px-4 py-2 bg-slate-50 rounded-xl flex items-center gap-2 border border-slate-100"
                  >
                    <Plus className="w-4 h-4" /> Add note about how you felt
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const AnalysisView = () => (
    <div className="space-y-10 py-4">
      <div className="bg-sky-500 rounded-[4rem] p-16 text-white text-center relative overflow-hidden shadow-2xl shadow-sky-100">
        <h2 className="text-5xl font-bold mb-6 italic">The Mystery Solver</h2>
        <p className="text-sky-100 text-lg font-bold uppercase tracking-widest mb-12 max-w-sm mx-auto leading-relaxed">Let's find out what's bothering your tummy!</p>
        <button onClick={runAnalysis} className="bg-white text-sky-600 font-bold px-16 py-6 rounded-[2.5rem] bouncy text-sm uppercase tracking-widest">Solve the Riddle</button>
      </div>
      {analysisResults.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
           <h3 className="text-xl font-bold text-slate-800 px-6">Likely Culprits</h3>
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
             {analysisResults.map((suspect, idx) => (
               <div key={idx} className="p-6 md:p-10 border-b last:border-0">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-2">
                   <span className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{suspect.ingredient}</span>
                   <span className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest">Seen {suspect.count} times ({suspect.percentage}%)</span>
                 </div>
                 <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border-2 border-white shadow-inner">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${suspect.percentage}%` }} 
                     className={`h-full rounded-full ${suspect.percentage > 70 ? 'bg-orange-500' : 'bg-sky-400'}`} 
                   />
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF9F5] font-sans selection:bg-orange-100 text-slate-800 overflow-x-hidden">
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

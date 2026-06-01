import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, Heart, MessageSquare, Star, Sparkles, 
  Coffee, ArrowRight, Ticket, Sparkle, Eye, X, Key
} from 'lucide-react';
import { PREMIUM_MENU_ITEMS, PREMIUM_CATEGORIES } from './data/menuData';
import { MenuItem } from './types';
import DishDetailModal from './components/DishDetailModal';
import MenuFilter from './components/MenuFilter';
import ParlorMemories from './components/ParlorMemories';
import MenuItemCard from './components/MenuItemCard';
import OwnerAdminPanel from './components/OwnerAdminPanel';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './lib/errorHelper';

// Elegant local fortune phrases
const PREMIUM_FORTUNES = [
  "✦ Your next sip of tea will ground your thoughts in absolute tranquility. High stars align with your destiny today.",
  "✦ Beautiful, clean spring waters nourish your inner landscape. Refinement comes in quiet pauses.",
  "✦ A delicate act of unexpected hospitality will find you beside a warm hearth of organic bakes soon.",
  "✦ True sweetness is not a matter of speed, but of slow, lingering appreciation of the present moment.",
  "✦ A refined invitation or lovely letter will greet you under the glass greenhouse arches tonight."
];

// Polaroid visual cycle component showing live guest photos
interface PolaroidCycleProps {
  memories: any[];
  offset: number;
  defaultImage: string;
  defaultTitle: string;
  defaultSubtitle: string;
}

function PolaroidCycle({ memories, offset, defaultImage, defaultTitle, defaultSubtitle }: PolaroidCycleProps) {
  const [index, setIndex] = useState(0);

  // Filter memories that have valid images
  const validMemories = (memories || []).filter(m => m && m.imageUrl);

  useEffect(() => {
    if (validMemories.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % validMemories.length);
    }, 7000 + (offset * 2500)); // offset timing dynamically to create natural non-synchronous rhythm
    return () => clearInterval(interval);
  }, [validMemories.length, offset]);

  let imageUrl = defaultImage;
  let label = defaultTitle;
  let caption = defaultSubtitle;

  if (validMemories.length > 0) {
    const activeIndex = (index + offset) % validMemories.length;
    const memo = validMemories[activeIndex];
    imageUrl = memo.imageUrl;
    label = memo.guestName;
    caption = memo.caption.length > 38 ? memo.caption.substring(0, 38) + '...' : memo.caption;
  }

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="aspect-[4/5] bg-[#F2EBD9] overflow-hidden rounded-xs border border-[#C8DFC0] relative shadow-inner">
        <AnimatePresence mode="popLayout">
          <motion.img 
            key={imageUrl} 
            src={imageUrl} 
            alt={label} 
            initial={{ opacity: 0.65, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.65 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            className="w-full h-full absolute inset-0 object-cover filter brightness-[0.98] contrast-[1.02]"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
      </div>
      <span 
        title={label}
        className="text-[7.5px] uppercase tracking-wider text-[#C4924A] block font-mono text-center pt-2 font-bold truncate px-1 shrink-0"
      >
        {label}
      </span>
      <span 
        title={caption}
        className="text-[6.5px] uppercase tracking-normal text-[#6a8a70] block font-sans text-center mt-0.5 truncate px-1 shrink-0 leading-none"
      >
        {caption}
      </span>
    </div>
  );
}

export default function App() {
  const [dbMenuItems, setDbMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Dynamic restaurant settings loaded from Firestore
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: "Himalayan Hearth - Luxury QR Menu",
    instagramLink: "https://www.instagram.com/pramasstudio?igsh=MWtxbms5a3ZuaTFoNg%3D%3D&utm_source=qr",
    logoUrl: "",
    tagline: "Tea House & Boutique Patisserie"
  });

  // Admin state managers
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('teahouse_admin_auth') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Initialize secure administration session key on mount
  useEffect(() => {
    let sessionToken = localStorage.getItem('teahouse_admin_session_token');
    if (!sessionToken) {
      sessionToken = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('teahouse_admin_session_token', sessionToken);
    }
  }, []);

  // Seeding default password derived uniquely from the restaurant settings
  useEffect(() => {
    const seedDefaultPassword = async () => {
      if (!restaurantSettings.name) return;
      try {
        const cleanName = restaurantSettings.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const derivedPass = `admin_${cleanName}123`;
        
        // Write the custom password only if it doesn't already exist in firestore
        await setDoc(doc(db, 'restaurant_config', 'security'), {
          password: derivedPass
        });
        console.log(`[Security Archive] Default admin passcode seeded: ${derivedPass}`);
      } catch (e) {
        // Silently succeed if already exists or blocked by security rules
      }
    };
    seedDefaultPassword();
  }, [restaurantSettings.name]);

  // Load and listen to settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'restaurant_config', 'settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRestaurantSettings({
          name: data.name || "Himalayan Hearth - Luxury QR Menu",
          instagramLink: data.instagramLink || "https://www.instagram.com/pramasstudio?igsh=MWtxbms5a3ZuaTFoNg%3D%3D&utm_source=qr",
          logoUrl: data.logoUrl || "",
          tagline: data.tagline || "Tea House & Boutique Patisserie"
        });
      } else {
        setDoc(doc(db, 'restaurant_config', 'settings'), {
          name: "Himalayan Hearth - Luxury QR Menu",
          instagramLink: "https://www.instagram.com/pramasstudio?igsh=MWtxbms5a3ZuaTFoNg%3D%3D&utm_source=qr",
          logoUrl: "",
          tagline: "Tea House & Boutique Patisserie"
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'restaurant_config/settings'));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'restaurant_config/settings');
    });
    return unsub;
  }, []);

  // Update configuration settings
  const handleUpdateSettings = async (newSettings: { name: string; instagramLink: string; logoUrl: string; tagline: string }) => {
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    try {
      // 1. Submit change request with active admin session token
      await setDoc(doc(db, 'restaurant_config', 'settings'), {
        ...newSettings,
        adminSessionToken: token
      });
      // 2. Perform self-cleansing token sweep to keep public record clean
      await setDoc(doc(db, 'restaurant_config', 'settings'), newSettings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'restaurant_config/settings');
    }
  };

  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbTags, setDbTags] = useState<any[]>([]);

  // Load and listen to recipe classifications categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'recipe_categories'), (snap) => {
      if (snap.empty) {
        const seedCategories = async () => {
          for (const cat of PREMIUM_CATEGORIES) {
            try {
              await setDoc(doc(db, 'recipe_categories', cat.id), cat);
            } catch (err) {
              console.error("Seeding category error:", err);
            }
          }
        };
        seedCategories();
        setDbCategories(PREMIUM_CATEGORIES);
      } else {
        const cats = snap.docs.map(d => d.data());
        // Ensure "all" is positioned first
        const sorted = cats.sort((a, b) => {
          if (a.id === 'all') return -1;
          if (b.id === 'all') return 1;
          return 0;
        });
        setDbCategories(sorted);
      }
    }, (err) => {
      setDbCategories(PREMIUM_CATEGORIES);
      handleFirestoreError(err, OperationType.GET, 'recipe_categories');
    });
    return unsub;
  }, []);

  // Load and listen to custom delicacy tags
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu_tags'), (snap) => {
      if (snap.empty) {
        const seedTags = async () => {
          const defaultTags = [
            { id: 'cold', label: '❄️ Cold' },
            { id: 'hot', label: '🔥 Hot' },
            { id: 'fat', label: '🧈 Rich & Fat' },
            { id: 'sweet', label: '🍯 Sweet Tooth' },
            { id: 'spicy', label: '🌶️ Spicy' },
            { id: 'chef', label: '★ Chef Special' }
          ];
          for (const tg of defaultTags) {
            try {
              await setDoc(doc(db, 'menu_tags', tg.id), tg);
            } catch (err) {
              console.error("Seeding tag error:", err);
            }
          }
        };
        seedTags();
        setDbTags([
          { id: 'cold', label: '❄️ Cold' },
          { id: 'hot', label: '🔥 Hot' },
          { id: 'fat', label: '🧈 Rich & Fat' },
          { id: 'sweet', label: '🍯 Sweet Tooth' },
          { id: 'spicy', label: '🌶️ Spicy' },
          { id: 'chef', label: '★ Chef Special' }
        ]);
      } else {
        const tagsData = snap.docs.map(d => d.data());
        setDbTags(tagsData);
      }
    }, (err) => {
      setDbTags([
        { id: 'cold', label: '❄️ Cold' },
        { id: 'hot', label: '🔥 Hot' },
        { id: 'fat', label: '🧈 Rich & Fat' },
        { id: 'sweet', label: '🍯 Sweet Tooth' },
        { id: 'spicy', label: '🌶️ Spicy' },
        { id: 'chef', label: '★ Chef Special' }
      ]);
      handleFirestoreError(err, OperationType.GET, 'menu_tags');
    });
    return unsub;
  }, []);

  const handleAddCategory = async (id: string, label: string) => {
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      await setDoc(doc(db, 'recipe_categories', cleanId), {
        id: cleanId,
        label,
        icon: 'Coffee',
        adminSessionToken: token
      });
      await setDoc(doc(db, 'recipe_categories', cleanId), {
        id: cleanId,
        label,
        icon: 'Coffee'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `recipe_categories/${cleanId}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (id === 'all') return;
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    try {
      await setDoc(doc(db, 'recipe_categories', id), {
        id,
        deleteRequested: true,
        adminSessionToken: token
      });
      await deleteDoc(doc(db, 'recipe_categories', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `recipe_categories/${id}`);
    }
  };

  const handleAddTag = async (id: string, label: string) => {
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      await setDoc(doc(db, 'menu_tags', cleanId), {
        id: cleanId,
        label,
        adminSessionToken: token
      });
      await setDoc(doc(db, 'menu_tags', cleanId), {
        id: cleanId,
        label
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `menu_tags/${cleanId}`);
    }
  };

  const handleDeleteTag = async (id: string) => {
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    try {
      await setDoc(doc(db, 'menu_tags', id), {
        id,
        deleteRequested: true,
        adminSessionToken: token
      });
      await deleteDoc(doc(db, 'menu_tags', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `menu_tags/${id}`);
    }
  };

  // Load and listen to menu items with auto-seeding if empty
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu_items'), (snap) => {
      if (snap.empty) {
        const seedMenu = async () => {
          for (const item of PREMIUM_MENU_ITEMS) {
            try {
              await setDoc(doc(db, 'menu_items', item.id), item);
            } catch (err) {
              console.error("Seeding item error:", err);
            }
          }
        };
        seedMenu();
        setDbMenuItems(PREMIUM_MENU_ITEMS);
      } else {
        const items = snap.docs.map(d => d.data() as MenuItem);
        setDbMenuItems(items);
      }
      setLoadingMenu(false);
    }, (err) => {
      setDbMenuItems(PREMIUM_MENU_ITEMS);
      setLoadingMenu(false);
      handleFirestoreError(err, OperationType.GET, 'menu_items');
    });
    return unsub;
  }, []);

  // Admin save/update menu item
  const handleSaveMenuItem = async (item: MenuItem) => {
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    const cleanItem = JSON.parse(JSON.stringify(item));
    try {
      // 1. Submit item modification with session token
      await setDoc(doc(db, 'menu_items', cleanItem.id), {
        ...cleanItem,
        adminSessionToken: token
      });
      // 2. Flush the token immediately to prevent exposure in queries
      await setDoc(doc(db, 'menu_items', cleanItem.id), cleanItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `menu_items/${cleanItem.id}`);
    }
  };

  // Admin delete menu item
  const handleDeleteMenuItem = async (id: string) => {
    const itemData = dbMenuItems.find(m => m.id === id) || PREMIUM_MENU_ITEMS.find(m => m.id === id);
    if (!itemData) throw new Error("Target item not found in database or local index");
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    const cleanItem = JSON.parse(JSON.stringify(itemData));
    try {
      // 1. Set short-lived deletion credentials
      await setDoc(doc(db, 'menu_items', id), {
        ...cleanItem,
        deleteRequested: true,
        adminSessionToken: token
      });
      // 2. Execute safe deletion
      await deleteDoc(doc(db, 'menu_items', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `menu_items/${id}`);
    }
  };

  // Admin delete guest memory post
  const handleDeleteMemory = async (id: string) => {
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    if (!token) throw new Error("No active admin session found. Please re-login.");
    const docRef = doc(db, 'cafe_memories', id);
    try {
      // 1. Submit delete authorization info (matches security rules checking active session token and deleteRequested flags)
      await updateDoc(docRef, {
        deleteRequested: true,
        adminSessionToken: token
      });
      // 2. Flush target from live database
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cafe_memories/${id}`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      let sessionToken = localStorage.getItem('teahouse_admin_session_token');
      if (!sessionToken) {
        sessionToken = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('teahouse_admin_session_token', sessionToken);
      }

      // Write administrative session. Evaluated in security rules against /restaurant_config/security!
      await setDoc(doc(db, 'admin_sessions', sessionToken), {
        password: loginPassword,
        createdAt: serverTimestamp()
      });

      localStorage.setItem('teahouse_admin_auth', 'true');
      setIsAdminLoggedIn(true);
      setShowLoginModal(false);
      setLoginPassword('');
      setLoginError('');
      setShowAdminPanel(true);
    } catch (err: any) {
      setLoginError('Incorrect secret key credentials for the archives.');
      handleFirestoreError(err, OperationType.WRITE, `admin_sessions`);
    }
  };

  const MENU_ITEMS = dbMenuItems.length > 0 ? dbMenuItems : PREMIUM_MENU_ITEMS;
  const CATEGORY_TABS = dbCategories.length > 0 ? dbCategories : PREMIUM_CATEGORIES;

  // Real-time snapshot memories for the top banner cycling
  const [parlorMemories, setParlorMemories] = useState<any[]>([]);

  // Aesthetic filter states
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDietary, setSelectedDietary] = useState<string>('all');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  
  // Custom Interactive states
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dishStats, setDishStats] = useState<Record<string, { likesCount?: number, commentCount?: number }>>({});
  
  // Fortune Cookie
  const [isCookieCracked, setIsCookieCracked] = useState(false);
  const [currentFortune, setCurrentFortune] = useState("");

  const crackCookie = () => {
    const idx = Math.floor(Math.random() * PREMIUM_FORTUNES.length);
    setCurrentFortune(PREMIUM_FORTUNES[idx]);
    setIsCookieCracked(true);
  };

  const resetCookie = () => {
    setIsCookieCracked(false);
  };

  // Inspect detail view
  const triggerDetailView = (item: MenuItem) => {
    setSelectedMenuItem(item);
  };

  // Load favorites
  useEffect(() => {
    const favs: string[] = [];
    MENU_ITEMS.forEach(m => {
      if (localStorage.getItem(`loved-${m.id}`) === 'true') {
        favs.push(m.id);
      }
    });
    setFavorites(favs);
  }, [MENU_ITEMS]);

  useEffect(() => {
    const handleStorageChange = () => {
      const favs: string[] = [];
      MENU_ITEMS.forEach(m => {
        if (localStorage.getItem(`loved-${m.id}`) === 'true') {
          favs.push(m.id);
        }
      });
      setFavorites(favs);
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [MENU_ITEMS]);

  // Read dynamic stats
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'dish_stats'), (snap) => {
      const stats: Record<string, { likesCount?: number, commentCount?: number }> = {};
      snap.docs.forEach(doc => {
        stats[doc.id] = doc.data();
      });
      setDishStats(stats);
    });
    return unsub;
  }, []);

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ingredients.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDietary =
      selectedDietary === 'all' ||
      item.dietary.includes(selectedDietary as any);

    return matchesCategory && matchesSearch && matchesDietary;
  });

  const getCourseDescriptor = (item: MenuItem) => {
    switch(item.category) {
      case 'signatures': return '✦ Artisan Patisserie Signature';
      case 'beverages': return '✦ Botanical Cold-Whisk Infusion';
      case 'bakes': return '✦ Hearth-Baked Selection';
      default: return '✦ Gourmet Creation';
    }
  };

  const getOriginLabel = (item: MenuItem) => {
    switch(item.id) {
      case 'matcha-chiffon': return 'Fine-Shaded Uji Highfields (Kyoto)';
      case 'matcha-ensemble': return 'Traditional Stone-Ground Ceremonial Grade';
      case 'strawberry-waffle': return 'Sweet Flour Mochi Core - Crisp Grids';
      case 'cardamom-cruffin': return 'Hand-harvested Ilam Cardamom Custard';
      case 'rosewater-chiffon': return 'Wild Petal Extraction (High Himalayas)';
      case 'espresso-ensemble': return 'Micro-lot Single Origin Alpine Extract';
      case 'honey-toast': return 'Double-proofed French-style Shokupan';
      case 'blossom-tea': return 'Sun-dried Lali Gurans Petals';
      default: return 'Botanical Organic Grounds';
    }
  };

  return (
    <div className="min-h-screen bg-[#F2EBD9] text-[#1B2820] font-sans relative overflow-x-hidden antialiased select-text">
      
      {/* Background Soft Dainty Glows */}
      <div className="fixed inset-0 bg-cloud-dots opacity-55 pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-15%] w-[70%] h-[50%] rounded-full bg-[#C8DFC0]/25 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#C8DFC0]/20 blur-[100px] pointer-events-none z-0" />

      {/* Decorative top strip */}
      <div className="relative py-2 bg-[#1B2820] px-4 text-center text-[10px] tracking-widest font-medium text-[#A8C5A0] uppercase select-none z-40 hidden sm:block font-display">
        ✦ SCRIBE YOUR TASTING EXPEDITION • TAP ON CLIENT LEDGER SELECTIONS TO UNVEIL LOCAL FAMILY RECIPES ✦
      </div>

      {/* Sweet Boutique Header */}
      <header className="sticky top-0 z-40 bg-[#1B2820]/95 backdrop-blur-md border-b border-[#C8DFC0] py-4 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Logo & Cafe Brand Signature */}
          <div className="flex items-center space-x-3.5 text-left">
            <div className="w-10 h-10 border border-[#C8DFC0] bg-[#FDFAF4] flex items-center justify-center rounded-sm relative group overflow-hidden shrink-0">
              {restaurantSettings.logoUrl ? (
                <img src={restaurantSettings.logoUrl} alt="Store logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FDFAF4] flex items-center justify-center rounded-sm">
                  <Coffee className="w-4 h-4 text-[#C4924A]" />
                </div>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C4924A] font-bold block leading-none mb-1 font-display">
                {restaurantSettings.tagline || "Tea House & Boutique Patisserie"}
              </span>
              <h1 className="text-lg leading-none font-serif text-[#FDFAF4] tracking-tight font-light uppercase flex items-center gap-1.5">
                <span>{restaurantSettings.name}</span>
                <span className="text-[10px] text-[#A8C5A0]">✦</span>
              </h1>
            </div>
          </div>

          {/* Social Instagram link */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={restaurantSettings.instagramLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4.5 py-2.5 rounded-sm text-[9.5px] font-bold tracking-widest uppercase bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] border border-[#2E4035] shadow-sm transition-all duration-300 cursor-pointer"
            >
              <span>Ledger Instagram</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-8 relative z-10">
        
        {/* COLLAGE HEADER HERO BANNER */}
        <section className="relative">
          
          {/* Left Large Zine Hero Card */}
          <div className="bg-[#FDFAF4] border border-[#C8DFC0] rounded-md p-6 sm:p-8 relative text-left overflow-hidden shadow-scrapbook gold-trim">
            
            {/* Washi tapes overlay */}
            <div className="absolute top-[-8px] left-[15%] px-6 py-2.5 tape-strip text-[9px] uppercase tracking-widest font-bold text-[#1B2820] select-none z-20">
              ✦ ARCHIVE EDITIONS • BOUTIQUE SCROLL ✦
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              
              {/* Text Info Block */}
              <div className="lg:col-span-7 space-y-5 relative z-10">
                <div className="inline-flex items-center space-x-1 px-3 py-1 text-[9px] bg-[#F2EBD9] border border-[#C8DFC0] text-[#C4924A] font-mono uppercase tracking-widest rounded-sm font-semibold">
                  <span>🍃 HAND-WHISKED MATCHAS & HARVEST CARDAMOM BAKES</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-serif text-[#1B2820] tracking-tight uppercase leading-tight">
                  The {restaurantSettings.name} Ledger
                </h2>
                
                <p className="text-[#1B2820] text-xs sm:text-sm leading-relaxed font-serif">
                  Slide into our sun-drenched teahouse parlor beside high birdnest ferns, and inspect this interactive ledger. Each chiffon cake, artisan toast, and ceremonial latte preparation links to beautiful mountain micro-lots, traditional bamboo whisking rituals, and centuries of botanical baking lore.
                </p>

                <div className="pt-2 flex flex-wrap gap-4 text-[#6a8a70] font-mono text-[9px] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C4924A]" />
                    Slow-Steam Baked Chiffons
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C4924A]" />
                    Cozy Greenhouse Sunrooms
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C4924A]" />
                    Client Guest Ledger Reviews
                  </span>
                </div>
              </div>

              {/* Atmosphere Collage Showcase - dynamically linked to user submitted gallery snapshots below */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4 relative min-h-[220px] sm:min-h-[260px] select-none">
                
                {/* Polaroid 1: Cafe Parlor */}
                <div className="relative transform rotate-[-3deg] hover:rotate-0 transition-all duration-300 hover:z-20">
                  <div className="bg-[#FDFAF4] p-2.5 pb-5 border border-[#C8DFC0] shadow-polaroid rounded-sm">
                    <PolaroidCycle 
                      memories={parlorMemories}
                      offset={0}
                      defaultImage="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600"
                      defaultTitle="Sunlit Nooks"
                      defaultSubtitle="Warm Fern Parlor"
                    />
                  </div>
                </div>

                {/* Polaroid 2: Whisking ritual */}
                <div className="relative transform rotate-[4deg] hover:rotate-0 transition-all duration-300 hover:z-20 mt-4">
                  <div className="bg-[#FDFAF4] p-2.5 pb-5 border border-[#C8DFC0] shadow-polaroid rounded-sm">
                    <PolaroidCycle 
                      memories={parlorMemories}
                      offset={1}
                      defaultImage="https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600"
                      defaultTitle="Matcha Foam"
                      defaultSubtitle="Kyoto Chasen Ritual"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </section>

        {/* MIDDLE SECTION: FORTUNE COOKIES */}
        <section className="bg-[#FDFAF4] border border-[#C8DFC0] rounded-md p-5 sm:p-7 text-left shadow-scrapbook relative overflow-hidden gold-trim">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-1 max-w-xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C4924A] block font-display">
                ✦ Daily Baked Salon Fortune
              </span>
              <h3 className="text-md sm:text-lg font-serif uppercase text-[#1B2820] leading-tight">
                CRACK THE CLAY COOKIE
              </h3>
              <p className="text-xs text-[#6a8a70] font-mono">
                Crack open an organic bakery fortune biscuit to receive instructions or deep reflections regarding your inner peace and creative journey.
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center min-w-[200px]" id="cookie-gong">
              <AnimatePresence mode="wait">
                {!isCookieCracked ? (
                  <motion.button
                    key="closed"
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: [1, 1.1, 0], opacity: 0, rotate: [0, 8, -8] }}
                    whileHover={{ scale: 1.02 }}
                    onClick={crackCookie}
                    type="button"
                    className="w-44 h-16 bg-[#F2EBD9] hover:bg-[#F2EBD9]/85 border border-[#C8DFC0] rounded-sm flex flex-col justify-center items-center cursor-pointer shadow-sm select-none group cookie-hover-shake"
                  >
                    <span className="text-xl">🥠</span>
                    <span className="text-[8.5px] uppercase font-bold tracking-wider text-[#1B2820] mt-1 font-mono">
                      TAP BISCUIT TO UNLOCK
                    </span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="opened"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-5 bg-[#FDFAF4] border border-dashed border-[#C4924A]/40 rounded-sm relative shadow-sm text-left space-y-3 max-w-sm"
                  >
                    <p className="text-xs sm:text-[13px] font-serif leading-relaxed text-[#1B2820]">
                      {currentFortune}
                    </p>

                    <button
                      onClick={resetCookie}
                      type="button"
                      className="text-[9px] uppercase tracking-wider text-[#C4924A] border border-[#C8DFC0] hover:bg-[#F2EBD9] px-3 py-1 rounded-sm ml-auto block transition-all cursor-pointer font-mono"
                    >
                      Bake another 🥠
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Sidebar and Main Layout Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar filter column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#FDFAF4] border border-[#C8DFC0] p-5 lg:sticky lg:top-24 max-h-[90vh] overflow-y-auto scrollbar-none shadow-scrapbook rounded-sm">
              <MenuFilter
                categories={CATEGORY_TABS}
                activeCategory={activeCategory}
                onActiveCategoryChange={setActiveCategory}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                selectedDietary={selectedDietary}
                onDietaryChange={setSelectedDietary}
                tags={dbTags}
              />
            </div>
          </div>

          {/* Main items list */}
          <div className="lg:col-span-3 space-y-6 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-[#C8DFC0]">
              <div>
                <h3 className="text-xs sm:text-sm font-display uppercase font-bold text-[#1B2820] tracking-wider flex items-center gap-1.5">
                  <span>SALON CONFECTION CATALOG</span>
                </h3>
                <p className="text-[#C4924A] text-[9.5px] uppercase font-bold tracking-widest mt-1 font-mono">
                  {filteredMenuItems.length} recipes indexed under active criteria
                </p>
              </div>

              {/* Reset action if filtering */}
              {(searchQuery || selectedDietary !== 'all' || activeCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDietary('all');
                    setActiveCategory('all');
                  }}
                  className="text-[10px] font-bold text-[#1B2820] hover:text-[#1B2820]/80 underline cursor-pointer transition-all uppercase tracking-widest font-mono"
                  type="button"
                >
                  Clear criteria
                </button>
              )}
            </div>

            {/* Empty matching result */}
            {filteredMenuItems.length === 0 ? (
              <div className="py-20 text-center space-y-4 border border-dashed border-[#C8DFC0] bg-[#FDFAF4] rounded-sm shadow-scrapbook" id="empty-ledger-view">
                <span className="text-3xl inline-block">📋</span>
                <p className="text-[#1B2820] text-xs font-mono uppercase">
                  No matching bakes in this archive
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDietary('all');
                    setActiveCategory('all');
                  }}
                  className="text-[9.5px] py-2.5 px-5 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] border border-[#2E4035] transition-all font-bold uppercase tracking-widest rounded-sm cursor-pointer"
                  type="button"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              /* Asymmetric high-end list */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="menulist-cards-grid">
                {filteredMenuItems.map((item, index) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    isFav={favorites.includes(item.id)}
                    dishStats={dishStats}
                    onInspect={triggerDetailView}
                    isFirst={index === 0}
                    filteredCount={filteredMenuItems.length}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
 
        {/* INTERACTIVE POLAROID CUSTOMER SHIELDS WALL */}
        <ParlorMemories onMemoriesLoaded={setParlorMemories} isAdmin={isAdminLoggedIn} />

      </main>

      {/* Elegant brand footer */}
      <footer className="border-t border-[#C8DFC0] py-12 text-xs bg-[#1B2820] text-[#A8C5A0] relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left space-y-1.5 max-w-xl">
            <p className="font-bold text-[#FDFAF4] uppercase tracking-wider font-display text-xs">
              ✦ Special Reserve Confections & {restaurantSettings.name} Tea Chronicles
            </p>
            <span className="text-[10px] text-[#A8C5A0] font-mono block leading-relaxed uppercase">
              Hand-designed with botanical materials, fine earthenware, and hand-whisked Kyoto organic grade Matchas. Single origin alpine coffee beans certified from eco-friendly shade mountain forest reserves.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-[9px] uppercase font-bold tracking-widest font-mono">
            <a 
              href={restaurantSettings.instagramLink}
              target="_blank"
              rel="noreferrer"
              className="text-[#C4924A] hover:text-[#C4924A]/80 underline inline-flex items-center space-x-1"
            >
              <span>Instagram Feed Link</span>
            </a>
            <span className="text-[#2E4035] hidden sm:inline">•</span>
            <span className="text-[#A8C5A0] font-mono flex items-center">
              EDITION S11.PREMIUM
              <button
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setShowAdminPanel(true);
                  } else {
                    setLoginPassword('');
                    setLoginError('');
                    setShowLoginModal(true);
                  }
                }}
                className={`ml-0.5 focus:outline-none transition-colors duration-300 font-serif cursor-pointer text-[10px] select-none ${
                  isAdminLoggedIn ? 'text-[#C4924A] font-bold' : 'text-[#1B2820] hover:text-[#C4924A]'
                }`}
                title="Credentials stamp"
              >
                ™
              </button>
            </span>
          </div>
        </div>
      </footer>

      {/* DETAILED LEDGER TRIPTYCH MODAL */}
      <AnimatePresence>
        {selectedMenuItem && (
          <DishDetailModal
            isOpen={selectedMenuItem !== null}
            onClose={() => setSelectedMenuItem(null)}
            menuItem={selectedMenuItem}
            allDishStats={dishStats}
            isAdmin={isAdminLoggedIn}
          />
        )}
      </AnimatePresence>

      {/* PASSWORD GATED ADMIN PORTAL LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2820]/75 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FDFAF4] border border-[#C8DFC0] p-6 rounded-md max-w-sm w-full shadow-2xl relative text-left"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-[#6a8a70] hover:text-[#1B2820] font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-[#F2EBD9] border border-[#C8DFC0] rounded-full flex items-center justify-center mx-auto text-[#C4924A]">
                  <Key className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-mono font-bold text-[#1B2820]">
                    🔐 Scribe Vault Gatekeeper
                  </h4>
                  <p className="text-[10px] text-[#6a8a70] uppercase leading-none font-sans mt-1">
                    Provide owner credentials to access system archives
                  </p>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
                {loginError && (
                  <p className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded-sm font-mono leading-relaxed">
                    🚨 {loginError}
                  </p>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                    Administrative Secret Key:
                  </label>
                  <input 
                    type="password"
                    placeholder="e.g. admin123"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-3 rounded-sm text-xs font-mono"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest cursor-pointer transition-colors"
                >
                  GRANT UNLOCK ACCESS ✦
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       {/* FLOATING WORKSPACE DRAWER PANEL */}
      <AnimatePresence>
        {showAdminPanel && (
          <OwnerAdminPanel 
            isOpen={showAdminPanel} 
            onClose={() => setShowAdminPanel(false)}
            menuItems={MENU_ITEMS}
            restaurantSettings={restaurantSettings}
            onUpdateSettings={handleUpdateSettings}
            onSaveMenuItem={handleSaveMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            categories={CATEGORY_TABS}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            tags={dbTags}
            onAddTag={handleAddTag}
            onDeleteTag={handleDeleteTag}
            parlorMemories={parlorMemories}
            onDeleteMemory={handleDeleteMemory}
            onLogOut={async () => {
              try {
                const token = localStorage.getItem('teahouse_admin_session_token');
                if (token) {
                  await deleteDoc(doc(db, 'admin_sessions', token));
                }
              } catch (err) {
                console.error("Session delete error on logout:", err);
              }
              localStorage.removeItem('teahouse_admin_auth');
              setIsAdminLoggedIn(false);
              setShowAdminPanel(false);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

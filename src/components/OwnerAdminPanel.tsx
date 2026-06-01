import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Lock, Key, Globe, Layout, ChevronRight, 
  Trash2, Plus, Edit2, Upload, Sparkles, Check, 
  Info, FileText, Settings, Image as ImageIcon, LogOut
} from 'lucide-react';
import { MenuItem, MenuItemOption } from '../types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHelper';

interface OwnerAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  restaurantSettings: { name: string; instagramLink: string; logoUrl: string; tagline?: string };
  onUpdateSettings: (settings: { name: string; instagramLink: string; logoUrl: string; tagline: string }) => Promise<void>;
  onSaveMenuItem: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem: (id: string) => Promise<void>;
  onLogOut: () => void;
  categories: any[];
  onAddCategory: (id: string, label: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  tags: any[];
  onAddTag: (id: string, label: string) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
  parlorMemories?: any[];
  onDeleteMemory?: (id: string) => Promise<void>;
}

export default function OwnerAdminPanel({
  isOpen,
  onClose,
  menuItems,
  restaurantSettings,
  onUpdateSettings,
  onSaveMenuItem,
  onDeleteMenuItem,
  onLogOut,
  categories,
  onAddCategory,
  onDeleteCategory,
  tags,
  onAddTag,
  onDeleteTag,
  parlorMemories = [],
  onDeleteMemory
}: OwnerAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'menu' | 'gallery' | 'security'>('profile');
  
  // Settings edit states
  const [restName, setRestName] = useState(restaurantSettings.name);
  const [instagramLink, setInstagramLink] = useState(restaurantSettings.instagramLink);
  const [logoBase64, setLogoBase64] = useState(restaurantSettings.logoUrl);
  const [tagline, setTagline] = useState(restaurantSettings.tagline || 'Tea House & Boutique Patisserie');
  const [savingSettings, setSavingSettings] = useState(false);

  // Password / Secure pass code states
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [repeatPasswordInput, setRepeatPasswordInput] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Menu items creator / editor states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Menu items fields
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('signatures');
  const [itemPrice, setItemPrice] = useState(300);
  const [itemDesc, setItemDesc] = useState('');
  const [itemWhyLoved, setItemWhyLoved] = useState('');
  const [itemFact, setItemFact] = useState('');
  const [itemIngredientsText, setItemIngredientsText] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemDietary, setItemDietary] = useState<string[]>([]);
  const [itemOptions, setItemOptions] = useState<MenuItemOption[]>([]);
  const [itemOptionsLabel, setItemOptionsLabel] = useState('');

  // Individual formulation variant (Type) editing states
  const [newOptName, setNewOptName] = useState('');
  const [newOptDesc, setNewOptDesc] = useState('');
  const [newOptPriceDelta, setNewOptPriceDelta] = useState(0);
  const [newOptIngredients, setNewOptIngredients] = useState('');
  const [newOptImage, setNewOptImage] = useState('');
  const [newOptWhyLoved, setNewOptWhyLoved] = useState('');
  const [newOptFact, setNewOptFact] = useState('');

  // Category and Tag states
  const [newCatId, setNewCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [newTagId, setNewTagId] = useState('');
  const [newTagLabel, setNewTagLabel] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  // Deletion operation states
  const [isDeletingMemoId, setIsDeletingMemoId] = useState<string | null>(null);

  const [notif, setNotif] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const itemImgInputRef = useRef<HTMLInputElement>(null);
  const optImgInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotif({ text, type });
    setTimeout(() => setNotif(null), 3500);
  };

  // Convert/Compress image file uploads to robust lighter JPEG base64 strings
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await readFileAsBase64(file);
      setLogoBase64(base64);
      showNotification("Brand artwork updated in temporary memory! 🎨");
    } catch (err) {
      showNotification("Failed to compress logo.", "error");
    }
  };

  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await readFileAsBase64(file);
      setItemImage(base64);
      showNotification("Master specialty image loaded successfully!");
    } catch (err) {
      showNotification("Failed to compress specialty image.", "error");
    }
  };

  const handleOptImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await readFileAsBase64(file);
      setNewOptImage(base64);
      showNotification("Custom formulation image parsed successfully! 📸");
    } catch (err) {
      showNotification("Error parsing custom formulation image.", "error");
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // Clean downscale constraint to 800px maximum bounds
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.70));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Profile brand updates
  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restName.trim() || !instagramLink.trim()) {
      showNotification("Please provide all required brand settings.", "error");
      return;
    }
    setSavingSettings(true);
    try {
      await onUpdateSettings({
        name: restName.trim(),
        instagramLink: instagramLink.trim(),
        logoUrl: logoBase64,
        tagline: tagline.trim()
      });
      showNotification("Teahouse rebranding guidelines saved database-wide!");
    } catch (err: any) {
      console.error(err);
      showNotification(`Rebranding fail: ${err?.message || err}`, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // Password Admin key updating
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length < 8) {
      showNotification("Administrative Key must contain at least 8 elements.", "error");
      return;
    }
    if (newPasswordInput !== repeatPasswordInput) {
      showNotification("Administrative keys do not match. Re-type accurately.", "error");
      return;
    }

    setUpdatingPassword(true);
    const token = localStorage.getItem('teahouse_admin_session_token') || '';
    try {
      const secRef = doc(db, 'restaurant_config', 'security');
      await setDoc(secRef, {
        password: newPasswordInput,
        adminSessionToken: token,
        updatedAt: serverTimestamp()
      });
      showNotification("Security keys updated! Keep this password recorded.");
      setNewPasswordInput('');
      setRepeatPasswordInput('');
    } catch (err: any) {
      showNotification(`Lock update failure: ${err?.message || err}`, "error");
      handleFirestoreError(err, OperationType.WRITE, 'restaurant_config/security');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Recipe items creation helpers
  const startNewItem = () => {
    setEditingItem(null);
    setItemId('specialty_' + Math.random().toString(36).substring(2, 9));
    setItemName('');
    setItemCategory(categories.filter(c => c.id !== 'all')[0]?.id || 'signatures');
    setItemPrice(320);
    setItemDesc('');
    setItemWhyLoved('');
    setItemFact('');
    setItemIngredientsText('');
    setItemImage('');
    setItemDietary([]);
    setItemOptions([]);
    setItemOptionsLabel('Formulation Options');
    setIsCreatingNew(true);
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemId(item.id);
    setItemName(item.name || '');
    setItemCategory(item.category || '');
    setItemPrice(item.price || 0);
    setItemDesc(item.description || '');
    setItemWhyLoved(item.whyLoved || '');
    setItemFact(item.fact || '');
    setItemIngredientsText(item.ingredients ? item.ingredients.join(', ') : '');
    setItemImage(item.image || '');
    setItemDietary(item.dietary || []);
    setItemOptions(item.options || []);
    setItemOptionsLabel(item.optionsLabel || 'Formulation Options');
    setIsCreatingNew(false);
  };

  // Formulation (Types) Designer functions
  const handleAddTypeOption = () => {
    if (!newOptName.trim() || !newOptDesc.trim()) {
      showNotification("A title name and sensory description is required for this formulation type.", "error");
      return;
    }
    const oId = 'type_variant_' + Math.random().toString(36).substring(2, 9);
    const newFormulation: MenuItemOption = {
      id: oId,
      name: newOptName.trim(),
      description: newOptDesc.trim(),
      priceDelta: Number(newOptPriceDelta) || 0,
      ingredients: newOptIngredients ? newOptIngredients.split(',').map(i => i.trim()).filter(Boolean) : [],
      image: newOptImage.trim() || undefined,
      whyPeopleLoveIt: newOptWhyLoved.trim() || undefined,
      funFact: newOptFact.trim() || undefined
    };

    setItemOptions(prev => [...prev, newFormulation]);
    
    // Clear formulation temporary buffers
    setNewOptName('');
    setNewOptDesc('');
    setNewOptPriceDelta(0);
    setNewOptIngredients('');
    setNewOptImage('');
    setNewOptWhyLoved('');
    setNewOptFact('');
    showNotification("Unique formulation type added to this recipe card's options draft!");
  };

  const removeTypeOption = (idT: string) => {
    setItemOptions(prev => prev.filter(o => o.id !== idT));
    showNotification("Formulation option removed from list.");
  };

  const toggleDietaryTag = (tag: string) => {
    setItemDietary(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Recipe item save submit handler
  const handleSaveItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemDesc.trim() || !itemImage) {
      showNotification("Please provide recipe title, description and an elegant master image.", "error");
      return;
    }

    setSavingItem(true);
    
    // Clean and split ingredients
    const cleanIngredients = itemIngredientsText
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    // Sanitize itemID to conform to Firestore matches('^[a-zA-Z0-9_\\-]+$') strict security rule
    const secureItemId = itemId.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
    if (!secureItemId) {
      showNotification("Missing or invalid Recipe Unique ID designation.", "error");
      setSavingItem(false);
      return;
    }

    const compiledRecipe: MenuItem = {
      id: secureItemId,
      name: itemName.trim(),
      category: itemCategory,
      price: Number(itemPrice) || 0,
      description: itemDesc.trim(),
      whyLoved: itemWhyLoved.trim() || "Baked slowly utilizing our legacy altitude techniques.",
      fact: itemFact.trim() || "Bespoke recipe passed down carefully across generations.",
      ingredients: cleanIngredients,
      image: itemImage,
      rating: editingItem?.rating || 4.95,
      reviewCount: editingItem?.reviewCount || 98,
      spicyLevel: editingItem?.spicyLevel || 0,
      dietary: itemDietary,
      options: itemOptions.length > 0 ? itemOptions : undefined,
      optionsLabel: itemOptionsLabel.trim() || undefined
    };

    try {
      await onSaveMenuItem(compiledRecipe);
      showNotification("Gourmet delicacy locked inside live inventory ledger! ✨");
      setEditingItem(null);
      setIsCreatingNew(false);
    } catch (err: any) {
      console.error("Recipe Save Error:", err);
      showNotification(`Failed saving recipe card. Ensure you are signed in or avoid special characters in ID: ${err?.message || err}`, "error");
    } finally {
      setSavingItem(false);
    }
  };

  const handleRecipeDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently dissolve this delicacy recipe from the archives? 🌿")) return;
    try {
      await onDeleteMenuItem(id);
      showNotification("Delicacy card dissolved from inventories.");
    } catch (err: any) {
      console.error(err);
      showNotification(`Dissolve failed: ${err?.message || err}. Try logging out and back in.`, "error");
    }
  };

  // Customer Gallery Memories deletion logic
  const handleMemoryDelete = async (memoId: string) => {
    if (!onDeleteMemory) {
      showNotification("Memory deletion callback is not configured.", "error");
      return;
    }
    if (!window.confirm("Are you sure you wish to permanently purge this customer memory crop from our parlor wall? 🌿")) return;
    
    setIsDeletingMemoId(memoId);
    try {
      await onDeleteMemory(memoId);
      showNotification("Customer memory photo successfully dissolved/purged!");
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to purge memory: ${err?.message || err}. Try re-logging.`, "error");
    } finally {
      setIsDeletingMemoId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden bg-black/60 backdrop-blur-xs select-none" id="admin-panel-overlay">
      
      {/* Heavy velvet backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0"
        onClick={onClose}
      />

      {/* Main glass workspace sheets */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className="relative w-full max-w-4xl h-[90vh] bg-[#F4ECD8] border-2 border-[#C8DFC0] shadow-polaroid rounded-2xl flex flex-col overflow-hidden text-[#1B2820] z-10"
        id="owner-admin-chassis"
      >
        {/* Panel elegant royal header */}
        <div className="px-6 py-4 bg-[#233328] border-b border-[#C8DFC0] flex items-center justify-between text-[#FDFAF4]">
          <div className="text-left">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#C4924A] font-bold block">
              🌿 botanical & brand archives
            </span>
            <h3 className="text-sm font-serif font-semibold tracking-tight uppercase flex items-center mt-0.5">
              <span>Owner Ledger Panel</span>
              <span className="ml-1 px-1.5 py-0.5 bg-[#C4924A]/25 border border-[#C4924A]/45 rounded-sm text-[8px] font-mono font-medium lowercase tracking-normal text-[#C4924A]">
                active
              </span>
            </h3>
          </div>

          <div className="flex items-center space-x-3.5">
            <button 
              onClick={onLogOut}
              className="px-3 py-1.5 border border-red-500/35 hover:bg-red-500/10 text-red-500 rounded-sm text-[8.5px] uppercase tracking-wider font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Sign Out Owner Profile"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 bg-[#F2EBD9] border border-[#C8DFC0] text-[#1B2820] hover:bg-[#C8DFC0] rounded-full cursor-pointer transition-colors"
              title="Return to Parlor View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Ensembles */}
        <div className="bg-[#FDFAF4] border-b border-[#C8DFC0] flex shrink-0 select-none">
          <button
            onClick={() => { setActiveTab('profile'); setEditingItem(null); setIsCreatingNew(false); }}
            className={`w-1/4 py-3 text-[10px] font-mono font-bold uppercase tracking-wider border-r border-[#C8DFC0] transition-colors focus:outline-none ${
              activeTab === 'profile' 
                ? 'bg-[#F2EBD9] text-[#1B2820] border-b-2 border-b-[#C4924A]' 
                : 'text-[#6a8a70] hover:bg-[#F2EBD9]/50'
            }`}
          >
            ✦ Brand Rebrand
          </button>
          <button
            onClick={() => { setActiveTab('menu'); }}
            className={`w-1/4 py-3 text-[10px] font-mono font-bold uppercase tracking-wider border-r border-[#C8DFC0] transition-colors focus:outline-none ${
              activeTab === 'menu' 
                ? 'bg-[#F2EBD9] text-[#1B2820] border-b-2 border-b-[#C4924A]' 
                : 'text-[#6a8a70] hover:bg-[#F2EBD9]/50'
            }`}
          >
            ✦ Recipes Creator
          </button>
          <button
            onClick={() => { setActiveTab('gallery'); setEditingItem(null); setIsCreatingNew(false); }}
            className={`w-1/4 py-3 text-[10px] font-mono font-bold uppercase tracking-wider border-r border-[#C8DFC0] transition-colors focus:outline-none ${
              activeTab === 'gallery' 
                ? 'bg-[#F2EBD9] text-[#1B2820] border-b-2 border-b-[#C4924A]' 
                : 'text-[#6a8a70] hover:bg-[#F2EBD9]/50'
            }`}
          >
            ✦ Guests Gallery ({parlorMemories.length})
          </button>
          <button
            onClick={() => { setActiveTab('security'); setEditingItem(null); setIsCreatingNew(false); }}
            className={`w-1/4 py-3 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors focus:outline-none ${
              activeTab === 'security' 
                ? 'bg-[#F2EBD9] text-[#1B2820] border-b-2 border-b-[#C4924A]' 
                : 'text-[#6a8a70] hover:bg-[#F2EBD9]/50'
            }`}
          >
            ✦ Scribe Security 🔒
          </button>
        </div>

        {/* Toast Notifier */}
        <AnimatePresence>
          {notif && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3.5 absolute top-16 right-6 z-50 text-[10.5px] font-mono rounded-sm shadow-md border ${
                notif.type === 'success' 
                  ? 'bg-green-50 text-green-800 border-green-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              ✦ {notif.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable sheet content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-left bg-[#FDFAF4]">
          
          {/* TAB 1: BRAND REBRAND */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-4 bg-[#F2EBD9] border border-[#C8DFC0] rounded-sm text-xs leading-relaxed space-y-1">
                <p className="font-bold text-[#C4924A] font-mono text-[9px] uppercase tracking-wider">
                  💡 Dynamic Brand Customization Control
                </p>
                <p className="font-serif">
                  Modify the fields below to dynamically adjust settings, the official Instagram handle link, brand tagline, or primary launcher logo base photograph. Any changes take effect immediately across all client views without requiring manual rebuilds or client refreshes!
                </p>
              </div>

              <form onSubmit={handleSaveSettingsSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                      Restaurant / Teahouse Brand Name:
                    </label>
                    <input 
                      type="text"
                      value={restName}
                      onChange={(e) => setRestName(e.target.value)}
                      placeholder="e.g. Traditional Himalayan Bakery"
                      className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-3 rounded-sm text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                      Customer Instagram Live Link URL:
                    </label>
                    <input 
                      type="url"
                      value={instagramLink}
                      onChange={(e) => setInstagramLink(e.target.value)}
                      placeholder="e.g. https://instagram.com/teahouse"
                      className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-3 rounded-sm text-xs"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                      Brand Core Metaphor Tagline / Sensory Motto:
                    </label>
                    <input 
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Tea House & Boutique Patisserie"
                      className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-3 rounded-sm text-xs font-serif"
                      required
                    />
                  </div>

                </div>

                {/* Brand Logo Upload Area */}
                <div className="space-y-2 border-t border-[#C8DFC0] pt-4 text-left">
                  <label className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                    Brand Representative Logo Artwork:
                  </label>
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-[#F2EBD9] border border-[#C8DFC0] rounded-sm flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {logoBase64 ? (
                        <img src={logoBase64} alt="Brand Representative Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-[#6a8a70] font-mono text-[9px] uppercase font-bold text-center p-1 leading-tight">Default Logo</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 border border-[#C8DFC0] hover:bg-[#F2EBD9] text-[#1B2820] rounded-sm text-[9px] uppercase tracking-widest font-semibold flex items-center gap-1.5 cursor-pointer font-mono"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#C4924A]" />
                        Upload Logo Photo
                      </button>
                      
                      {logoBase64 && (
                        <button
                          type="button"
                          onClick={() => setLogoBase64('')}
                          className="text-[8px] text-red-600 block uppercase hover:underline leading-none font-mono"
                        >
                          Restore Default Logo Illustration
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#C8DFC0] flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-2.5 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] rounded-sm text-[9.5px] font-mono font-bold uppercase tracking-widest cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? "COMMITTING BRAND CONFIGURATION..." : "COMMIT REAL-TIME REBRANDING ✒️"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: RECIPE CURATOR */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              
              {!editingItem && !isCreatingNew ? (
                // Recipe List View
                <div className="space-y-5">
                  <div className="flex justify-between items-center bg-[#F2EBD9] p-4 border border-[#C8DFC0] rounded-sm">
                    <div>
                      <h4 className="text-[10px] uppercase font-mono font-bold text-[#1B2820] tracking-wider">
                        Dynamic Recipe Catalog ({menuItems.length} delicacies registered)
                      </h4>
                      <p className="text-[9px] text-[#6a8a70] uppercase mt-0.5">
                        Add newly crafted recipes, modify catalog details or discard old recipes.
                      </p>
                    </div>

                    <button
                      onClick={startNewItem}
                      className="px-4 py-2 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1 text-[#C4924A]" />
                      Add New Recipe
                    </button>
                  </div>

                  {/* Accompanying Categories Setup section */}
                  <div className="bg-[#F2EBD9]/60 border border-[#C8DFC0] p-4 rounded-sm text-left">
                    <button
                      type="button"
                      onClick={() => setCreatingCategory(!creatingCategory)}
                      className="w-full flex items-center justify-between text-[10px] uppercase font-mono font-bold text-[#1B2820] hover:text-[#C4924A] transition-colors"
                    >
                      <span>📂 MANAGE CLASSIFICATION CATEGORIES ({categories.filter(c => c.id !== 'all').length} active)</span>
                      <span className="text-[9px] font-bold">{creatingCategory ? "[-] COLLAPSE" : "[+] EXPAND MANAGER"}</span>
                    </button>

                    {creatingCategory && (
                      <div className="mt-4 pt-4 border-t border-[#C8DFC0] space-y-4 text-xs font-sans">
                        <p className="text-[10px] text-[#6a8a70] uppercase leading-relaxed">
                          Define standard catalog lists (such as Cakes, Hot Elixirs, Savory). Re-rendered automatically on filters menu sidebar.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {categories.filter(c => c.id !== 'all').map((cat) => (
                            <div key={cat.id} className="flex items-center justify-between bg-[#FDFAF4] border border-[#C8DFC0] p-2 rounded-xs">
                              <span className="font-semibold text-[#1B2820] text-[11px]">{cat.label} <code className="text-[8px] font-mono text-[#6a8a70]">({cat.id})</code></span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Do you wish to delete "${cat.label}" classification?`)) {
                                    try {
                                      await onDeleteCategory(cat.id);
                                      showNotification("Classification removed from catalog!");
                                    } catch (err) {
                                      showNotification("Failed deleting categorizer.", "error");
                                    }
                                  }
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add category */}
                        <div className="p-3 bg-[#FDFAF4] border border-[#C8DFC0] rounded-xs flex flex-col sm:flex-row gap-2.5 items-end">
                          <div className="flex-1 space-y-1 w-full text-left">
                            <span className="text-[8px] uppercase tracking-wider font-mono text-[#6a8a70] block">Title Label name</span>
                            <input
                              type="text"
                              value={newCatLabel}
                              onChange={(e) => {
                                setNewCatLabel(e.target.value);
                                if (!newCatId) {
                                  setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                }
                              }}
                              placeholder="e.g. Signature Teas"
                              className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-1.5 rounded-xs text-xs"
                            />
                          </div>

                          <div className="flex-1 space-y-1 w-full text-left">
                            <span className="text-[8px] uppercase tracking-wider font-mono text-[#6a8a70] block">Category ID Tag (Alphanumeric only)</span>
                            <input
                              type="text"
                              value={newCatId}
                              onChange={(e) => setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                              placeholder="e.g. signatureteas"
                              className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-1.5 rounded-xs text-xs font-mono"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!newCatLabel.trim() || !newCatId.trim()) {
                                showNotification("Please specify label name and category ID.", "error");
                                return;
                              }
                              try {
                                await onAddCategory(newCatId.trim(), newCatLabel.trim());
                                setNewCatId('');
                                setNewCatLabel('');
                                showNotification("New category classification unlocked!");
                              } catch (err) {
                                showNotification("Could not create Category.", "error");
                              }
                            }}
                            className="px-4 py-2 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] text-[9px] uppercase tracking-widest font-mono font-bold rounded-sm h-9 cursor-pointer whitespace-nowrap animate-fade-in"
                          >
                            + Register Category
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accompanying Tags Setup section */}
                  <div className="bg-[#F2EBD9]/60 border border-[#C8DFC0] p-4 rounded-sm text-left">
                    <button
                      type="button"
                      onClick={() => setCreatingTag(!creatingTag)}
                      className="w-full flex items-center justify-between text-[10px] uppercase font-mono font-bold text-[#1B2820] hover:text-[#C4924A] transition-colors"
                    >
                      <span>🏷️ MANAGE SPECIALTY DIETARY TAGS ({tags.length} active)</span>
                      <span className="text-[9px] font-bold">{creatingTag ? "[-] COLLAPSE" : "[+] EXPAND MANAGER"}</span>
                    </button>

                    {creatingTag && (
                      <div className="mt-4 pt-4 border-t border-[#C8DFC0] space-y-4 text-xs font-sans">
                        <p className="text-[10px] text-[#6a8a70] uppercase leading-relaxed">
                          Configure visual labels (such as Gluten-Free, Vegan, High Fiber). Renders on dietary options filters.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {tags.map((tg) => (
                            <div key={tg.id} className="flex items-center justify-between bg-[#FDFAF4] border border-[#C8DFC0] p-2 rounded-xs">
                              <span className="font-semibold text-[#1B2820] text-[11px]">{tg.label} <code className="text-[8px] font-mono text-[#6a8a70]">({tg.id})</code></span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Do you wish to delete the "${tg.label}" tag?`)) {
                                    try {
                                      await onDeleteTag(tg.id);
                                      showNotification("Dietary tag erased successfully.");
                                    } catch (err) {
                                      showNotification("Failed deleting tag.", "error");
                                    }
                                  }
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add tags */}
                        <div className="p-3 bg-[#FDFAF4] border border-[#C8DFC0] rounded-xs flex flex-col sm:flex-row gap-2.5 items-end">
                          <div className="flex-1 space-y-1 w-full text-left">
                            <span className="text-[8px] uppercase tracking-wider font-mono text-[#6a8a70] block">Tag Title name</span>
                            <input
                              type="text"
                              value={newTagLabel}
                              onChange={(e) => {
                                setNewTagLabel(e.target.value);
                                if (!newTagId) {
                                  setNewTagId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                }
                              }}
                              placeholder="e.g. Organic"
                              className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-1.5 rounded-xs text-xs"
                            />
                          </div>

                          <div className="flex-1 space-y-1 w-full text-left">
                            <span className="text-[8px] uppercase tracking-wider font-mono text-[#6a8a70] block">Tag Unique ID (Alphanumeric only)</span>
                            <input
                              type="text"
                              value={newTagId}
                              onChange={(e) => setNewTagId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                              placeholder="e.g. organic"
                              className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-1.5 rounded-xs text-xs font-mono"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!newTagLabel.trim() || !newTagId.trim()) {
                                showNotification("Please specify label name and Tag ID.", "error");
                                return;
                              }
                              try {
                                await onAddTag(newTagId.trim(), newTagLabel.trim());
                                setNewTagId('');
                                setNewTagLabel('');
                                showNotification("New dietary criteria registered!");
                              } catch (err) {
                                showNotification("Could not create dietary tag.", "error");
                              }
                            }}
                            className="px-4 py-2 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] text-[9px] uppercase tracking-widest font-mono font-bold rounded-sm h-9 cursor-pointer whitespace-nowrap"
                          >
                            + Register Tag
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active List of dishes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems.map(item => (
                      <div 
                        key={item.id}
                        className="bg-[#FDFAF4] border border-[#C8DFC0] p-4 rounded-sm flex items-start justify-between gap-4 shadow-sm hover:border-[#C4924A] transition-colors"
                      >
                        <div className="flex items-start space-x-3 text-left">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 object-cover rounded-sm border border-[#C8DFC0] bg-[#F2EBD9] select-none"
                          />
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-[#6a8a70] font-mono font-bold block">{item.category}</span>
                            <h5 className="font-serif text-[12.5px] text-[#1B2820] font-semibold mt-0.5">{item.name}</h5>
                            <span className="text-[10px] text-[#C4924A] font-mono block mt-1">NRs. {item.price}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2 shrink-0">
                          <button
                            onClick={() => startEditItem(item)}
                            className="p-2 border border-[#C8DFC0] bg-[#F2EBD9] hover:bg-[#C8DFC0] rounded-sm text-[#1B2820] cursor-pointer transition-colors"
                            title="Edit Specialty Recipe Card"
                          >
                            <Edit2 className="w-3 h-3 text-[#C4924A]" />
                          </button>
                          <button
                            onClick={() => handleRecipeDelete(item.id)}
                            className="p-2 border border-red-200 bg-red-50 hover:bg-red-100 rounded-sm text-red-500 cursor-pointer transition-colors"
                            title="Discharge from ledger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                // Add / Edit Recipe Form
                <form onSubmit={handleSaveItemSubmit} className="space-y-6 bg-[#F2EBD9]/45 border border-[#C8DFC0] p-5 sm:p-6 rounded-md">
                  <div className="flex items-center justify-between border-b border-[#C8DFC0] pb-3">
                    <span className="text-[10.5px] uppercase tracking-widest font-mono font-bold text-[#1B2820] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C4924A]" />
                      <span>{isCreatingNew ? "DESIGN AN EXQUISITE NEW DELICACY RECIPE CARD" : `EDITING ${itemName.toUpperCase()}`}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => { setEditingItem(null); setIsCreatingNew(false); }}
                      className="text-[9px] uppercase tracking-widest font-bold text-red-600 hover:underline font-mono"
                    >
                      X Cancel Editing
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Recipe Card Title Designation *
                      </label>
                      <input 
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="e.g. Saffron Cardamom Brioche"
                        className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-2.5 rounded-sm text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Recipe Unique ID Tag (alphanumeric, no spaces) *
                      </label>
                      <input 
                        type="text"
                        value={itemId}
                        onChange={(e) => setItemId(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, '_'))}
                        placeholder="e.g. saffron-brioche"
                        className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-2.5 rounded-sm text-xs font-mono"
                        disabled={!isCreatingNew}
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Recipe Classification Category
                      </label>
                      <select
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-2.5 rounded-sm text-xs cursor-pointer"
                      >
                        {categories.filter(c => c.id !== 'all').map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label} ({cat.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Base Retail Value Price (NRs.) *
                      </label>
                      <input 
                        type="number"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(Number(e.target.value))}
                        placeholder="Price in Nepalese Rupees"
                        className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-2.5 rounded-sm text-xs font-mono"
                        required
                        min="0"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Detailed Description / Culinary Metaphor Prose *
                      </label>
                      <textarea 
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                        placeholder="Prose style metadata regarding sensory textures, altitude baking times, or sweet matching suggestions."
                        className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-2.5 rounded-sm text-xs font-serif min-h-[70px]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Why people love it (Passion Critique Description)
                      </label>
                      <input 
                        type="text"
                        value={itemWhyLoved}
                        onChange={(e) => setItemWhyLoved(e.target.value)}
                        placeholder="e.g. Meltingly light moisture and bold buttery notes."
                        className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-2.5 rounded-sm text-xs font-serif"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Historical Lore / Unique Fact origins
                      </label>
                      <input 
                        type="text"
                        value={itemFact}
                        onChange={(e) => setItemFact(e.target.value)}
                        placeholder="e.g. Crafted with yeasts harvested from forest rhododendron petals."
                        className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-2.5 rounded-sm text-xs font-serif"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5 text-left">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Ingredients Compositions (Separated with commas)
                      </label>
                      <input 
                        type="text"
                        value={itemIngredientsText}
                        onChange={(e) => setItemIngredientsText(e.target.value)}
                        placeholder="e.g. Organic Millet Flour, Saffron strands, Wild Clover Honey"
                        className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-2.5 rounded-sm text-xs"
                      />
                    </div>

                    {/* Master Delicacy Image Uploader & link options */}
                    <div className="sm:col-span-2 text-left space-y-1.5 border-t border-[#C8DFC0] pt-4">
                      <label className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Master Recipe Image Photograph (PC/Phone upload or Web link) *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div 
                          onClick={() => itemImgInputRef.current?.click()}
                          className="md:col-span-3 border-2 border-dashed border-[#C8DFC0] bg-[#FDFAF4] hover:bg-[#F2EBD9]/30 rounded-md p-5 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group"
                        >
                          <input 
                            type="file" 
                            accept="image/*" 
                            ref={itemImgInputRef}
                            onChange={handleItemImageUpload}
                            className="hidden" 
                          />
                          <Upload className="w-5 h-5 text-[#6a8a70] group-hover:text-[#C4924A] transition-colors mb-1" />
                          <span className="text-[9.5px] uppercase font-mono font-bold text-[#1B2820] group-hover:text-[#C4924A] transition-colors block">
                            SELECT FROM DEVICE
                          </span>
                          <span className="text-[8px] text-[#6a8a70] block mt-0.5">JPEG / PNG files compressed instantly</span>
                        </div>

                        <div className="md:col-span-2 border border-[#C8DFC0] bg-[#FDFAF4] p-2 rounded-md flex flex-col items-center justify-center text-center">
                          {itemImage ? (
                            <div className="space-y-1">
                              <img src={itemImage} alt="Recipe Visual Preview" className="w-20 h-14 object-cover rounded-sm border border-[#C8DFC0]" />
                              <button 
                                type="button" 
                                onClick={() => setItemImage('')}
                                className="text-[8.5px] text-red-600 uppercase font-mono hover:underline block mx-auto"
                              >
                                [❌ Clear image]
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] text-[#6a8a70] italic">No master photo assigned</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-left pt-2">
                        <span className="text-[8.5px] uppercase text-[#6a8a70] font-mono font-bold block">Alternative Image Web Address (Optional)</span>
                        <input
                          type="text"
                          className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-2 rounded-xs text-[10px]"
                          placeholder="Or copy and paste an external image web address (e.g., https://unsplash.com/...)"
                          value={itemImage}
                          onChange={(e) => setItemImage(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Interactive Dietary Criteria */}
                    <div className="sm:col-span-2 text-left space-y-1.5 border-t border-[#C8DFC0] pt-4">
                      <span className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                        Select Matching Dietary Badges / Quality tags
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => {
                          const isSelected = itemDietary.includes(tag.label);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleDietaryTag(tag.label)}
                              className={`px-3 py-1.5 rounded-sm border text-[10px] font-mono cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-[#2E4035] border-[#2E4035] text-[#FDFAF4] font-semibold' 
                                  : 'bg-[#FDFAF4] border-[#C8DFC0] text-[#1B2820] hover:bg-[#F2EBD9]'
                              }`}
                            >
                              {tag.label} {isSelected ? '✓' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TYPES & ENSEMBLE SUB-RECIPES MASTER SECTION */}
                    <div className="sm:col-span-2 text-left space-y-4 border-t-2 border-double border-[#C8DFC0] pt-5">
                      <div className="bg-[#F2EBD9]/60 p-3.5 border border-[#C8DFC0] rounded-sm">
                        <label className="text-[10px] uppercase font-mono font-bold text-[#1B2820] tracking-widest block flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#C4924A]" />
                          <span>✦ TYPES & CUSTOM FORMULATIONS DESIGNER ({itemOptions.length} registered):</span>
                        </label>
                        <p className="text-[9px] text-[#6a8a70] leading-normal font-sans pt-0.5">
                          Create distinctive Types, sensory variations, or sizes for this specialty recipe catalog card. When customers tap on the recipe card inside the menu grid, they can interactively view and select between these Types.
                        </p>

                        {/* Title of types selector label */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1 text-left sm:col-span-2">
                            <span className="text-[8.5px] uppercase text-[#6a8a70] font-mono font-bold block">Variations Selection Segment Label *</span>
                            <input
                              type="text"
                              className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-2 rounded-xs text-xs"
                              placeholder="e.g. Select Tea Infusion Brew, Choose Waffle Style, Select Formulation"
                              value={itemOptionsLabel}
                              onChange={(e) => setItemOptionsLabel(e.target.value)}
                            />
                          </div>

                          {/* Render Added formulation types */}
                          {itemOptions.length > 0 && (
                            <div className="sm:col-span-2 space-y-2 border-b border-[#C8DFC0] pb-4">
                              <span className="text-[8px] uppercase tracking-wider font-mono text-[#6a8a70] block">Registered Types draft:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {itemOptions.map((opt) => (
                                  <div key={opt.id} className="flex items-center justify-between border border-[#C8DFC0] bg-[#FDFAF4] p-2.5 rounded-sm">
                                    <div className="flex items-center space-x-2 text-left">
                                      {opt.image && (
                                        <img src={opt.image} alt={opt.name} className="w-8 h-8 object-cover rounded-sm border border-[#C8DFC0]" />
                                      )}
                                      <div>
                                        <span className="text-[11px] font-semibold text-[#1B2820] block">{opt.name}</span>
                                        <span className="text-[9px] text-[#C4924A] font-mono">+{opt.priceDelta} NRs</span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeTypeOption(opt.id)}
                                      className="p-1 border border-red-100 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                                      title="Remove type variant draft"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add a type form */}
                          <div className="sm:col-span-2 p-4 bg-[#FDFAF4] border border-[#C8DFC0] rounded-sm space-y-3">
                            <div className="border-b border-[#C8DFC0] pb-2">
                              <span className="text-[9.5px] uppercase font-mono font-extrabold text-[#C4924A] tracking-wider block">
                                Register/Design A New Formulation Type
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                              <div className="sm:col-span-4 space-y-1 text-left">
                                <span className="text-[8px] uppercase text-[#6a8a70] font-mono font-bold block">Type Designation Title *</span>
                                <input
                                  type="text"
                                  className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-1.5 rounded-xs text-xs"
                                  placeholder="e.g. Ceremonial Whisked, Honey-Oat Cold Cap"
                                  value={newOptName}
                                  onChange={(e) => setNewOptName(e.target.value)}
                                />
                              </div>

                              <div className="sm:col-span-2 space-y-1 text-left">
                                <span className="text-[8px] uppercase text-[#6a8a70] font-mono font-bold block">Price Delta Premium (NRs)</span>
                                <input
                                  type="number"
                                  className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-1.5 rounded-xs text-xs font-mono"
                                  placeholder="Price added e.g. +50"
                                  value={newOptPriceDelta}
                                  onChange={(e) => setNewOptPriceDelta(Number(e.target.value))}
                                  min="0"
                                />
                              </div>

                              <div className="sm:col-span-6 space-y-1 text-left">
                                <span className="text-[8px] uppercase text-[#6a8a70] font-mono font-bold block">Detailed Formulation Description / Sensory Notes *</span>
                                <textarea
                                  className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-2 rounded-xs text-xs font-serif min-h-[50px]"
                                  placeholder="Express the physical attributes, tea roasting times, or milk foam density for this specialized variant."
                                  value={newOptDesc}
                                  onChange={(e) => setNewOptDesc(e.target.value)}
                                />
                              </div>

                              {/* Form Option base image uploader */}
                              <div className="sm:col-span-6 space-y-1 text-left">
                                <span className="text-[8px] uppercase text-[#6a8a70] font-mono font-bold block">Formulation Type Image Base Photo (PC / Phone or URL)</span>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                                  <div
                                    onClick={() => optImgInputRef.current?.click()}
                                    className="md:col-span-3 border-2 border-dashed border-[#C8DFC0] bg-[#FDFAF4] hover:bg-[#F2EBD9]/20 p-4 rounded-md flex flex-col items-center justify-center cursor-pointer text-center group"
                                  >
                                    <input
                                      type="file"
                                      ref={optImgInputRef}
                                      onChange={handleOptImageUpload}
                                      accept="image/*"
                                      className="hidden"
                                    />
                                    <Upload className="w-4 h-4 text-[#6a8a70] group-hover:text-[#C4924A] mb-1" />
                                    <span className="text-[8.5px] uppercase font-mono font-bold text-[#1B2820] group-hover:text-[#C4924A] block">
                                      SELECT PHOTO FILE
                                    </span>
                                  </div>

                                  <div className="md:col-span-2 border border-[#C8DFC0] bg-[#FDFAF4] p-1.5 rounded-md flex flex-col items-center justify-center text-center">
                                    {newOptImage ? (
                                      <div className="space-y-1">
                                        <img src={newOptImage} alt="Type Visual" className="w-16 h-10 object-cover rounded-sm border border-[#C8DFC0] shadow-2xs mx-auto" />
                                        <button
                                          type="button"
                                          onClick={() => setNewOptImage('')}
                                          className="text-[8px] text-[#C4924A] font-mono font-bold uppercase block"
                                        >
                                          [❌ Clear]
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[8.5px] text-[#6a8a70] italic">No image loaded</span>
                                    )}
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-1.5 rounded-xs text-[9.5px] mt-2 block"
                                  placeholder="Alternative formulation photo address (e.g. Https://...)"
                                  value={newOptImage}
                                  onChange={(e) => setNewOptImage(e.target.value)}
                                />
                              </div>

                              <div className="sm:col-span-6 space-y-1 text-left">
                                <span className="text-[8px] uppercase text-[#6a8a70] font-mono font-bold block">Specific Ingredients Compositions (Optional)</span>
                                <input
                                  type="text"
                                  className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-1.5 rounded-xs text-xs"
                                  placeholder="Separate with commas e.g. Organic lavender buds, oat milk float"
                                  value={newOptIngredients}
                                  onChange={(e) => setNewOptIngredients(e.target.value)}
                                />
                              </div>

                              <div className="sm:col-span-3 space-y-1 text-left">
                                <span className="text-[8px] uppercase text-[#6a8a70] font-mono font-bold block">Passion Critique Comments / Why Loved (Optional)</span>
                                <input
                                  type="text"
                                  className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-1.5 rounded-xs text-xs font-serif"
                                  placeholder="Why people love this variation"
                                  value={newOptWhyLoved}
                                  onChange={(e) => setNewOptWhyLoved(e.target.value)}
                                />
                              </div>

                              <div className="sm:col-span-3 space-y-1 text-left">
                                <span className="text-[8px] uppercase text-[#6a8a70] font-mono font-bold block">Historical Lore / Unique Fun Fact (Optional)</span>
                                <input
                                  type="text"
                                  className="w-full bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] p-1.5 rounded-xs text-xs font-serif"
                                  placeholder="Behind key lore facts of this variant"
                                  value={newOptFact}
                                  onChange={(e) => setNewOptFact(e.target.value)}
                                />
                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={handleAddTypeOption}
                              className="px-4 py-2 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] text-[9px] uppercase font-bold tracking-wider rounded-sm transition-colors cursor-pointer font-mono flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Append Formulation Type to Card</span>
                            </button>

                          </div>

                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-[#C8DFC0] flex justify-end space-x-2.5">
                    <button
                      type="button"
                      onClick={() => { setEditingItem(null); setIsCreatingNew(false); }}
                      className="px-4 py-2.5 bg-transparent border border-[#C8DFC0] text-[#1B2820] hover:bg-[#F2EBD9] transition-colors rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Dismiss Form
                    </button>
                    <button
                      type="submit"
                      disabled={savingItem}
                      className="px-6 py-2.5 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] font-mono font-bold text-[9.5px] uppercase tracking-widest transition-colors rounded-sm cursor-pointer disabled:opacity-50"
                    >
                      {savingItem ? "COMMITTING TO SYSTEM..." : "COMMIT EXQUISITE RECIPE CARD ✒️"}
                    </button>
                  </div>

                </form>
              )}

            </div>
          )}

          {/* TAB 3: CUSTOMER MEMORIES / GALLERY MANAGEMENT */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-4 bg-[#F2EBD9] border border-[#C8DFC0] text-xs leading-relaxed space-y-1 text-left rounded-sm">
                <p className="font-bold text-[#C4924A] font-mono text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Interactive Customers Gallery Archive Ledger ({parlorMemories.length} memories)</span>
                </p>
                <p className="font-serif">
                  Below you can audit and Purge/Delete guest-uploaded memory snaps from the teahouse parlor greenhouse wall. Purged memories will be instantly dissolved from the top cycling Polaroid carousel and greenhouse polaroid stack in real-time, matching the secure cloud rules.
                </p>
              </div>

              {parlorMemories.length === 0 ? (
                <div className="p-12 border border-[#C8DFC0] text-center bg-[#F2EBD9]/20 rounded-md">
                  <ImageIcon className="w-8 h-8 text-[#6a8a70]/55 mx-auto mb-2" />
                  <p className="font-serif text-[#1B2820] text-[13px] italic">No custom user-uploaded gallery posts found in the archives ledger at this moment.</p>
                  <p className="text-[10px] text-[#6a8a70] uppercase font-mono font-bold tracking-wider mt-1">Pre-seeded memories remain stored safely in offline index files.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {parlorMemories.map((memo) => (
                    <div 
                      key={memo.id}
                      className="bg-[#FDFAF4] border border-[#C8DFC0] rounded-sm overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative"
                    >
                      <div className="relative h-44 w-full bg-black/5 flex items-center justify-center">
                        <img 
                          src={memo.imageUrl} 
                          alt={memo.caption} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover select-none"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-xs text-[8px] font-mono uppercase text-[#FDFAF4] tracking-wider">
                          {memo.guestName || 'Anonymous Guest'}
                        </div>
                      </div>

                      <div className="p-3 text-left space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <p className="text-[11.5px] font-serif leading-relaxed italic text-[#1B2820]">
                            &ldquo;{memo.caption}&rdquo;
                          </p>
                          <span className="text-[8px] font-mono text-[#6a8a70] block uppercase">
                            Date: {memo.createdAt?.seconds ? new Date(memo.createdAt.seconds * 1000).toLocaleString() : 'Recent Capture'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-[#C8DFC0]/60">
                          <button
                            type="button"
                            disabled={isDeletingMemoId === memo.id}
                            onClick={() => handleMemoryDelete(memo.id)}
                            className="w-full py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-400 text-red-600 rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isDeletingMemoId === memo.id ? "PURGING FROM WALL..." : "PURGE MEMORY 🌿"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SCRIBE KEY SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-4 bg-[#F2EBD9] border border-[#C8DFC0] rounded-sm text-xs leading-relaxed space-y-1.5 text-left">
                <p className="font-bold text-[#C4924A] font-mono text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" />
                  <span>Scribe Cryptographic Protocol Signature</span>
                </p>
                <p className="font-serif">
                  Rotate the secret administrative key below. This passcode is required to authorize any dynamic changes (adding recipes, updating prices, or modifying branding guidelines) to the live Firestore database.
                </p>
                <p className="text-[10px] text-[#6a8a70] uppercase leading-none font-sans font-semibold mt-1">
                  Rotate this key periodically to keep credentials fresh and traceably secure.
                </p>
              </div>

              <form onSubmit={handleUpdatePasswordSubmit} className="space-y-5">
                <div className="space-y-4 text-left">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                      New Secret Administrative Key:
                    </label>
                    <input 
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="At least 8 elements/characters"
                      className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-3.5 rounded-sm text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider block font-mono">
                      Repeat New Secret Key Password:
                    </label>
                    <input 
                      type="password"
                      value={repeatPasswordInput}
                      onChange={(e) => setRepeatPasswordInput(e.target.value)}
                      placeholder="Confirm the key accurately"
                      className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] focus:border-[#C4924A] focus:outline-none p-3.5 rounded-sm text-xs font-mono"
                      required
                    />
                  </div>

                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full py-3.5 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] rounded-sm text-[9px] font-mono font-bold uppercase tracking-widest cursor-pointer transition-colors disabled:opacity-50"
                >
                  {updatingPassword ? "ROTATING KEY MASTER SIGNATURES..." : "AUTHORIZE KEY ROTATION 🔒"}
                </button>
              </form>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

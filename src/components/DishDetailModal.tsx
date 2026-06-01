import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Sparkle, Sparkles, MessageCircle, GlassWater } from 'lucide-react';
import { MenuItem, MenuItemOption } from '../types';
import DishReviews from './DishReviews';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHelper';

interface DishDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  allDishStats?: Record<string, { likesCount?: number; commentCount?: number }>;
  isAdmin?: boolean;
}

export default function DishDetailModal({
  isOpen,
  onClose,
  menuItem,
  allDishStats,
  isAdmin,
}: DishDetailModalProps) {
  if (!isOpen || !menuItem) return null;

  // Local interactive option states
  const [selectedOption, setSelectedOption] = useState<MenuItemOption | null>(
    menuItem.options && menuItem.options.length > 0 ? menuItem.options[0] : null
  );
  const [isLoved, setIsLoved] = useState<boolean>(false);
  const [showLoveAnimation, setShowLoveAnimation] = useState<boolean>(false);

  const activeDishId = selectedOption ? `${menuItem.id}_${selectedOption.id}` : menuItem.id;
  const currentStats = allDishStats?.[activeDishId];

  // Reset selected option when active menu item changes
  useEffect(() => {
    if (menuItem) {
      setSelectedOption(menuItem.options && menuItem.options.length > 0 ? menuItem.options[0] : null);
    }
  }, [menuItem]);

  // Read current live loved status based on selected suboption/variant or simple drink
  useEffect(() => {
    if (activeDishId) {
      const loved = localStorage.getItem(`hasLiked-${activeDishId}`) === 'true';
      setIsLoved(loved);
    }
  }, [activeDishId]);

  const toggleFavorite = async () => {
    const newState = !isLoved;
    setIsLoved(newState);

    try {
      const statsRef = doc(db, 'dish_stats', activeDishId);
      const snap = await getDoc(statsRef);
      if (newState) {
        // Increment live database likesCount
        if (!snap.exists()) {
          await setDoc(statsRef, { likesCount: 1 });
        } else {
          await updateDoc(statsRef, { likesCount: increment(1) });
        }
        localStorage.setItem(`hasLiked-${activeDishId}`, 'true');
        setShowLoveAnimation(true);
        setTimeout(() => setShowLoveAnimation(false), 800);
      } else {
        // Decrement live database likesCount
        if (snap.exists() && (snap.data().likesCount || 0) > 0) {
          await updateDoc(statsRef, { likesCount: increment(-1) });
        }
        localStorage.removeItem(`hasLiked-${activeDishId}`);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `dish_stats/${activeDishId}`);
    }
  };

  const basePrice = menuItem.price;
  const priceDelta = selectedOption ? selectedOption.priceDelta : 0;
  const singlePrice = basePrice + priceDelta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" id="premium-modal-viewport">
      {/* Sleek low-key backdrop */}
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         onClick={onClose}
         className="fixed inset-0 bg-[#1B2820]/75 backdrop-blur-md"
      />

      {/* Cloud-weight elegant modal chassis */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.99 }}
        transition={{ type: "spring", damping: 30, stiffness: 240 }}
        className="relative w-full max-w-2xl bg-[#F2EBD9] border border-[#C8DFC0] text-[#1B2820] rounded-2xl shadow-polaroid overflow-hidden max-h-[92vh] flex flex-col z-10 gold-trim"
        id="premium-modal-shell"
      >
        {/* Floating clean buttons */}
        <div className="absolute top-5 right-5 z-20 flex gap-2">
          <button
            onClick={toggleFavorite}
            className="p-3 bg-[#FDFAF4]/95 border border-[#C8DFC0] hover:bg-[#F2EBD9] text-[#C4924A] focus:outline-none transition-all rounded-full cursor-pointer shadow-sm hover:scale-105"
            title="Mark Favorite"
            type="button"
          >
            <Heart className={`w-4 h-4 transition-all ${
              isLoved ? 'fill-current text-[#C4924A] scale-110' : 'text-[#C4924A]'
            }`} />
          </button>
          
          <button
            onClick={onClose}
            className="p-3 bg-[#FDFAF4]/95 border border-[#C8DFC0] hover:bg-[#F2EBD9] text-[#6a8a70] hover:text-[#1B2820] focus:outline-none transition-all rounded-full cursor-pointer shadow-sm hover:scale-105"
            title="Close Book"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal scrolling body */}
        <div className="overflow-y-auto flex-1 pb-6 text-left">
          
          {/* Main Visual Frame */}
          <div className="relative h-64 sm:h-80 w-full overflow-hidden border-b border-[#C8DFC0] bg-[#F2EBD9]">
            <img
              src={selectedOption?.image || menuItem.image}
              alt={selectedOption?.name || menuItem.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover select-none filter contrast-[1.02]"
            />
            {/* Soft vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1B2820]/85 via-[#1B2820]/20 to-transparent pointer-events-none" />

            {/* Title display */}
            <div className="absolute bottom-6 left-6 right-6 space-y-1">
              <div className="inline-flex items-center space-x-1.5 bg-[#C4924A]/10 border border-[#C4924A]/40 text-[#C4924A] text-[9px] uppercase tracking-[0.2em] font-medium px-3 py-1 rounded-sm backdrop-blur-md">
                <span>🍃 GOURMET REVELATION</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-serif text-[#FDFAF4] tracking-tight pt-1">
                {selectedOption?.name || menuItem.name}
              </h2>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6 space-y-6">
            
            {/* Detailed stats view */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[#C8DFC0]">
              <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] bg-[#F2EBD9] border border-[#C8DFC0] text-[#1B2820] font-mono tracking-wider rounded-sm">
                <span className="flex items-center gap-1.5" title="Option Enjoys">
                  <Heart className="w-3.5 h-3.5 text-[#C4924A] fill-current" />
                  {currentStats?.likesCount || 0} Appreciations
                </span>
                <span className="border-l border-[#C8DFC0] pl-3 flex items-center gap-1.5" title="Option Chronicles">
                  <span>✒️</span>
                  {currentStats?.commentCount || 0} Ledger Entries
                </span>
              </div>

              {/* Status Badges */}
              {menuItem.dietary.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 text-[9px] uppercase font-semibold border border-[#C8DFC0] text-[#1B2820] bg-[#FDFAF4] tracking-wider rounded-sm flex items-center"
                >
                  {tag === 'Vegetarian' || tag === 'Vegan' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
                  ) : tag === 'Chef Special' ? (
                    <Sparkles className="w-3.5 h-3.5 text-[#C4924A] mr-1.5 fill-current" />
                  ) : (
                    <Sparkle className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
                  )}
                  {tag}
                </span>
              ))}
            </div>

            {/* Profile Context */}
            <div className="bg-[#FDFAF4] border-l-2 border-[#C4924A] p-5 shadow-sm rounded-r-md border-y border-r border-[#C8DFC0]">
              <h3 className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#C4924A] font-display">
                Artisanal Profile
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-[#1B2820] font-serif pt-2 whitespace-pre-line">
                {menuItem.description}
              </p>
            </div>

            {/* NESTED ENSEMBLE VARIANT CHOICE */}
            {menuItem.options && menuItem.options.length > 0 && (
              <div className="p-5 bg-[#FDFAF4] border border-[#C8DFC0] rounded-md relative shadow-sm">
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-[#C8DFC0] pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#C4924A]" />
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1B2820] font-display">
                      {menuItem.optionsLabel || 'Exquisite Variations'}
                    </h4>
                  </div>
                  <span className="text-[9px] text-[#6a8a70] font-mono">
                    Select a variation to filter the guest ledger
                  </span>
                </div>

                {/* Sub-recipes cards selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {menuItem.options.map((opt) => {
                    const isSelected = selectedOption?.id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt)}
                        type="button"
                        className={`w-full flex items-center p-3 rounded-md border text-left transition-all duration-300 focus:outline-none cursor-pointer ${
                          isSelected
                            ? 'bg-[#F2EBD9] border-[#C4924A] text-[#C4924A] font-medium'
                            : 'bg-[#FDFAF4] border-[#C8DFC0] text-[#6a8a70] hover:border-[#C4924A]'
                        }`}
                      >
                        {opt.image && (
                          <img 
                            src={opt.image} 
                            alt={opt.name} 
                            className={`w-10 h-10 object-cover rounded-sm mr-3 border ${
                              isSelected ? 'border-[#C4924A]' : 'border-[#C8DFC0]'
                            }`} 
                          />
                        )}
                        <div className="flex flex-col justify-center flex-1 overflow-hidden">
                          <span className="text-[11px] uppercase tracking-wide leading-tight">{opt.name}</span>
                          {opt.priceDelta > 0 && (
                            <span className="text-[10px] text-[#C4924A] mt-0.5">
                              +{opt.priceDelta} NRs
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-recipe specifics */}
                {selectedOption && (
                  <motion.div
                    key={selectedOption.id}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-dashed border-[#C8DFC0] mt-4 bg-[#F2EBD9] rounded-md text-[#1B2820] text-xs leading-relaxed space-y-3"
                  >
                    <div>
                      <span className="uppercase text-[9px] text-[#C4924A] block font-semibold tracking-wider font-display">Craft Preparation</span>
                      <p className="mt-0.5 text-[#1B2825] font-serif">{selectedOption.description}</p>
                    </div>

                    {selectedOption.proteinSource && (
                      <div className="p-3 bg-[#FDFAF4] border-l border-[#C8DFC0] rounded-r-md">
                        <span className="text-[9px] uppercase tracking-wider block text-[#6a8a70] font-bold font-display">Tasting Notes</span>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-[#1B2820] font-serif">{selectedOption.proteinSource}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#C8DFC0] text-left">
                      <div>
                        <span className="text-[9px] tracking-wider text-[#6a8a70] uppercase block font-bold font-display">Critique Review:</span>
                        <p className="text-[#1B2820] mt-0.5 text-[11px] leading-relaxed font-sans">{selectedOption.whyPeopleLoveIt}</p>
                      </div>
                      <div>
                        <span className="text-[9px] tracking-wider text-[#6a8a70] uppercase block font-bold font-display">Origins & Lore:</span>
                        <p className="italic text-[#6a8a70] leading-relaxed text-[11px] mt-0.5 font-serif">"{selectedOption.funFact}"</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Lore, legends & historic chronicles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#FDFAF4] border border-[#C8DFC0] rounded-md p-4.5 space-y-1 my-auto shadow-sm">
                <span className="text-[9px] uppercase tracking-wider text-[#6a8a70] block font-bold font-display">Why Adored</span>
                <p className="text-xs leading-relaxed text-[#1B2820] font-serif">
                  {menuItem.whyLoved}
                </p>
              </div>

              <div className="bg-[#FDFAF4] border border-[#C8DFC0] rounded-md p-4.5 space-y-1 my-auto shadow-sm">
                <span className="text-[9px] uppercase tracking-wider text-[#6a8a70] block font-bold font-display">Culinary Lore</span>
                <p className="italic text-xs leading-relaxed text-[#6a8a70] font-serif">
                  "{menuItem.fact}"
                </p>
              </div>
            </div>

            {/* Ingredients listings */}
            <div className="space-y-2">
              <h4 className="text-[9px] uppercase font-bold text-[#6a8a70] tracking-wider block text-left font-display">
                Precious Natural Components
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedOption ? selectedOption.ingredients : menuItem.ingredients).map((ing) => (
                  <span
                    key={ing}
                    className="bg-[#FDFAF4] border border-[#C8DFC0] hover:border-[#C4924A] text-[#1B2820] px-3 py-1 text-[10.5px] tracking-wide rounded-sm shadow-xs transition-all duration-200"
                  >
                    ✦ {ing}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive guest ledger review section */}
            <div className="border-t border-[#C8DFC0] pt-6">
              <DishReviews dishId={activeDishId} isAdmin={isAdmin} />
            </div>
          </div>
        </div>

        {/* Modal base lock toolbar */}
        <div className="border-t border-[#C8DFC0] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FDFAF4] relative z-10 text-left">
          <div className="flex items-center space-x-3">
            <span className="text-[9px] text-[#6a8a70] uppercase font-bold tracking-widest font-mono">
              Premium Tariffs:
            </span>
            <div className="py-1 px-4 bg-[#F2EBD9] border border-[#C8DFC0] rounded-sm">
              <span className="text-sm font-bold text-[#1B2820] font-mono">
                NRs. {singlePrice}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-7 h-11 bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] text-[10px] uppercase tracking-widest font-bold transition-all rounded-sm cursor-pointer shadow-sm hover:shadow-md"
            type="button"
          >
            Close Reflection
          </button>
        </div>

        {/* Heart animation overlay */}
        <AnimatePresence>
          {showLoveAnimation && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center text-[#C4924A]"
            >
              <Heart className="w-24 h-24 fill-current drop-shadow-md" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageSquare, ArrowRight } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuItemCardProps {
  key?: string | number;
  item: MenuItem;
  index: number;
  isFav: boolean;
  dishStats: Record<string, { likesCount?: number; commentCount?: number }>;
  onInspect: (item: MenuItem) => void;
  isFirst: boolean;
  filteredCount: number;
}

export default function MenuItemCard({
  item,
  index,
  isFav,
  dishStats,
  onInspect,
  isFirst,
  filteredCount
}: MenuItemCardProps) {
  const [cycleIndex, setCycleIndex] = useState(0);

  // Auto-rotate through internal recipes (options) every 8 seconds per Rule 1
  useEffect(() => {
    if (!item.options || item.options.length <= 1) return;
    const interval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % item.options!.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [item]);

  // Determine current display values based on active option cycle
  const hasOptions = item.options && item.options.length > 0;
  const currentOption = hasOptions ? item.options![cycleIndex] : null;

  // Image cycles through suboptions or defaults to parent
  const currentImage = currentOption?.image || item.image;

  // Title dynamically switches to the name of the currently selected option/sub-recipe
  const currentName = currentOption ? currentOption.name : item.name;

  // Price cycles or defaults
  const basePrice = item.price;
  const priceDelta = currentOption ? currentOption.priceDelta : 0;
  const currentPrice = basePrice + priceDelta;

  // Aggregated total likes / comments of the parent item and all its nested sub-recipes combined
  const aggregateLikes = item.options 
    ? item.options.reduce((sum, opt) => sum + (dishStats[`${item.id}_${opt.id}`]?.likesCount || 0), 0) + (dishStats[item.id]?.likesCount || 0) 
    : (dishStats[item.id]?.likesCount || 0);

  const aggregateComments = item.options 
    ? item.options.reduce((sum, opt) => sum + (dishStats[`${item.id}_${opt.id}`]?.commentCount || 0), 0) + (dishStats[item.id]?.commentCount || 0) 
    : (dishStats[item.id]?.commentCount || 0);

  const getCourseDescriptor = () => {
    switch (item.category) {
      case 'signatures': return '✦ Artisan Patisserie Signature';
      case 'beverages': return '✦ Botanical Cold-Whisk Infusion';
      case 'bakes': return '✦ Hearth-Baked Selection';
      default: return '✦ Gourmet Creation';
    }
  };

  const getOriginLabel = () => {
    switch (item.id) {
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
    <motion.div
       layout
       onClick={() => onInspect(item)}
       className={`bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] shadow-scrapbook hover:shadow-polaroid bouncy-hover transition-all duration-400 overflow-hidden flex flex-col h-full cursor-pointer group text-left relative rounded-sm gold-trim ${
         isFirst && filteredCount > 1 ? 'md:col-span-2 md:grid md:grid-cols-12 gap-1 items-stretch' : ''
       }`}
    >
      {/* Ribbon banner inside asymmetrical card */}
      {isFirst && filteredCount > 1 && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C4924A] via-[#C8DFC0] to-[#C4924A] z-10" />
      )}

      {/* Interactive indicator dot */}
      <div className="absolute top-3.5 right-4 z-10 flex items-center space-x-1.5 bg-[#FDFAF4]/90 border border-[#C8DFC0] backdrop-blur-xs py-1 px-2 rounded-lg text-[8px] tracking-widest font-mono text-[#A8C5A0]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#A8C5A0] animate-pulse" />
        <span>LIVE LEDGER</span>
      </div>

      {/* Display Image Frame */}
      <div className={`relative w-full overflow-hidden shrink-0 bg-[#F2EBD9] border-b border-[#C8DFC0] ${
        isFirst && filteredCount > 1 
          ? 'h-64 sm:h-auto md:col-span-5 md:border-b-0 md:border-r md:border-[#C8DFC0]' 
          : 'h-52'
      }`}>
        <div className="w-full h-full relative group-hover:scale-101 duration-500 transition-all">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={currentImage}
              initial={{ opacity: 0.75, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.75 }}
              transition={{ duration: 1.2 }}
              src={currentImage}
              alt={currentName}
              className="w-full h-full absolute inset-0 object-cover filter brightness-[0.98] contrast-[1.02]"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
        </div>

        {/* Top indicators */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none select-none">
          <span className="px-3 py-1 text-[8.5px] font-bold bg-[#FDFAF4] text-[#1B2820] border border-[#C8DFC0] uppercase tracking-wider rounded-sm shadow-xs font-mono">
             N° 0{index + 1}
          </span>
          
          {/* Saved favorite heart sticker */}
          {isFav && (
            <span className="p-1 px-1.5 bg-[#FDFAF4] border border-[#C8DFC0] text-[#C4924A] text-[10px] flex items-center justify-center rounded-sm shadow-xs">
              <Heart className="w-3 text-[#C4924A] fill-current" />
            </span>
          )}
        </div>

        {/* Cost sticker */}
        <div className="absolute bottom-4 right-4 py-1 px-3 bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] text-[11px] font-bold tracking-wide shadow-xs rounded-sm font-mono">
          NRs. {currentPrice}
        </div>
      </div>

      {/* Card Content parameters */}
      <div className={`p-5 flex-1 flex flex-col justify-between space-y-4 ${
        isFirst && filteredCount > 1 ? 'md:col-span-7' : ''
      }`}>
        <div className="space-y-2 text-left">
          <span className="text-[9px] tracking-widest uppercase font-bold text-[#6a8a70] block leading-none font-display">
            {getCourseDescriptor()}
          </span>

          <h3 className="text-md sm:text-[17px] font-serif text-[#1B2820] group-hover:text-[#C4924A] transition-colors duration-250 leading-tight">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentName}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.25 }}
                className="block"
              >
                {currentName}
              </motion.span>
            </AnimatePresence>
          </h3>

          <p className="text-xs leading-relaxed text-[#6a8a70] font-serif line-clamp-2 pt-1 font-light min-h-[32px]">
            {currentOption ? currentOption.description : item.description}
          </p>
        </div>

        {/* Origin details */}
        <div className="py-2 px-3 bg-[#F2EBD9] border-l border-[#C4924A] text-left border border-y-[#C8DFC0]">
          <span className="text-[8.5px] uppercase tracking-wider text-[#6a8a70] block font-mono leading-none">
            Origins • {getOriginLabel()}
          </span>
        </div>

        {/* Outer view aggregated sum stats display */}
        <div className="flex items-center justify-between pt-3 border-t border-[#C8DFC0] shrink-0 select-none">
          <div className="flex items-center gap-3 font-mono text-[9px] text-[#6a8a70] uppercase tracking-wider">
            <span className="flex items-center gap-1.5" title="Aggregated Likes of All Variants">
              <Heart className="w-3.5 h-3.5 text-[#C4924A] fill-current" />
              {aggregateLikes} Enjoys
            </span>
            <span className="flex items-center gap-1.5" title="Aggregated Chronicles of All Variants">
              <MessageSquare className="w-3.5 h-3.5 text-[#6a8a70]" />
              {aggregateComments} Chronicles
            </span>
          </div>
          
          <div className="text-[9.5px] uppercase font-bold flex items-center space-x-1 text-[#1B2820] tracking-wider group-hover:translate-x-1 duration-250 transition-transform font-mono">
            <span>Inspect</span>
            <ArrowRight className="w-3 h-3 text-[#C4924A]" />
          </div>
        </div>

      </div>
    </motion.div>
  );
}

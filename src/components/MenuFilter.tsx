import { Search, Compass, Sparkles, Heart, Coffee, Leaf, Eye, Star } from 'lucide-react';
import { CategoryTab } from '../types';

interface MenuFilterProps {
  categories: CategoryTab[];
  activeCategory: string;
  onActiveCategoryChange: (id: any) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedDietary: string; // active tag filter
  onDietaryChange: (diet: string) => void; // toggle tag filter
  tags: any[];
}

export default function MenuFilter({
  categories,
  activeCategory,
  onActiveCategoryChange,
  searchQuery,
  onSearchQueryChange,
  selectedDietary,
  onDietaryChange,
  tags
}: MenuFilterProps) {
  const tagFilters = [
    { label: '✦ All Curated Creations', value: 'all' },
    ...tags.map(tg => ({ label: tg.label, value: tg.id }))
  ];

  return (
    <div className="space-y-6 text-left" id="premium-patisserie-portal">
      {/* Handcrafted subtitle */}
      <div className="flex items-center justify-center space-x-2 opacity-85 select-none py-1">
        <div className="h-[1px] w-6 bg-[#C8DFC0]" />
        <span className="text-[9px] uppercase tracking-[0.25em] text-[#C4924A] font-bold font-display">ARTISAN COFFEE & FINE BOTANICALS</span>
        <div className="h-[1px] w-6 bg-[#C8DFC0]" />
      </div>

      {/* Modern refined Search Bar */}
      <div className="space-y-2">
        <label htmlFor="search-input" className="text-[10px] uppercase tracking-[0.15em] text-[#6a8a70] font-bold block text-left font-display">
          Search Recipes & Confections
        </label>
        <div className="flex gap-2 animate-fadeIn">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#C4924A] mt-[1px]" />
            </div>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search matcha, latte, toast..."
              className="w-full text-xs bg-[#FDFAF4] border border-[#C8DFC0] focus:border-[#C4924A] text-[#1B2820] placeholder-[#6a8a70] py-3 pl-10 pr-12 rounded-sm focus:outline-none transition-all duration-300 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[10px] text-[#6a8a70] hover:text-[#1B2820] font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                type="button"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="button"
            className="px-4.5 bg-[#2E4035] hover:bg-[#1B2820] border border-[#2E4035] text-[#A8C5A0] rounded-sm text-[10px] uppercase tracking-widest font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 hover:brightness-110 active:scale-95"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Culinary Category list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#C8DFC0] pb-2">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#6a8a70] font-bold block font-display">
            Menu Collections
          </span>
          <Coffee className="w-4 h-4 text-[#C4924A]" />
        </div>
        
        <div className="flex flex-col gap-1.5 pt-1" id="category-scroller-tabs">
          {categories.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onActiveCategoryChange(tab.id)}
                type="button"
                className={`group flex items-center justify-between py-3 px-4 rounded-sm transition-all duration-300 focus:outline-none text-left cursor-pointer border ${
                  isActive
                    ? 'bg-[#1B2820] border-[#1B2820] text-[#A8C5A0] font-medium shadow-sm'
                    : 'bg-[#FDFAF4] border-[#C8DFC0] text-[#1B2820] hover:border-[#C4924A] hover:bg-[#F2EBD9]'
                }`}
              >
                <div className="flex items-center space-x-3 text-xs">
                  {tab.id === 'all' && (
                    <Coffee className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C8DFC0]' : 'text-[#C4924A]'}`} />
                  )}
                  {tab.id === 'signatures' && (
                    <Sparkles className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#A8C5A0]' : 'text-[#C4924A]'}`} />
                  )}
                  {tab.id === 'beverages' && (
                    <Compass className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#A8C5A0]' : 'text-[#C4924A]'}`} />
                  )}
                  {tab.id === 'bakes' && (
                    <Leaf className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#A8C5A0]' : 'text-[#C4924A]'}`} />
                  )}
                  <span className="uppercase font-semibold tracking-wider font-sans text-xs">
                    {tab.label}
                  </span>
                </div>
                
                {isActive ? (
                  <span className="text-[#A8C5A0] text-xs font-bold leading-none">✦</span>
                ) : (
                  <span className="text-[#6a8a70] text-[10px] group-hover:translate-x-1 transition-transform">→</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Delicacy Tags filter blocks */}
      <div className="space-y-3 pt-5 border-t border-[#C8DFC0]">
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#6a8a70] font-bold block font-display">
          Delicacy Tags
        </span>
        
        <div className="flex flex-col gap-1.5 pt-1">
          {tagFilters.map((tg) => {
            const isSelected = selectedDietary === tg.value;
            return (
              <button
                key={tg.value}
                onClick={() => onDietaryChange(tg.value)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-sm text-[10.5px] uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#FDFAF4] text-[#C4924A] border-[#C4924A] font-semibold'
                    : 'bg-[#FDFAF4] text-[#1B2820] border-[#C8DFC0] hover:border-[#C4924A]'
                }`}
                type="button"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-sans block">{tg.label}</span>
                </div>
                {isSelected && (
                  <Heart className="w-3 h-3 text-[#C4924A] fill-current shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

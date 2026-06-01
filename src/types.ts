export interface MenuItemOption {
  id: string;
  name: string;
  description: string;
  proteinSource?: string;
  whyPeopleLoveIt?: string;
  funFact?: string;
  priceDelta: number; // relative adjustment, e.g. +50 for Steam vs +100 for Jhol
  ingredients: string[];
  image?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  nepaliName?: string;
  category: string;
  price: number; // in NRs e.g. 550
  description: string;
  whyLoved: string;
  fact: string;
  ingredients: string[];
  image: string;
  rating: number; // e.g. 4.9
  reviewCount: number;
  spicyLevel: 0 | 1 | 2 | 3; // 0=None, 1=Mild, 2=Medium, 3=Himalayan Fire
  dietary: string[];
  optionsLabel?: string; // e.g., "Select Momo Style"
  options?: MenuItemOption[];
}

export interface CartItem {
  id: string; // unique item id
  menuItemId: string;
  name: string;
  selectedOptionId?: string;
  selectedOptionName?: string;
  price: number;
  quantity: number;
  spiceLevel: number;
  notes: string;
}

export type CategoryTab = {
  id: MenuItem['category'] | 'all';
  label: string;
  icon: string; // Lucide icon name
};

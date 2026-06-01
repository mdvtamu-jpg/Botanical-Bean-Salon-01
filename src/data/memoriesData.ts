export interface MemoryPost {
  id?: string;
  guestName: string;
  caption: string;
  imageUrl: string;
  createdAt?: any;
}

// Aesthetic pre-selected backdrops so guests can easily pick one if they do not have a custom URL
export const PHOTO_PRESETS = [
  {
    name: "Cozy Books & Tea",
    url: "https://images.unsplash.com/photo-1463797900201-d17409400157?auto=format&fit=crop&q=80&w=600",
    icon: "📖"
  },
  {
    name: "Matcha Latte Prep",
    url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600",
    icon: "🍵"
  },
  {
    name: "Cozy Parlor Fireplace",
    url: "https://images.unsplash.com/photo-1542181961-9590d0c37bb6?auto=format&fit=crop&q=80&w=600",
    icon: "🔥"
  },
  {
    name: "Couple Corner Date",
    url: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=600",
    icon: "💑"
  },
  {
    name: "Sunlit Greenery Room",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
    icon: "🌿"
  },
  {
    name: "Donut Glaze Stack",
    url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=600",
    icon: "🍩"
  }
];

// Beautiful pre-seeded memories to show rich content before any guest creates theirs
export const PRESEEDED_MEMORIES: MemoryPost[] = [
  {
    id: "seed-1",
    guestName: "@cozy_reader_sam",
    caption: "Lost in poetry with sweet steam rising... This sunlit fern corner of the parlor is my absolute weekend happy-place. 📖🍂",
    imageUrl: "https://images.unsplash.com/photo-1463797900201-d17409400157?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "seed-2",
    guestName: "Elena & Liam",
    caption: "Celebrating 3 years together. The slow-steam baked Uji Matcha Chiffon cake literally melted in our mouths! 🎂🍵 Matchas were so lush.",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "seed-3",
    guestName: "@nature_flora",
    caption: "Drinking the national rhododendron petal blossom infusion. Feels like lounging in a gorgeous, sweet mountain garden! 🌿🌺 Pure peace.",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "seed-4",
    guestName: "@the_barista_crew",
    caption: "Good morning from the bar! Freshly steaming, hand-shaping buttery croissants, baking premium cardamom cruffins and glass yeast donuts. Come sniff the butter! 🥐✨",
    imageUrl: "https://images.unsplash.com/photo-1621259182978-f09e5e2b07ae?auto=format&fit=crop&q=80&w=600"
  }
];

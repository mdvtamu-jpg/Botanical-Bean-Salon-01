import { MenuItem, CategoryTab } from '../types';

export const PREMIUM_MENU_ITEMS: MenuItem[] = [
  {
    id: 'matcha-chiffon',
    name: 'Aesthetic Matcha Cloud Chiffon',
    category: 'signatures',
    price: 480,
    description: 'A cloud-like, ultra-fluffy sponge cake infused with ceremonial-grade Uji matcha. Slathered in sweet, whipped Madagascar vanilla cream and finished with organic rose petals and edible gold leaf.',
    whyLoved: 'This cake is baked utilizing slow-steam technology, allowing moisture to remain inside. Every bite feels like eating a sweet, floral, matcha-infused cloud that melts instantly on your palate.',
    fact: 'Chiffon cake was originally created in Los Angeles in 1927, but this adaptation marries the French chiffon technique with high-altitude stone-ground matcha originating from Uji, Kyoto.',
    ingredients: ['Ceremonial Uji Matcha', 'Madagascar Vanilla Bean', 'Fluffy Egg-white meringue', 'Organic Rose Petals', 'Raw Cane Sugar'],
    image: 'https://images.unsplash.com/photo-1536680465769-2365207b035e?auto=format&fit=crop&q=80&w=800',
    rating: 4.97,
    reviewCount: 218,
    spicyLevel: 0,
    dietary: ['Vegetarian', 'Chef Special']
  },
  {
    id: 'rosewater-chiffon',
    name: 'Rosewater Lychee Blossom Chiffon',
    category: 'signatures',
    price: 490,
    description: 'A delightfully elegant, light-pink chiffon cake naturally scented with organic rosewater. Layered with sweet juicy lychee gelee, fresh white cream, and styled with sugared pansies.',
    whyLoved: 'Extremely delicate and low in sweetness, highlighting the natural floral notes of garden roses and the tropical, grape-like sweetness of pink lychees.',
    fact: 'In Nepalese high mountain communities, wild forest rose hips are harvested during winter to formulate sweet health elixirs in local monasteries.',
    ingredients: ['Rosewater essence', 'Diced Sweet Lychees', 'Organic egg whites', 'Whipping cream', 'Sugared floral petals'],
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=800',
    rating: 4.98,
    reviewCount: 204,
    spicyLevel: 0,
    dietary: ['Vegetarian', 'Chef Special']
  },
  {
    id: 'strawberry-waffle',
    name: 'Blossom Strawberry Mochi Waffles',
    category: 'signatures',
    price: 420,
    description: 'Crispy flower-shaped Belgian waffles made with a gluten-free chewy glutinous rice flour (mochi) base. Served with fresh organic strawberry slices, hand-whipped cream, and wild honey.',
    whyLoved: 'The secret is the mochi batter which creates a loud crunch on the outside but a delightfully soft, elastic, pillowy chewiness on the inside.',
    fact: 'Mochi waffles originated in Hawaii as a fusion treat combining sweet Japanese rice cake dough with Western iron-grid waffle baking.',
    ingredients: ['Chewy Mochi Flour', 'Organic Strawberries', 'Whipped Clover Cream', 'Wild Forest Honey', 'Sweet Butter'],
    image: 'https://images.unsplash.com/photo-1562376502-6f769499c886?auto=format&fit=crop&q=80&w=800',
    rating: 4.94,
    reviewCount: 164,
    spicyLevel: 0,
    dietary: ['Vegetarian', 'Gluten-Free']
  },
  {
    id: 'matcha-ensemble',
    name: 'The Matcha Cloud Ensemble',
    category: 'beverages',
    price: 360,
    description: 'An elegant showcase of cold-whisked stone-ground Japanese Uji matcha structured in a variety of house-crafted botanical style preparations.',
    whyLoved: 'Matcha is whisked by hand in traditional bamboo chasen bowls to preserve the natural L-theanine antioxidant molecules, which generate a clean, sustained energy boost throughout the day.',
    fact: 'Matcha dates back to the Tang Dynasty in China, but it was Zen Buddhist monks in Kyoto who perfected the art of drinking whisked powdered tea to aid deep meditation.',
    ingredients: ['Ceremonial Stone-ground Matcha', 'Bamboo chasen whisking', 'Mountain spring water', 'Sweet blossom nectar'],
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800',
    rating: 4.99,
    reviewCount: 412,
    spicyLevel: 0,
    dietary: ['Vegetarian', 'Vegan', 'Chef Special'],
    optionsLabel: "Select Matcha Preparation",
    options: [
      {
        id: 'traditional',
        name: 'Ceremonial Stone Whisk',
        description: 'Pure, unsweetened ceremonial matcha lovingly hand-whisked into warm mountain spring water, creating a beautiful vibrant jade froth.',
        whyPeopleLoveIt: 'It has a deeply comforting, umami, earthy flavor profile with a sweet finish. No milk, no syrups—just the pure luxury tea.',
        funFact: 'Traditional tea bowls are meant to be held with both hands to show reverence to the master artisan who threw the clay.',
        priceDelta: 0,
        ingredients: ['Uji Matcha powder', 'Filtered spring water', 'Zero sweet add-ins'],
        image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'strawberry',
        name: 'Sweet Strawberry Cloud Latte',
        description: 'Vibrant strawberry compote made fresh with organic berries, layered with silky whole milk, and topped with a gorgeous thick layer of whisked emerald green matcha.',
        whyPeopleLoveIt: 'A sweet and sour organic strawberry fruit base perfectly balancing the botanical, earthy matcha on top. Eye-catching pastel layers.',
        funFact: 'Fresh strawberry juice represents natural sweetness, removing the need for artificial syrups or heavy sugars.',
        priceDelta: 90,
        ingredients: ['Hand-mashed Sweet Strawberries', 'Vibrant Matcha Foam', 'Creamy Milk', 'Pure Honey drizzle'],
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'lavender',
        name: 'Lavender Dream Oat Matcha',
        description: 'Calming botanical French lavender cold-infused syrup mixed with premium barista-grade oat milk and topped with whisked Uji matcha.',
        whyPeopleLoveIt: 'Highly therapeutic and floral. The natural soothing properties of lavender blended with matcha help to center your thoughts.',
        funFact: 'Matching oat milk with lavender creates a beautiful toasted-nutty cereal flavor underneath the flowery lavender cloud.',
        priceDelta: 110,
        ingredients: ['Organic Lavender Buds', 'Barista Oat Milk', 'Earthy Matcha Whisk', 'Cane sugar infusion'],
        image: 'https://images.unsplash.com/photo-1598908314732-07113901949e?auto=format&fit=crop&q=80&w=800'
      }
    ]
  },
  {
    id: 'espresso-ensemble',
    name: 'The Espresso Elixir Ensemble',
    category: 'beverages',
    price: 380,
    description: 'Our collection of premium double-shot single-origin espresso drinks, combined with elegant house-crafted salt creams and aromatic spices.',
    whyLoved: 'Our espresso is extracted at exactly 9 bars of pressure from certified shaded micro-lots, creating a thick, syrup-like crema before sweet milk pairings.',
    fact: 'Coffee cultivation in Nepal began in 1938 when a hermit brought seeds from Myanmar, but modern micro-lots are now cultivated in the foothills near Mount Manaslu.',
    ingredients: ['Single-origin Espresso beans', 'Silky steamed microfoam', 'Artisanal Himalayan honeys'],
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&q=80&w=800',
    rating: 4.98,
    reviewCount: 312,
    spicyLevel: 0,
    dietary: ['Vegetarian', 'Chef Special'],
    optionsLabel: "Select Espresso Brew",
    options: [
      {
        id: 'sea-salt',
        name: 'Himalayan Sea-Salt Cream Latte',
        description: 'Vibrant double-shot espresso poured over sweet milk, finished with a heavy, cold float of fresh cream whipped with pink volcanic sea salt and brown sugar.',
        whyPeopleLoveIt: 'The sweet and salty cream float hits your palate first, followed instantly by the powerful, bitter, warm cacao notes of the espresso underneath.',
        funFact: 'Mountain pink rock salt carries high mineral profiles, heightening the natural dark chocolate undertones of Himalayan coffees.',
        priceDelta: 0,
        ingredients: ['Single-origin espresso', 'Silky Milk', 'Salty rock-cream cap', 'Brown rock sugar'],
        image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'rose-cortado',
        name: 'Rose-Gold Honey Cortado',
        description: 'A short, intense shot of espresso mixed with equal parts warm steamed oat milk and sweet wild mountain honey, layered with aromatic crushed rosewater droplets.',
        whyPeopleLoveIt: 'Extremely silky and fragrant. The sweet wild honey acts as a smooth bridge between the sharp espresso and the velvet oat milk texture.',
        funFact: 'The name Cortado means "to cut" in Spanish, describing how steamed milk cuts through the raw acidity of espresso.',
        priceDelta: 60,
        ingredients: ['Espresso double shot', 'Oat Microfoam', 'Himalayan honey forest essence', 'Rose sprinkles'],
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800'
      }
    ]
  },
  {
    id: 'honey-toast',
    name: 'Salted Caramel Honey Toast',
    category: 'bakes',
    price: 390,
    description: 'A thick, block-cut artisanal Japanese Shokupan milk bread, scored and baked with molten mountain honey butter. Topped with sweet house-made salted caramel and vanilla cloud gelato.',
    whyLoved: 'The thick milk bread absorbs the hot honey butter into its core while the crust becomes incredibly sweet, caramelized, crunchy, and golden.',
    fact: 'Laminated Shokupan bread requires double proofing and cream-enriched kneading to ensure its distinct, shreddable, cloud-pillowy texture.',
    ingredients: ['Shokupan Milk Bread', 'Mountain Butter', 'Salted amber caramel', 'Vanilla Bean Gelato', 'Mint leaf garnish'],
    image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&q=80&w=800',
    rating: 4.95,
    reviewCount: 181,
    spicyLevel: 0,
    dietary: ['Vegetarian']
  },
  {
    id: 'cardamom-cruffin',
    name: 'Golden Himalayan Cardamom Cruffin',
    category: 'bakes',
    price: 290,
    description: 'A beautiful flakey croissant pastry baked in a muffin tin to create a tall, vertical spiral. Stuffed with a rich, velvety custard infused with hand-ground Himalayan green cardamom.',
    whyLoved: 'Every bite releases a loud crunch of laminated buttery pastry layers, followed immediately by the warm, sweet, citrusy cardamom custard filing.',
    fact: 'Cruffins were popularized in San Francisco in 2013, but our variant is baked using green cardamoms sourced directly from the moist shady slopes of Ilam, Eastern Nepal.',
    ingredients: ['Laminated French Butter Paste', 'Hand-ground green cardamom', 'Sweet egg-yolk custard', 'Powdered organic sugar'],
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800',
    rating: 4.88,
    reviewCount: 132,
    spicyLevel: 0,
    dietary: ['Vegetarian']
  },
  {
    id: 'donut-ensemble',
    name: 'The Glass-Glazed Brioche Donut Ensemble',
    category: 'bakes',
    price: 310,
    description: 'An elegant trio of hand-stretched yeast-raised brioche donuts. Slow-proven for 24 hours to create a heavy pillowy cell structure, featuring premium individual custards and botanical aromatics.',
    whyLoved: 'We use high-fat French butter in our brioche dough, fried to absolute gold and crackled under intense fire with botanical syrups.',
    fact: 'Donut origins are deeply Dutch, but our chef Infuses elements of local cardamom and rose distillations to craft a lighter, highly therapeutic sweet profile.',
    ingredients: ['24-hour proved Brioche Dough', 'High-fat French butter', 'Organic cane glass dust'],
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
    rating: 4.96,
    reviewCount: 341,
    spicyLevel: 0,
    dietary: ['Vegetarian', 'Chef Special'],
    optionsLabel: "Select Glaze & Cream Infusion",
    options: [
      {
        id: 'lavender-brulee',
        name: 'Lavender Crème Brûlée Donut',
        description: 'Our brioche donut glazed in caramelized, blowtorched organic cane sugar. Filled with soothing French lavender bean pastry cream.',
        whyPeopleLoveIt: 'A crunchy glass-hard shell that shatters on your teeth, giving way to an incredible, cooling aroma of therapeutic lavender custard.',
        funFact: 'Matches perfectly with a hot cup of black Himalayan tea, balancing the bitter notes and high alpine florals.',
        priceDelta: 0,
        ingredients: ['Caramelized cane sugar glaze', 'French lavender flower infusion', 'Real Madagascar vanilla beans', 'Brioche dough'],
        image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'matcha-almond',
        name: 'Kyoto Matcha White Chocolate Donut',
        description: 'Brioche yeast donut completely glazed in velvet white chocolate stone-ground Kyoto Matcha, finished with sweet roasted almond slices.',
        whyPeopleLoveIt: 'The earthiness of premium Japanese matcha cuts cleanly through the creamy luxury of French white chocolate, creating a bittersweet green masterpiece.',
        funFact: 'Toasted almonds mimic the natural nutty undertones of hand-whisked spring matchas.',
        priceDelta: 40,
        ingredients: ['Ceremonial Matcha powder', 'Belgian white chocolate melted', 'Toasted almond shavings'],
        image: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'rosewater-pistachio',
        name: 'Wild Rose & Roasted Pistachio Donut',
        description: 'Handcrafted rosewater glaze made with mountain spring water and wild petals, sprinkled with organic rose leaves and crushed Persian emerald pistachios.',
        whyPeopleLoveIt: 'A beautiful botanical perfume scent that triggers memory and relaxes you. Balanced perfectly with the deep salty crunch of hand-shelled pistachios.',
        funFact: 'Our rosewater is double-distilled to ensure zero artificial synthetic aftertastes.',
        priceDelta: 50,
        ingredients: ['Organic pink rose glaze', 'Crushed roasted salt pistachios', 'Sweet mountain flower honey'],
        image: 'https://images.unsplash.com/photo-1533930027531-e6c6c26573c3?auto=format&fit=crop&q=80&w=800'
      }
    ]
  },
  {
    id: 'blossom-tea',
    name: 'Rhododendron Petal Blossom Infusion',
    category: 'beverages',
    price: 320,
    description: 'A stunning, ruby-pink floral tea infusion made from sun-dried petals of the national rhododendron blossom (Lali Gurans), combined with elderflower sweet nectar.',
    whyLoved: 'Naturally caffeine-free, mildly sweet and tart, carrying notes of red currants, summer berries, and white honeysuckle bouquets.',
    fact: 'Rhododendron is the spectacular national flower of Nepal. In the spring, entire mountain ranges turn vibrant red, and locals harvest the organic blossoms for teas and preserves.',
    ingredients: ['Sun-dried Rhododendron Petals', 'Elderflower blossom', 'Clover honey drop', 'Hot water beaker'],
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
    rating: 4.91,
    reviewCount: 114,
    spicyLevel: 0,
    dietary: ['Vegetarian', 'Vegan', 'Gluten-Free']
  }
];

export const PREMIUM_CATEGORIES: CategoryTab[] = [
  { id: 'all', label: 'All Confections & Brews', icon: 'Sparkles' },
  { id: 'signatures', label: 'Artisan Signatures', icon: 'Award' },
  { id: 'beverages', label: 'Infusions & Specialty Craft', icon: 'CupSoda' },
  { id: 'bakes', label: 'Hearth Toast & Pastry', icon: 'Cookie' }
];

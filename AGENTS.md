# Project Rules & Conventions

## The Nested Menu "Ensemble" Pattern
When extending or adding new menu items that contain multiple sub-recipes or variants (like the Himalayan Momo Ensemble or a hypothetical "Fruit Juices" category with Apple, Orange, etc.), the following rules MUST be followed:

1. **Dynamic Image Cycling:** 
   The parent card on the main menu grid must automatically rotate through the images of its internal recipes (e.g., cycling every 8 seconds) to preview the variety.

2. **Contextual Metadata (Likes & Comments):**
   - **Outer View (Main Menu):** The parent card must display the *total aggregated sum* of likes and reviews for itself and all its nested sub-recipes combined.
   - **Inner View (Modal):** When viewing a specific nested recipe inside the modal, the stats must isolate and show *only* the likes and reviews for that specific recipe.

3. **Dynamic Titling:**
   Inside the detail modal, the main title must dynamically switch to the name of the currently selected sub-recipe (e.g., "Traditional Steamed" instead of the parent category) so the user knows exactly what they are viewing.

## Core Interactive QR Menu Guidelines
For any current or future iterations of this QR Menu concept, the following core interaction models and design constraints MUST be preserved, even if the primary business, styling, layouts, or branding changes:

1. **Live Interaction Engine:** All menus must support real-time user interactions, featuring a persistent Like and Comment tracking system powered by a live database.
2. **One Interaction Per User Constraint:** 
   - A single user/device is restricted to EXACTLY ONE like per dish/item/package (they can toggle/unlike their previous like at any time).
   - A single user/device is restricted to EXACTLY ONE comment per dish/item/package (they can edit their existing comment, but they cannot post multiple distinct comments).
3. **Verified Accuracies for Lore & Features:** Sections such as "Why loved", "Historical Lore", "Legends", or "Ingredients" must contain historically accurate and contextually genuine information, without using random filler or AI slop.
4. **Instagram-Linked Reviews Board:** Comments or reviews will render on an Instagram-style review board. When users provide an Instagram handle, their avatar or comment link must route natively to their real Instagram page.
5. **Live Stat Counting:** Accurately tally and display total likes and comments contextually across components (respecting the "outer-inner" isolation for menus, arrays, or packages).

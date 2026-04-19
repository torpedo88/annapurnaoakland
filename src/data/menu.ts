// AUTO-GENERATED from annapurnaoakland.com/order (2026-04-18 crawl). 178 items.
// Images are assigned at module load via dishImage() for per-dish accuracy.

import { dishImage } from "@/lib/dish-images";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryLabel: string;
  image: string;
  isCatering: boolean;
  tags: string[];
};

export type MenuCategory = { slug: string; label: string; isCatering: boolean };

export const categories: MenuCategory[] = [
  {
    "slug": "appetizer",
    "label": "Appetizer",
    "isCatering": false
  },
  {
    "slug": "vegetarian-dish",
    "label": "Vegetarian Dish",
    "isCatering": false
  },
  {
    "slug": "chicken-dish",
    "label": "Chicken Dish",
    "isCatering": false
  },
  {
    "slug": "lamb-dishes",
    "label": "Lamb Dishes",
    "isCatering": false
  },
  {
    "slug": "tandoori-dish",
    "label": "Tandoori Dish",
    "isCatering": false
  },
  {
    "slug": "sea-foods",
    "label": "Sea Foods",
    "isCatering": false
  },
  {
    "slug": "biryani",
    "label": "BIRYANI",
    "isCatering": false
  },
  {
    "slug": "house-special",
    "label": "House Special",
    "isCatering": false
  },
  {
    "slug": "breads",
    "label": "Breads",
    "isCatering": false
  },
  {
    "slug": "side-order",
    "label": "Side Order",
    "isCatering": false
  },
  {
    "slug": "dessert",
    "label": "Dessert",
    "isCatering": false
  },
  {
    "slug": "beverages",
    "label": "Beverages",
    "isCatering": false
  },
  {
    "slug": "catering-appetizers",
    "label": "CATERING \u2014 APPETIZERS",
    "isCatering": true
  },
  {
    "slug": "catering---vegetarian-dish",
    "label": "CATERING \u2014 Vegetarian Dish",
    "isCatering": true
  },
  {
    "slug": "catering-chicken-dish",
    "label": "CATERING \u2014 Chicken Dish",
    "isCatering": true
  },
  {
    "slug": "catering---lambgoat-dishes",
    "label": "CATERING \u2014 Lamb/Goat Dishes",
    "isCatering": true
  },
  {
    "slug": "catering---tandoori-dish",
    "label": "CATERING \u2014 Tandoori Dish",
    "isCatering": true
  },
  {
    "slug": "catering---biryani",
    "label": "CATERING \u2014 BIRYANI",
    "isCatering": true
  },
  {
    "slug": "catering---breads",
    "label": "CATERING \u2014 Breads",
    "isCatering": true
  },
  {
    "slug": "catering---side-order",
    "label": "CATERING \u2014 Side Order",
    "isCatering": true
  },
  {
    "slug": "catering---dessert",
    "label": "CATERING \u2014 Dessert",
    "isCatering": true
  }
];

export const menu: MenuItem[] = [
  {
    "id": "appetizer-veg-momo",
    "name": "Veg. Momo",
    "description": "Steamed dumplings filled with minced cabbage, spinach, mushroom, cashew nuts, cheese, onion, and cilantro. Served with tomato chutney. {8 pcs}",
    "price": 13.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian",
      "popular"
    ]
  },
  {
    "id": "appetizer-chicken-momo",
    "name": "Chicken Momo",
    "description": "Steamed dumplings filled with minced chicken, onion, garlic, ginger, and cilantro.",
    "price": 14.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "popular"
    ]
  },
  {
    "id": "appetizer-lamb-momo",
    "name": "Lamb Momo",
    "description": "Steamed dumplings filled with minced lamb, onion, garlic, ginger, and cilantro",
    "price": 15.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "popular"
    ]
  },
  {
    "id": "appetizer-mixed-momo",
    "name": "Mixed Momo",
    "description": "Steamed dumplings Consists of  3 pieces of Chicken,  3 pieces of Veg and 2 pieces of Lamb",
    "price": 15.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "popular"
    ]
  },
  {
    "id": "appetizer-veg-samosa",
    "name": "Veg Samosa",
    "description": "Fried triangular dough stuffed; spinach, potatoes, peppers, and cilantro seeds. Served with tamarind chutney.",
    "price": 7.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "appetizer-veg-pakora",
    "name": "Veg. Pakora",
    "description": "Mixed golden-fried vegetable fritters. Served with mint sauce.",
    "price": 9.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "appetizer-chicken-chhoila",
    "name": "Chicken Chhoila",
    "description": "Overnight marinated pieces of chicken baked in tandoor oven and mixed with onion, bell pepper and herbs, spices and lemon juice.",
    "price": 14.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "appetizer-paneer-pakora",
    "name": "Paneer Pakora",
    "description": "Homemade paneer cubs golden fried in garbanzo flour.serve with mint sauce.",
    "price": 11.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "appetizer-pumkin-pakora",
    "name": "Pumkin Pakora",
    "description": "Golden-fried pumpkin. Served with mint sauce",
    "price": 11.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "appetizer-fish-pakora",
    "name": "Fish Pakora",
    "description": "Golden Fried fish fillet serve with mint sauce.",
    "price": 12.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "appetizer-veg-jhol-momo",
    "name": "Veg Jhol Momo",
    "description": "Steamed dumplings server with spicy homemade momo soup.",
    "price": 14.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian",
      "popular"
    ]
  },
  {
    "id": "appetizer-chicken-jhol-momo",
    "name": "Chicken Jhol Momo",
    "description": "Steamed dumplings server with spicy homemade momo soup.",
    "price": 14.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "popular"
    ]
  },
  {
    "id": "appetizer-lamb-jhol-momo",
    "name": "Lamb Jhol Momo",
    "description": "Steamed dumplings server with spicy homemade momo soup.",
    "price": 16.99,
    "category": "appetizer",
    "categoryLabel": "Appetizer",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "popular"
    ]
  },
  {
    "id": "vegetarian-dish-aloo-matar",
    "name": "Aloo Matar",
    "description": "Green snow peas and potato cooked with onion and tomato sauce.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-aloo-cauli-ko-tarkari",
    "name": "Aloo Cauli Ko Tarkari",
    "description": "Potatoes and cauliflower saut\u00e9ed with garlic, and cooked with onion and tomato sauce.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-chana-masala",
    "name": "Chana Masala",
    "description": "Garbanzo Beans cooked with special herbs and spices in Taste of the Himalayas gravy.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-bhindi-karahi",
    "name": "Bhindi Karahi",
    "description": "Himalayan style cut Okras cooked in special curry sauce.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-matar-paneer",
    "name": "Matar Paneer",
    "description": "Green peas are cooked in creamy gravy of onion and tomatoes along with herbs and spices with homemade cheese cubes.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-palak-paneer",
    "name": "Palak Paneer",
    "description": "Minced spinach with fried cheese cubes in a light creamy sauce.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-malai-kofta",
    "name": "Malai Kofta",
    "description": "Ball of mashed homemade cheese, potatoes, nuts and spices cooked with specially prepared creamy sauce.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-mix-vegetable",
    "name": "Mix Vegetable",
    "description": "Seasonal mixed vegetable sauteed with garlic and cooked with special herbs and spices, onion & tomato base sauce.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-aloo-bhanta",
    "name": "Aloo Bhanta",
    "description": "Eggplant and potato cooked with onion & tomato base special sauce.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-potato-spinach",
    "name": "Potato Spinach",
    "description": "Potato and fresh spinach sauteed with garlic cooked with special herbs, spices in onion & tomato base sauce.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-pumpkin-masala",
    "name": "Pumpkin Masala",
    "description": "Organic pumpkin cubes cooked in a special creamy sauce. ( we can make vegan also)",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-paneer-tikka-masala",
    "name": "Paneer Tikka Masala",
    "description": "Fried homemade Paneer cubes cooked in special creamy sauce with herbs & spices.",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-vegetable-korma",
    "name": "Vegetable Korma",
    "description": "Seasonal mixed vegetables cooked in special creamy sauce with coconut milk.",
    "price": 16.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-daal-makhani",
    "name": "Daal Makhani",
    "description": "Black lentils, ginger, and garlic fried with tomatoes, onion, and herbs",
    "price": 17.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "vegetarian-dish-dal-tadka",
    "name": "Dal Tadka",
    "description": "Slow cooked yellow split daal is tempered with garlic, ginger, red onions, jalapeno chilies, cumin and spices.",
    "price": 16.99,
    "category": "vegetarian-dish",
    "categoryLabel": "Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "chicken-dish-chicken-curry",
    "name": "Chicken Curry",
    "description": "Boneless chicken cooked in house special sauce with herbs and spice.",
    "price": 17.99,
    "category": "chicken-dish",
    "categoryLabel": "Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "chicken-dish-chicken-chili",
    "name": "Chicken Chili",
    "description": "Pan-fried chicken strips cooked with tomato sauce, green chili, onion, peppers.",
    "price": 17.99,
    "category": "chicken-dish",
    "categoryLabel": "Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "chicken-dish-chicken-spinach",
    "name": "Chicken Spinach",
    "description": "Boneless chicken cooked with fresh chopped spinach and curry sauce.",
    "price": 17.99,
    "category": "chicken-dish",
    "categoryLabel": "Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "chicken-dish-chicken-vindaloo",
    "name": "Chicken Vindaloo",
    "description": "Premium chicken cooked with potatoes in specially prepared vindaloo sauce and herbs.",
    "price": 17.99,
    "category": "chicken-dish",
    "categoryLabel": "Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "chicken-dish-chicken-tikka-masala",
    "name": "Chicken Tikka Masala",
    "description": "Widely popular dish, the recipe consists of broiled boneless cubes of chicken breast cooked in a special creamy sauce with herbs and spices.",
    "price": 18.99,
    "category": "chicken-dish",
    "categoryLabel": "Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "chicken-dish-chicken-nauni-butter-chicken",
    "name": "Chicken nauni (Butter Chicken)",
    "description": "Premium chicken is cooked in the Tandoor and then cooked in a creamy butter sauce.",
    "price": 18.99,
    "category": "chicken-dish",
    "categoryLabel": "Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "chicken-dish-chicken-korma",
    "name": "Chicken Korma",
    "description": "Boneless chicken pieces cooked in a special creamy sauce with coconut milk.",
    "price": 17.99,
    "category": "chicken-dish",
    "categoryLabel": "Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "chicken-dish-coconut-chicken",
    "name": "Coconut Chicken",
    "description": "Premium chicken cooked with coconut flakes in creamy sauce, herbs, and spices.",
    "price": 18.99,
    "category": "chicken-dish",
    "categoryLabel": "Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "lamb-dishes-lamb-curry",
    "name": "Lamb Curry",
    "description": "Boneless Lamb pieces are cooked in house Special sauce with different herbs and spices.",
    "price": 18.99,
    "category": "lamb-dishes",
    "categoryLabel": "Lamb Dishes",
    "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "lamb-dishes-lamb-tikka-masala",
    "name": "Lamb Tikka Masala",
    "description": "Marinated and broiled cubes of lamb cooked in a special creamy sauce with herbs and spices.",
    "price": 19.99,
    "category": "lamb-dishes",
    "categoryLabel": "Lamb Dishes",
    "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "lamb-dishes-lamb-spinach",
    "name": "Lamb Spinach",
    "description": "Boneless lamb pieces cooked with fresh spinach along with different herbs and spices.",
    "price": 18.99,
    "category": "lamb-dishes",
    "categoryLabel": "Lamb Dishes",
    "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "lamb-dishes-lamb-mushroom",
    "name": "Lamb Mushroom",
    "description": "Boneless lamb pieces cooked with fresh Mushroom along with House special sauce.",
    "price": 18.99,
    "category": "lamb-dishes",
    "categoryLabel": "Lamb Dishes",
    "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "lamb-dishes-lamb-vindaloo",
    "name": "Lamb Vindaloo",
    "description": "Boneless lamb pieces cooked with potatoes in specially prepared vindaloo sauce.",
    "price": 18.99,
    "category": "lamb-dishes",
    "categoryLabel": "Lamb Dishes",
    "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "lamb-dishes-pumpkin-lamb",
    "name": "Pumpkin Lamb",
    "description": "Premium boneless lamb cubes and pumpkin cooked with special onion tomato sauce.",
    "price": 18.99,
    "category": "lamb-dishes",
    "categoryLabel": "Lamb Dishes",
    "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "lamb-dishes-lamb-korma",
    "name": "Lamb Korma",
    "description": "Boneless Lamb cooked in a special creamy sauce with coconut milk.",
    "price": 18.99,
    "category": "lamb-dishes",
    "categoryLabel": "Lamb Dishes",
    "image": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "tandoori-dish-chicken-tandoori",
    "name": "Chicken Tandoori",
    "description": "Chicken marinated in yogurt and spices, broiled in the Tandoor oven. Served sizzling with saut\u00e9ed veggies.",
    "price": 22.99,
    "category": "tandoori-dish",
    "categoryLabel": "Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "tandoori-dish-chicken-tandoori-tikka",
    "name": "Chicken Tandoori Tikka",
    "description": "Boneless chicken breast first marinated with special herbs, spices along with yogurt then baked to perfection in the Tandoor oven. Served sizzling with saut\u00e9ed veggies.",
    "price": 23.99,
    "category": "tandoori-dish",
    "categoryLabel": "Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "tandoori-dish-mixed-tandoor",
    "name": "Mixed Tandoor",
    "description": "This platter consists of sampling of Tandoor Chicken, Boti Kabab (Lamb), Shrimp Tandoor, and Chicken Tikka. They are first marinated with special herbs & cooked in Tandoor oven. Served sizzling with saut\u00e9ed veggies.",
    "price": 25.99,
    "category": "tandoori-dish",
    "categoryLabel": "Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "tandoori-dish-atlantic-salmon-tandoor",
    "name": "Atlantic Salmon Tandoor",
    "description": "Salmon fillet overnight marinated & broiled in Tandoor oven served to sizzle with vegetables.",
    "price": 25.99,
    "category": "tandoori-dish",
    "categoryLabel": "Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "tandoori-dish-shrimp-tandoor",
    "name": "Shrimp Tandoor",
    "description": "Marinated Jumbo Shrimp with special herbs and spices. broiled in Tandoor oven, served sizzling with vegetables.",
    "price": 25.99,
    "category": "tandoori-dish",
    "categoryLabel": "Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "sea-foods-salmon-curry",
    "name": "Salmon Curry",
    "description": "Salmon fillets cooked with house special sauce, different herbs and spices.",
    "price": 18.99,
    "category": "sea-foods",
    "categoryLabel": "Sea Foods",
    "image": "https://images.unsplash.com/photo-1604908554105-088645debba4?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "sea-foods-salmon-vindaloo",
    "name": "Salmon Vindaloo",
    "description": "Salmon fish fillets cooked with potato, onion based specially prepared vindaloo sauce and herbs.",
    "price": 18.99,
    "category": "sea-foods",
    "categoryLabel": "Sea Foods",
    "image": "https://images.unsplash.com/photo-1604908554105-088645debba4?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "sea-foods-salmon-tikka-masala",
    "name": "Salmon Tikka Masala",
    "description": "Salmon fish cooked in a creamy sauce with Indian spices.",
    "price": 19.99,
    "category": "sea-foods",
    "categoryLabel": "Sea Foods",
    "image": "https://images.unsplash.com/photo-1604908554105-088645debba4?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "sea-foods-shrimp-korma",
    "name": "Shrimp Korma",
    "description": "Jumbo shrimps are cooked with tomatoes and onion based korma (creamy) sauce; saut\u00e9ed with ginger, garlic and herbs.",
    "price": 18.99,
    "category": "sea-foods",
    "categoryLabel": "Sea Foods",
    "image": "https://images.unsplash.com/photo-1604908554105-088645debba4?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "sea-foods-shrimp-vindaloo",
    "name": "Shrimp Vindaloo",
    "description": "Jumbo shrimps cooked with potatoes in specially prepared vindaloo sauce and herbs.",
    "price": 18.99,
    "category": "sea-foods",
    "categoryLabel": "Sea Foods",
    "image": "https://images.unsplash.com/photo-1604908554105-088645debba4?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "sea-foods-shrimp-tikka-masala",
    "name": "Shrimp Tikka Masala",
    "description": "Shrimp cooked in a creamy sauce with Indian spices",
    "price": 19.99,
    "category": "sea-foods",
    "categoryLabel": "Sea Foods",
    "image": "https://images.unsplash.com/photo-1604908554105-088645debba4?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "biryani-veg-biryani",
    "name": "Veg. Biryani",
    "description": "Tender pieces of homemade cheese and bell peppers cooked with basmati rice.",
    "price": 17.99,
    "category": "biryani",
    "categoryLabel": "BIRYANI",
    "image": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "biryani-lamb-biryani",
    "name": "Lamb Biryani",
    "description": "Premium lamb is cooked with basmati rice, mix of special herbs and spices.",
    "price": 19.99,
    "category": "biryani",
    "categoryLabel": "BIRYANI",
    "image": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "biryani-chicken-biryani",
    "name": "Chicken Biryani",
    "description": "Premium chicken is cooked with basmati rice, mix of special herbs and spices.",
    "price": 18.99,
    "category": "biryani",
    "categoryLabel": "BIRYANI",
    "image": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "house-special-goat-curry",
    "name": "Goat Curry",
    "description": "Bone in goat meat cooked in authentic Nepali style in House special sauce, herbs and spice.",
    "price": 19.99,
    "category": "house-special",
    "categoryLabel": "House Special",
    "image": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-plain-naan",
    "name": "Plain Naan",
    "description": "",
    "price": 4.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-garlic-naan",
    "name": "Garlic Naan",
    "description": "Garlic and cilantro topping",
    "price": 5.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-onion-naan",
    "name": "Onion Naan",
    "description": "Onion stuffing",
    "price": 5.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-tandoori-roti",
    "name": "Tandoori Roti",
    "description": "Whole wheat prepared in tandoor oven",
    "price": 4.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-coconut-naan",
    "name": "Coconut Naan",
    "description": "",
    "price": 5.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-herbal-naan",
    "name": "Herbal Naan",
    "description": "",
    "price": 5.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-paneer-paratha",
    "name": "Paneer Paratha",
    "description": "",
    "price": 6.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "breads-plain-paratha",
    "name": "Plain Paratha",
    "description": "",
    "price": 5.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-rosemary-naan",
    "name": "Rosemary Naan",
    "description": "",
    "price": 5.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-onion-paratha",
    "name": "Onion Paratha",
    "description": "",
    "price": 6.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-aalo-paratha",
    "name": "Aalo Paratha",
    "description": "",
    "price": 6.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "breads-coconut-paratha",
    "name": "Coconut Paratha",
    "description": "",
    "price": 6.99,
    "category": "breads",
    "categoryLabel": "Breads",
    "image": "https://images.unsplash.com/photo-1617692855027-33b14f061079?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "side-order-basmati-rice",
    "name": "Basmati Rice",
    "description": "",
    "price": 3.5,
    "category": "side-order",
    "categoryLabel": "Side Order",
    "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "side-order-papad",
    "name": "Papad",
    "description": "Baked crispy thin lentil wafers.",
    "price": 4.99,
    "category": "side-order",
    "categoryLabel": "Side Order",
    "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "side-order-mango-chutney",
    "name": "Mango Chutney",
    "description": "",
    "price": 6.99,
    "category": "side-order",
    "categoryLabel": "Side Order",
    "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "side-order-lentil-soup",
    "name": "Lentil Soup",
    "description": "16 oz. Lentils soup",
    "price": 10.99,
    "category": "side-order",
    "categoryLabel": "Side Order",
    "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "side-order-mixed-pickle",
    "name": "Mixed Pickle",
    "description": "",
    "price": 6.99,
    "category": "side-order",
    "categoryLabel": "Side Order",
    "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "side-order-raita",
    "name": "Raita",
    "description": "",
    "price": 6.99,
    "category": "side-order",
    "categoryLabel": "Side Order",
    "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "side-order-brown-rice",
    "name": "Brown Rice",
    "description": "",
    "price": 3.99,
    "category": "side-order",
    "categoryLabel": "Side Order",
    "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "dessert-gulab-jamun",
    "name": "Gulab Jamun",
    "description": "Deep fried cheese balls in honey syrup.",
    "price": 7.99,
    "category": "dessert",
    "categoryLabel": "Dessert",
    "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "dessert-rice-pudding-kheer",
    "name": "Rice Pudding (Kheer)",
    "description": "Traditional rice pudding- a sweet delight.",
    "price": 7.99,
    "category": "dessert",
    "categoryLabel": "Dessert",
    "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "dessert-mango-kulfi",
    "name": "Mango Kulfi",
    "description": "Sweet Nepalese dessert.",
    "price": 7.99,
    "category": "dessert",
    "categoryLabel": "Dessert",
    "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "dessert-rasmalai",
    "name": "Rasmalai",
    "description": "Sweet dessert.",
    "price": 8.99,
    "category": "dessert",
    "categoryLabel": "Dessert",
    "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "beverages-tea-chai",
    "name": "Tea (Chai)",
    "description": "",
    "price": 4.99,
    "category": "beverages",
    "categoryLabel": "Beverages",
    "image": "https://images.unsplash.com/photo-1597318236661-91925c6cecfa?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "beverages-mango-lassi",
    "name": "Mango Lassi",
    "description": "",
    "price": 4.99,
    "category": "beverages",
    "categoryLabel": "Beverages",
    "image": "https://images.unsplash.com/photo-1597318236661-91925c6cecfa?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "beverages-plainsaltsweet-lassi",
    "name": "Plain/Salt/Sweet Lassi",
    "description": "",
    "price": 5.99,
    "category": "beverages",
    "categoryLabel": "Beverages",
    "image": "https://images.unsplash.com/photo-1597318236661-91925c6cecfa?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "beverages-soda-coke-diet-coke-sprite",
    "name": "Soda (Coke, Diet Coke, Sprite)",
    "description": "",
    "price": 3.99,
    "category": "beverages",
    "categoryLabel": "Beverages",
    "image": "https://images.unsplash.com/photo-1597318236661-91925c6cecfa?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "beverages-sparkling-water",
    "name": "Sparkling Water",
    "description": "",
    "price": 4.99,
    "category": "beverages",
    "categoryLabel": "Beverages",
    "image": "https://images.unsplash.com/photo-1597318236661-91925c6cecfa?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "beverages-regular-water",
    "name": "Regular Water",
    "description": "",
    "price": 2.99,
    "category": "beverages",
    "categoryLabel": "Beverages",
    "image": "https://images.unsplash.com/photo-1597318236661-91925c6cecfa?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "beverages-iced-tea",
    "name": "Iced Tea",
    "description": "",
    "price": 4.99,
    "category": "beverages",
    "categoryLabel": "Beverages",
    "image": "https://images.unsplash.com/photo-1597318236661-91925c6cecfa?w=900&q=85&auto=format&fit=crop",
    "isCatering": false,
    "tags": []
  },
  {
    "id": "catering-appetizers-veg-momo---half-tray",
    "name": "Veg. Momo - Half Tray",
    "description": "",
    "price": 65.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering-appetizers-veg-momo---full-tray",
    "name": "Veg. Momo - Full Tray",
    "description": "",
    "price": 120.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering-appetizers-chicken-momo---half-tray",
    "name": "Chicken Momo - Half Tray",
    "description": "",
    "price": 70.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-chicken-momo---full-tray",
    "name": "Chicken Momo - Full Tray",
    "description": "",
    "price": 130.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-lamb-momo---half-tray",
    "name": "Lamb Momo - Half Tray",
    "description": "",
    "price": 75.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-lamb-momo---full-tray",
    "name": "Lamb Momo - Full Tray",
    "description": "",
    "price": 140.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-samosa---half-tray",
    "name": "Samosa - Half tray",
    "description": "",
    "price": 35.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-samosa---full-tray",
    "name": "Samosa - Full Tray",
    "description": "",
    "price": 60.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-veg-pakora---half-tray",
    "name": "Veg. Pakora - Half Tray",
    "description": "",
    "price": 40.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering-appetizers-veg-pakora---full-tray",
    "name": "Veg. Pakora - Full Tray",
    "description": "",
    "price": 70.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering-appetizers-chicken-chhoila---half-tray",
    "name": "Chicken Chhoila - Half Tray",
    "description": "",
    "price": 80.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-chicken-chhoila---full-tray",
    "name": "Chicken Chhoila - Full Tray",
    "description": "",
    "price": 150.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-pumkin-pakora---half-tray",
    "name": "Pumkin Pakora - Half Tray",
    "description": "",
    "price": 65.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-pumkin-pakora---full-tray",
    "name": "Pumkin Pakora - Full Tray",
    "description": "",
    "price": 125.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-fish-pakora---full-tray",
    "name": "Fish Pakora - Full Tray",
    "description": "",
    "price": 140.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-appetizers-fish-pakora---half-tray",
    "name": "Fish Pakora - Half Tray",
    "description": "",
    "price": 75.0,
    "category": "catering-appetizers",
    "categoryLabel": "CATERING \u2014 APPETIZERS",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---vegetarian-dish-aloo-matar---half-tray",
    "name": "Aloo Matar - Half Tray",
    "description": "",
    "price": 90.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-aloo-matar---full-tray",
    "name": "Aloo Matar - Full Tray",
    "description": "",
    "price": 170.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-palak-paneer---half-tray",
    "name": "Palak Paneer - Half Tray",
    "description": "",
    "price": 95.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-palak-paneer---full-tray",
    "name": "Palak Paneer - Full Tray",
    "description": "",
    "price": 180.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-chana-masala---half-tray",
    "name": "Chana Masala - Half Tray",
    "description": "",
    "price": 85.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-chana-masala---full-tray",
    "name": "Chana Masala - Full Tray",
    "description": "",
    "price": 165.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-bhindi-karahi---half-tray",
    "name": "Bhindi Karahi - Half Tray",
    "description": "",
    "price": 90.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-bhindi-karahi---full-tray",
    "name": "Bhindi Karahi - Full Tray",
    "description": "",
    "price": 165.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-matar-paneer---half-tray",
    "name": "Matar Paneer - Half Tray",
    "description": "",
    "price": 90.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-matar-paneer---full-tray",
    "name": "Matar Paneer - Full Tray",
    "description": "",
    "price": 165.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-mix-vegetable---half-tray",
    "name": "Mix Vegetable - Half Tray",
    "description": "",
    "price": 85.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-mix-vegetable---full-tray",
    "name": "Mix Vegetable - Full Tray",
    "description": "",
    "price": 165.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-paneer-tikka-masala---half-tray",
    "name": "PANEER TIKKA MASALA - Half Tray",
    "description": "",
    "price": 95.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-paneer-tikka-masala---full-tray",
    "name": "PANEER TIKKA MASALA - Full Tray",
    "description": "",
    "price": 170.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-malai-kofta---half-tray",
    "name": "Malai Kofta - Half Tray",
    "description": "",
    "price": 90.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-malai-kofta---full-tray",
    "name": "Malai Kofta - Full Tray",
    "description": "",
    "price": 165.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-aloo-cauli-ko-tarkari---half-tray",
    "name": "Aloo Cauli Ko Tarkari - Half Tray",
    "description": "",
    "price": 85.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-aloo-cauli-ko-tarkari---full-tray",
    "name": "Aloo Cauli Ko Tarkari - Full Tray",
    "description": "",
    "price": 165.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-pumpkin-masala---half-tray",
    "name": "Pumpkin Masala - Half Tray",
    "description": "",
    "price": 90.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-pumpkin-masala---full-tray",
    "name": "Pumpkin Masala - Full Tray",
    "description": "",
    "price": 170.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-vegetable-korma---half-tray",
    "name": "Vegetable Korma - Half Tray",
    "description": "",
    "price": 90.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---vegetarian-dish-vegetable-korma---full-tray",
    "name": "Vegetable Korma - Full Tray",
    "description": "",
    "price": 170.0,
    "category": "catering---vegetarian-dish",
    "categoryLabel": "CATERING \u2014 Vegetarian Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering-chicken-dish-chicken-curry--half-tray",
    "name": "Chicken Curry -Half Tray",
    "description": "",
    "price": 95.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-curry--full-tray",
    "name": "Chicken Curry -Full Tray",
    "description": "",
    "price": 185.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-chili---half-tray",
    "name": "Chicken Chili - Half Tray",
    "description": "",
    "price": 95.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-chili---full-tray",
    "name": "Chicken Chili - Full Tray",
    "description": "",
    "price": 180.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-vindaloo---half-tray",
    "name": "Chicken Vindaloo - Half Tray",
    "description": "",
    "price": 90.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-vindaloo---full-tray",
    "name": "Chicken Vindaloo - Full Tray",
    "description": "",
    "price": 175.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-tikka-masala---half-tray",
    "name": "Chicken Tikka Masala - Half Tray",
    "description": "",
    "price": 95.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-tikka-masala---full-tray",
    "name": "Chicken Tikka Masala - Full Tray",
    "description": "",
    "price": 185.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-nauni-butter-chicken---half-tray",
    "name": "Chicken Nauni (Butter Chicken) - Half Tray",
    "description": "",
    "price": 95.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-nauni-butter-chicken---full-tray",
    "name": "Chicken Nauni (Butter Chicken) - Full Tray",
    "description": "",
    "price": 185.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-korma---half-tray",
    "name": "Chicken Korma - Half Tray",
    "description": "",
    "price": 95.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering-chicken-dish-chicken-korma---full-tray",
    "name": "Chicken Korma - Full Tray",
    "description": "",
    "price": 185.0,
    "category": "catering-chicken-dish",
    "categoryLabel": "CATERING \u2014 Chicken Dish",
    "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---lambgoat-dishes-lamb-curry---half-tray",
    "name": "Lamb Curry - Half Tray",
    "description": "",
    "price": 97.0,
    "category": "catering---lambgoat-dishes",
    "categoryLabel": "CATERING \u2014 Lamb/Goat Dishes",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---lambgoat-dishes-lamb-curry---full-tray",
    "name": "Lamb Curry - Full Tray",
    "description": "",
    "price": 190.0,
    "category": "catering---lambgoat-dishes",
    "categoryLabel": "CATERING \u2014 Lamb/Goat Dishes",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---lambgoat-dishes-lamb-tikka-masala---half-tray",
    "name": "Lamb Tikka Masala - Half Tray",
    "description": "",
    "price": 99.0,
    "category": "catering---lambgoat-dishes",
    "categoryLabel": "CATERING \u2014 Lamb/Goat Dishes",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---lambgoat-dishes-lamb-tikka-masala---full-tray",
    "name": "Lamb Tikka Masala - Full Tray",
    "description": "",
    "price": 195.0,
    "category": "catering---lambgoat-dishes",
    "categoryLabel": "CATERING \u2014 Lamb/Goat Dishes",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---lambgoat-dishes-goat---half-tray",
    "name": "Goat - Half Tray",
    "description": "",
    "price": 110.0,
    "category": "catering---lambgoat-dishes",
    "categoryLabel": "CATERING \u2014 Lamb/Goat Dishes",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---lambgoat-dishes-goat-curry---full-tray",
    "name": "Goat Curry - Full Tray",
    "description": "",
    "price": 199.0,
    "category": "catering---lambgoat-dishes",
    "categoryLabel": "CATERING \u2014 Lamb/Goat Dishes",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---tandoori-dish-chicken-tandoori---half-tray",
    "name": "Chicken Tandoori - Half Tray",
    "description": "",
    "price": 99.0,
    "category": "catering---tandoori-dish",
    "categoryLabel": "CATERING \u2014 Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---tandoori-dish-chicken-tandoori---full-tray",
    "name": "Chicken Tandoori - Full Tray",
    "description": "",
    "price": 195.0,
    "category": "catering---tandoori-dish",
    "categoryLabel": "CATERING \u2014 Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---tandoori-dish-chicken-tandoori-tikka---half-tray",
    "name": "Chicken Tandoori Tikka - Half Tray",
    "description": "",
    "price": 110.0,
    "category": "catering---tandoori-dish",
    "categoryLabel": "CATERING \u2014 Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---tandoori-dish-chicken-tandoori-tikka---full-tray",
    "name": "Chicken Tandoori Tikka - Full Tray",
    "description": "",
    "price": 199.0,
    "category": "catering---tandoori-dish",
    "categoryLabel": "CATERING \u2014 Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---tandoori-dish-salmon-tandoor---half-tray",
    "name": "Salmon Tandoor - Half Tray",
    "description": "",
    "price": 120.0,
    "category": "catering---tandoori-dish",
    "categoryLabel": "CATERING \u2014 Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---tandoori-dish-salmon-tandoor---full-tray",
    "name": "Salmon Tandoor - Full Tray",
    "description": "",
    "price": 225.0,
    "category": "catering---tandoori-dish",
    "categoryLabel": "CATERING \u2014 Tandoori Dish",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---biryani-veg-biryani---half-tray",
    "name": "Veg. Biryani - Half Tray",
    "description": "",
    "price": 90.0,
    "category": "catering---biryani",
    "categoryLabel": "CATERING \u2014 BIRYANI",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---biryani-veg-biryani---full-tray",
    "name": "Veg. Biryani - Full Tray",
    "description": "",
    "price": 170.0,
    "category": "catering---biryani",
    "categoryLabel": "CATERING \u2014 BIRYANI",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": [
      "vegetarian"
    ]
  },
  {
    "id": "catering---biryani-chicken-biryani---half-tray",
    "name": "Chicken Biryani - Half Tray",
    "description": "",
    "price": 95.0,
    "category": "catering---biryani",
    "categoryLabel": "CATERING \u2014 BIRYANI",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---biryani-chicken-biryani---full-tray",
    "name": "Chicken Biryani - Full Tray",
    "description": "",
    "price": 180.0,
    "category": "catering---biryani",
    "categoryLabel": "CATERING \u2014 BIRYANI",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---breads-plain-naan---half-tray",
    "name": "Plain Naan - Half Tray",
    "description": "",
    "price": 27.0,
    "category": "catering---breads",
    "categoryLabel": "CATERING \u2014 Breads",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---breads-plain-naan---full-tray",
    "name": "Plain Naan - Full Tray",
    "description": "",
    "price": 49.0,
    "category": "catering---breads",
    "categoryLabel": "CATERING \u2014 Breads",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---breads-garlic-naan---half-tray",
    "name": "Garlic Naan - Half Tray",
    "description": "",
    "price": 33.0,
    "category": "catering---breads",
    "categoryLabel": "CATERING \u2014 Breads",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---breads-garlic-naan---full-tray",
    "name": "Garlic Naan - Full Tray",
    "description": "",
    "price": 55.0,
    "category": "catering---breads",
    "categoryLabel": "CATERING \u2014 Breads",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---breads-assorted-naan---half-tray",
    "name": "Assorted Naan - Half Tray",
    "description": "",
    "price": 35.0,
    "category": "catering---breads",
    "categoryLabel": "CATERING \u2014 Breads",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---breads-assorted-naan---full-tray",
    "name": "Assorted Naan - Full Tray",
    "description": "",
    "price": 60.0,
    "category": "catering---breads",
    "categoryLabel": "CATERING \u2014 Breads",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-basmati-rice---half-tray",
    "name": "Basmati Rice - Half Tray",
    "description": "",
    "price": 30.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-basmati-rice---full-tray",
    "name": "Basmati Rice - Full Tray",
    "description": "",
    "price": 50.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-brown-rice---half-tray",
    "name": "Brown Rice - Half Tray",
    "description": "",
    "price": 35.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-brown-rice---full-tray",
    "name": "Brown Rice - Full Tray",
    "description": "",
    "price": 60.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-papad---half-tray",
    "name": "Papad - Half Tray",
    "description": "",
    "price": 35.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-papad---full-tray",
    "name": "Papad - Full Tray",
    "description": "",
    "price": 60.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-mango-chutney---half-tray",
    "name": "Mango Chutney - Half Tray",
    "description": "",
    "price": 30.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-mango-chutney---full-tray",
    "name": "Mango Chutney - Full Tray",
    "description": "",
    "price": 55.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-lentil-soup---half-tray",
    "name": "Lentil Soup - Half Tray",
    "description": "",
    "price": 55.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-lentil-soup---full-tray",
    "name": "Lentil Soup - Full Tray",
    "description": "",
    "price": 99.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-mixed-pickle---half-tray",
    "name": "Mixed Pickle - Half Tray",
    "description": "",
    "price": 30.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-mixed-pickle---full-tray",
    "name": "Mixed Pickle - Full Tray",
    "description": "",
    "price": 55.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-raita---half-tray",
    "name": "Raita - Half Tray",
    "description": "",
    "price": 35.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---side-order-raita---full-tray",
    "name": "Raita - Full Tray",
    "description": "",
    "price": 60.0,
    "category": "catering---side-order",
    "categoryLabel": "CATERING \u2014 Side Order",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---dessert-gulab-jamun---half-tray",
    "name": "Gulab Jamun - Half Tray",
    "description": "",
    "price": 35.0,
    "category": "catering---dessert",
    "categoryLabel": "CATERING \u2014 Dessert",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---dessert-gulab-jamun---full-tray",
    "name": "Gulab Jamun - Full Tray",
    "description": "",
    "price": 65.0,
    "category": "catering---dessert",
    "categoryLabel": "CATERING \u2014 Dessert",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---dessert-rice-pudding---half-tray",
    "name": "Rice Pudding - Half Tray",
    "description": "",
    "price": 35.0,
    "category": "catering---dessert",
    "categoryLabel": "CATERING \u2014 Dessert",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  },
  {
    "id": "catering---dessert-rice-pudding---full-tray",
    "name": "Rice Pudding - Full Tray",
    "description": "",
    "price": 65.0,
    "category": "catering---dessert",
    "categoryLabel": "CATERING \u2014 Dessert",
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85&auto=format&fit=crop",
    "isCatering": true,
    "tags": []
  }
];

// Post-process: replace each item's generic category image with a per-dish match.
menu.forEach((item) => {
  item.image = dishImage(item.name, item.category);
});

export const menuByCategory = (catering = false) => {
  const cats = categories.filter(c => c.isCatering === catering);
  return cats.map(c => ({ ...c, items: menu.filter(m => m.category === c.slug) }));
};

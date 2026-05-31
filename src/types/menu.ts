export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  hasSpiceOptions: boolean | null;
  hasRiceChoice: boolean | null;
  isVegetarian: boolean | null;
  isVeganOption: boolean | null;
  isGlutenFree: boolean | null;
  isAvailable: boolean | null;
  halfTrayPrice: string | null;
  fullTrayPrice: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isCatering: boolean | null;
  items: MenuItem[];
}

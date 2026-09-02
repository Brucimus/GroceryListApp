/**
 * Core data types for Grocery List App
 */

export interface Product {
  id: string;
  name: string;
  store: 'kroger' | 'albertsons' | 'walmart' | 'target' | 'generic';
  price: number;
  image?: string;
  category?: string;
  description?: string;
}

export interface ListItem {
  id: string;
  product: Product;
  quantity: number;
  checked: boolean;
  notes?: string;
}

export interface GroceryList {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  items: ListItem[];
  totalPrice: number;
  store?: 'kroger' | 'albertsons' | 'walmart' | 'target';
}

export interface SearchResult {
  products: Product[];
  totalResults: number;
}

export interface StoreLocation {
  locationId: string;
  name: string;
  chain?: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone?: string;
  hours?: {
    open24?: boolean;
    today?: string;
  };
  latitude?: number;
  longitude?: number;
}

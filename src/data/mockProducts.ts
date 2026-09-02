/**
 * Mock product data for development and testing
 * Replace with real API calls in production
 */

import { Product } from '@/types';

export const MOCK_PRODUCTS: Product[] = [
  // Produce
  {
    id: 'prod_1',
    name: 'Organic Bananas',
    store: 'kroger',
    price: 2.49,
    category: 'Produce',
    image: 'https://via.placeholder.com/200?text=Bananas',
    description: 'Yellow, ready to eat',
  },
  {
    id: 'prod_2',
    name: 'Red Apples',
    store: 'walmart',
    price: 3.99,
    category: 'Produce',
    image: 'https://via.placeholder.com/200?text=Apples',
    description: 'Fresh red apples - 3 lb bag',
  },
  {
    id: 'prod_3',
    name: 'Carrots',
    store: 'albertsons',
    price: 1.99,
    category: 'Produce',
    image: 'https://via.placeholder.com/200?text=Carrots',
    description: '2 lb bag',
  },

  // Dairy
  {
    id: 'prod_4',
    name: '2% Milk',
    store: 'target',
    price: 3.49,
    category: 'Dairy',
    image: 'https://via.placeholder.com/200?text=Milk',
    description: 'Whole milk - 1 gallon',
  },
  {
    id: 'prod_5',
    name: 'Cheddar Cheese',
    store: 'kroger',
    price: 4.99,
    category: 'Dairy',
    image: 'https://via.placeholder.com/200?text=Cheese',
    description: 'Sliced cheddar - 8 oz',
  },
  {
    id: 'prod_6',
    name: 'Greek Yogurt',
    store: 'walmart',
    price: 5.99,
    category: 'Dairy',
    image: 'https://via.placeholder.com/200?text=Yogurt',
    description: 'Plain - 32 oz',
  },

  // Meat & Seafood
  {
    id: 'prod_7',
    name: 'Chicken Breast',
    store: 'albertsons',
    price: 8.99,
    category: 'Meat',
    image: 'https://via.placeholder.com/200?text=Chicken',
    description: 'Boneless, skinless - 2 lbs',
  },
  {
    id: 'prod_8',
    name: 'Ground Beef',
    store: 'target',
    price: 7.49,
    category: 'Meat',
    image: 'https://via.placeholder.com/200?text=BeefGround',
    description: '85/15 lean - 2 lbs',
  },

  // Pantry
  {
    id: 'prod_9',
    name: 'Pasta',
    store: 'kroger',
    price: 1.29,
    category: 'Pantry',
    image: 'https://via.placeholder.com/200?text=Pasta',
    description: 'Spaghetti - 1 lb box',
  },
  {
    id: 'prod_10',
    name: 'Olive Oil',
    store: 'walmart',
    price: 8.99,
    category: 'Pantry',
    image: 'https://via.placeholder.com/200?text=OliveOil',
    description: 'Extra virgin - 25.5 oz',
  },
  {
    id: 'prod_11',
    name: 'Cereal',
    store: 'albertsons',
    price: 3.49,
    category: 'Pantry',
    image: 'https://via.placeholder.com/200?text=Cereal',
    description: 'Breakfast cereal - 10 oz',
  },

  // Beverages
  {
    id: 'prod_12',
    name: 'Orange Juice',
    store: 'target',
    price: 4.49,
    category: 'Beverages',
    image: 'https://via.placeholder.com/200?text=OrangeJuice',
    description: 'Fresh squeezed - 64 oz',
  },
  {
    id: 'prod_13',
    name: 'Coffee',
    store: 'kroger',
    price: 9.99,
    category: 'Beverages',
    image: 'https://via.placeholder.com/200?text=Coffee',
    description: 'Ground coffee - 12 oz',
  },
];

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_PRODUCTS.filter(
    product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.category?.toLowerCase().includes(lowerQuery) ||
      product.description?.toLowerCase().includes(lowerQuery),
  );
}

export function getProductsByStore(store: string): Product[] {
  return MOCK_PRODUCTS.filter(product => product.store === store);
}

export function getProductsByCategory(category: string): Product[] {
  return MOCK_PRODUCTS.filter(product => product.category === category);
}

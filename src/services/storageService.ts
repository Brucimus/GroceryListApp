/**
 * Service for managing persistent storage of grocery lists
 * Uses AsyncStorage for local device persistence
 */

import { GroceryList, ListItem, Product, StoreLocation } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LISTS_KEY = '@grocery_lists';
const SELECTED_LIST_KEY = '@selected_list_id';
const SELECTED_STORE_KEY = '@selected_store_location';

export class StorageService {
  /**
   * Get all grocery lists
   */
  static async getAllLists(): Promise<GroceryList[]> {
    try {
      const data = await AsyncStorage.getItem(LISTS_KEY);
      if (!data) return [];
      const lists = JSON.parse(data) as GroceryList[];
      return lists.map(list => ({
        ...list,
        createdAt: new Date(list.createdAt),
        updatedAt: new Date(list.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading lists:', error);
      return [];
    }
  }

  /**
   * Get a single list by ID
   */
  static async getList(id: string): Promise<GroceryList | null> {
    try {
      const lists = await this.getAllLists();
      return lists.find(list => list.id === id) || null;
    } catch (error) {
      console.error('Error loading list:', error);
      return null;
    }
  }

  /**
   * Create a new list
   */
  static async createList(name: string, store?: string): Promise<GroceryList> {
    const newList: GroceryList = {
      id: Date.now().toString(),
      name,
      store: store as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      totalPrice: 0,
    };

    const lists = await this.getAllLists();
    lists.push(newList);
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));

    return newList;
  }

  /**
   * Update a list
   */
  static async updateList(list: GroceryList): Promise<void> {
    try {
      const lists = await this.getAllLists();
      const index = lists.findIndex(l => l.id === list.id);
      if (index !== -1) {
        lists[index] = {
          ...list,
          updatedAt: new Date(),
        };
        await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));
      }
    } catch (error) {
      console.error('Error updating list:', error);
    }
  }

  /**
   * Delete a list
   */
  static async deleteList(id: string): Promise<void> {
    try {
      const lists = await this.getAllLists();
      const filtered = lists.filter(l => l.id !== id);
      await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  }

  /**
   * Add item to list
   */
  static async addItemToList(
    listId: string,
    product: Product,
    quantity: number = 1,
    notes?: string,
    alternatives?: Product[]
  ): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      const existingItem = list.items.find(item => item.product.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
        if (notes) existingItem.notes = notes;
        if (alternatives && alternatives.length > 0) {
          const currentAlts = existingItem.alternatives || [];
          for (const alt of alternatives) {
            if (!currentAlts.some(a => a.id === alt.id)) {
              currentAlts.push(alt);
            }
          }
          existingItem.alternatives = currentAlts;
        }
      } else {
        const newItem: ListItem = {
          id: Date.now().toString(),
          product,
          quantity,
          checked: false,
          notes,
          alternatives: alternatives || [],
        };
        list.items.push(newItem);
      }

      this.updateListTotalPrice(list);
      await this.updateList(list);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  }

  /**
   * Remove item from list
   */
  static async removeItemFromList(listId: string, itemId: string): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      list.items = list.items.filter(item => item.id !== itemId);
      this.updateListTotalPrice(list);
      await this.updateList(list);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  /**
   * Update item quantity
   */
  static async updateItemQuantity(listId: string, itemId: string, quantity: number): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      const item = list.items.find(i => i.id === itemId);
      if (item) {
        if (quantity <= 0) {
          await this.removeItemFromList(listId, itemId);
          return;
        }
        item.quantity = quantity;
        this.updateListTotalPrice(list);
        await this.updateList(list);
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
    }
  }

  /**
   * Add an alternative/substitute option to an item
   */
  static async addAlternativeToItem(
    listId: string,
    itemId: string,
    alternativeProduct: Product
  ): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      const item = list.items.find(i => i.id === itemId);
      if (item) {
        if (!item.alternatives) {
          item.alternatives = [];
        }
        // Avoid adding the primary item or duplicate alternatives
        if (
          item.product.id !== alternativeProduct.id &&
          !item.alternatives.some(alt => alt.id === alternativeProduct.id)
        ) {
          item.alternatives.push(alternativeProduct);
          await this.updateList(list);
        }
      }
    } catch (error) {
      console.error('Error adding alternative to item:', error);
    }
  }

  /**
   * Remove an alternative option from an item
   */
  static async removeAlternativeFromItem(
    listId: string,
    itemId: string,
    alternativeProductId: string
  ): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      const item = list.items.find(i => i.id === itemId);
      if (item && item.alternatives) {
        item.alternatives = item.alternatives.filter(alt => alt.id !== alternativeProductId);
        if (item.selectedAlternativeId === alternativeProductId) {
          item.selectedAlternativeId = undefined;
        }
        await this.updateList(list);
      }
    } catch (error) {
      console.error('Error removing alternative from item:', error);
    }
  }

  /**
   * Swap an alternative product into the primary product position
   */
  static async swapWithAlternative(
    listId: string,
    itemId: string,
    alternativeProductId: string
  ): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      const item = list.items.find(i => i.id === itemId);
      if (item && item.alternatives) {
        const altIndex = item.alternatives.findIndex(alt => alt.id === alternativeProductId);
        if (altIndex !== -1) {
          const oldPrimary = item.product;
          const newPrimary = item.alternatives[altIndex];
          // Replace alternative with old primary
          item.alternatives[altIndex] = oldPrimary;
          item.product = newPrimary;
          item.selectedAlternativeId = undefined;
          this.updateListTotalPrice(list);
          await this.updateList(list);
        }
      }
    } catch (error) {
      console.error('Error swapping alternative:', error);
    }
  }

  /**
   * Update item in list
   */
  static async updateListItem(listId: string, itemId: string, updates: Partial<ListItem>): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      const item = list.items.find(i => i.id === itemId);
      if (item) {
        Object.assign(item, updates);
        this.updateListTotalPrice(list);
        await this.updateList(list);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  }

  /**
   * Toggle item checked status
   */
  static async toggleItemChecked(listId: string, itemId: string): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      const item = list.items.find(i => i.id === itemId);
      if (item) {
        item.checked = !item.checked;
        await this.updateList(list);
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  }

  /**
   * Clear all items from a list
   */
  static async clearList(listId: string): Promise<void> {
    try {
      const list = await this.getList(listId);
      if (!list) return;

      list.items = [];
      list.totalPrice = 0;
      await this.updateList(list);
    } catch (error) {
      console.error('Error clearing list:', error);
    }
  }

  /**
   * Get selected list ID
   */
  static async getSelectedListId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(SELECTED_LIST_KEY);
    } catch (error) {
      console.error('Error getting selected list ID:', error);
      return null;
    }
  }

  /**
   * Set selected list ID
   */
  static async setSelectedListId(id: string): Promise<void> {
    try {
      await AsyncStorage.setItem(SELECTED_LIST_KEY, id);
    } catch (error) {
      console.error('Error setting selected list ID:', error);
    }
  }

  /**
   * Get selected store location
   */
  static async getSelectedStore(): Promise<StoreLocation | null> {
    try {
      const data = await AsyncStorage.getItem(SELECTED_STORE_KEY);
      if (!data) return null;
      return JSON.parse(data) as StoreLocation;
    } catch (error) {
      console.error('Error getting selected store:', error);
      return null;
    }
  }

  /**
   * Set selected store location
   */
  static async setSelectedStore(store: StoreLocation): Promise<void> {
    try {
      await AsyncStorage.setItem(SELECTED_STORE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error('Error setting selected store:', error);
    }
  }

  /**
   * Clear selected store location
   */
  static async clearSelectedStore(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SELECTED_STORE_KEY);
    } catch (error) {
      console.error('Error clearing selected store:', error);
    }
  }

  /**
   * Helper: Update total price for a list
   */
  private static updateListTotalPrice(list: GroceryList): void {
    list.totalPrice = list.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }
}

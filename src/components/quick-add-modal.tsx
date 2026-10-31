import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_PRODUCTS, searchProducts as searchMockProducts } from '@/data/mockProducts';
import { ApiClient } from '@/services/apiClient';
import { GroceryList, Product, StoreLocation } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

const QUICK_SUGGESTIONS = ['Milk', 'Eggs', 'Bread', 'Bananas', 'Chicken', 'Apples', 'Coffee', 'Cheese'];

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  list: GroceryList | null;
  selectedStore: StoreLocation | null;
  onAddItem: (product: Product) => void;
  onUpdateQuantity: (product: Product, quantity: number) => void;
  onViewProductDetails?: (product: Product) => void;
}

export function QuickAddModal({
  visible,
  onClose,
  list,
  selectedStore,
  onAddItem,
  onUpdateQuantity,
  onViewProductDetails,
}: QuickAddModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      loadInitialRecommendations();
    }
  }, [visible, selectedStore]);

  const loadInitialRecommendations = async () => {
    setLoading(true);
    try {
      const locId = selectedStore?.locationId;
      const results = await ApiClient.searchProducts('popular', 15, locId);
      if (results && results.length > 0) {
        setProducts(results);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    } catch {
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        loadInitialRecommendations();
        return;
      }

      setLoading(true);
      try {
        const locId = selectedStore?.locationId;
        const results = await ApiClient.searchProducts(trimmed, 20, locId);
        if (results && results.length > 0) {
          setProducts(results);
        } else {
          setProducts(searchMockProducts(trimmed));
        }
      } catch {
        setProducts(searchMockProducts(trimmed));
      } finally {
        setLoading(false);
      }
    },
    [selectedStore]
  );

  useEffect(() => {
    if (!visible) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, performSearch, visible]);

  if (!list) return null;

  // Build map of item quantities in this list
  const itemQuantityMap = new Map<string, number>();
  for (const item of list.items) {
    itemQuantityMap.set(item.product.id, item.quantity);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.modalTitle}>Add to {list.name}</ThemedText>
              {selectedStore && (
                <ThemedText style={styles.storeSubtext} numberOfLines={1}>
                  📍 {selectedStore.name} ({selectedStore.address.city})
                </ThemedText>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search store items (milk, bananas, cereal)..."
            />
          </View>

          {/* Quick Category Chips */}
          <View style={styles.suggestionsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
              {QUICK_SUGGESTIONS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setSearchQuery(item)}
                  style={[styles.suggestionChip, searchQuery.toLowerCase() === item.toLowerCase() && styles.suggestionChipActive]}
                >
                  <ThemedText
                    style={[
                      styles.suggestionText,
                      searchQuery.toLowerCase() === item.toLowerCase() && styles.suggestionTextActive,
                    ]}
                  >
                    {item}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Results List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <ThemedText style={styles.loadingText}>Searching store catalog...</ThemedText>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>🔍</ThemedText>
              <ThemedText style={styles.emptyTitle}>No items found</ThemedText>
              <ThemedText style={styles.emptySubtext}>Try searching with a broader keyword.</ThemedText>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const currentQty = itemQuantityMap.get(item.id) || 0;
                return (
                  <ProductCard
                    product={item}
                    currentQuantityInList={currentQty}
                    onPress={(prod) => {
                      if (onViewProductDetails) {
                        onViewProductDetails(prod);
                      }
                    }}
                    onQuickAdd={onAddItem}
                    onQuantityChange={onUpdateQuantity}
                  />
                );
              }}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )}

          {/* Done / Close Button */}
          <Pressable onPress={onClose} style={styles.doneBtn}>
            <ThemedText style={styles.doneBtnText}>
              Done ({list.items.length} items in list)
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  storeSubtext: {
    fontSize: 12,
    color: '#0066cc',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
  },
  searchWrapper: {
    marginBottom: 8,
  },
  suggestionsWrapper: {
    marginBottom: 10,
  },
  suggestionsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#e2e6eb',
  },
  suggestionChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  suggestionText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },
  suggestionTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    opacity: 0.6,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { StoreSelectorModal } from '@/components/store-selector-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_PRODUCTS, searchProducts as searchMockProducts } from '@/data/mockProducts';
import { ApiClient } from '@/services/apiClient';
import { StorageService } from '@/services/storageService';
import { Product, StoreLocation } from '@/types';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const QUICK_CATEGORIES = [
  'All',
  'Milk',
  'Bread',
  'Eggs',
  'Apples',
  'Chicken',
  'Snacks',
  'Beverages',
  'Produce',
];

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial data, list selection, and saved store on mount
  useEffect(() => {
    loadSelectedList();
    loadSavedStoreAndProducts();
  }, []);

  const loadSelectedList = async () => {
    const listId = await StorageService.getSelectedListId();
    setSelectedListId(listId);
  };

  const loadSavedStoreAndProducts = async () => {
    const store = await StorageService.getSelectedStore();
    setSelectedStore(store);
    loadInitialProducts(store?.locationId);
  };

  const loadInitialProducts = async (locationId?: string) => {
    setLoading(true);
    try {
      // Test backend and fetch default products from Kroger
      await ApiClient.testConnection();
      setIsOnline(true);
      const locId = locationId !== undefined ? locationId : selectedStore?.locationId;
      const results = await ApiClient.searchProducts('fresh', 20, locId);
      if (results && results.length > 0) {
        setProducts(results);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    } catch (error) {
      console.warn('Backend unavailable, using mock products:', error);
      setIsOnline(false);
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  // Perform product search with automatic Kroger API attempt and mock fallback
  const performSearch = useCallback(async (query: string, locationId?: string) => {
    const trimmed = query.trim();
    const locId = locationId !== undefined ? locationId : selectedStore?.locationId;

    if (!trimmed || trimmed.toLowerCase() === 'all') {
      loadInitialProducts(locId);
      return;
    }

    setLoading(true);
    try {
      const results = await ApiClient.searchProducts(trimmed, 25, locId);
      setIsOnline(true);
      if (results && results.length > 0) {
        setProducts(results);
      } else {
        // Fall back to mock if Kroger returned 0 items
        const mockResults = searchMockProducts(trimmed);
        setProducts(mockResults);
      }
    } catch (error) {
      console.error('API search failed, falling back to mock data:', error);
      setIsOnline(false);
      const mockResults = searchMockProducts(trimmed);
      setProducts(mockResults);
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  // Debounced search when searchQuery changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 350);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, performSearch]);

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    if (category === 'All') {
      setSearchQuery('');
    } else {
      setSearchQuery(category);
    }
  };

  const handleSelectStore = async (store: StoreLocation | null) => {
    setSelectedStore(store);
    if (store) {
      await StorageService.setSelectedStore(store);
    } else {
      await StorageService.clearSelectedStore();
    }
    // Re-query with new store locationId
    if (searchQuery.trim() && searchQuery !== 'All') {
      performSearch(searchQuery, store?.locationId);
    } else {
      loadInitialProducts(store?.locationId);
    }
  };

  const handleProductPress = (product: Product) => {
    if (!selectedListId) {
      router.push('/');
      return;
    }

    router.push({
      pathname: '/add-product',
      params: {
        productId: product.id,
        listId: selectedListId,
        productJson: JSON.stringify(product),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header Title and Status Badge */}
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.header}>
            Browse Products
          </ThemedText>

          {isOnline !== null && (
            <Pressable
              onPress={() => loadInitialProducts()}
              style={[
                styles.statusBadge,
                isOnline ? styles.onlineBadge : styles.offlineBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? '#28a745' : '#ff9800' },
                ]}
              />
              <ThemedText style={styles.statusText}>
                {isOnline ? 'Kroger Live' : 'Offline (Retry)'}
              </ThemedText>
            </Pressable>
          )}
        </View>

        {/* Selected Store Banner */}
        <Pressable
          onPress={() => setStoreModalVisible(true)}
          style={({ pressed }) => [styles.storeBanner, pressed && styles.pressed]}
        >
          <View style={styles.storeBannerIcon}>
            <ThemedText style={{ fontSize: 16 }}>📍</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            {selectedStore ? (
              <>
                <View style={styles.storeBannerTitleRow}>
                  <ThemedText style={styles.storeBannerName} numberOfLines={1}>
                    {selectedStore.name}
                  </ThemedText>
                  <View style={styles.livePricingBadge}>
                    <ThemedText style={styles.livePricingText}>Live Prices</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.storeBannerSub} numberOfLines={1}>
                  {selectedStore.address.addressLine1}, {selectedStore.address.city}, {selectedStore.address.state}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText style={styles.storeBannerPrompt}>
                  Set Your Preferred Store
                </ThemedText>
                <ThemedText style={styles.storeBannerPromptSub}>
                  Tap to choose store for real-time prices & inventory
                </ThemedText>
              </>
            )}
          </View>
          <ThemedText style={styles.storeBannerAction}>
            {selectedStore ? 'Change ›' : 'Select ›'}
          </ThemedText>
        </Pressable>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setActiveCategory(text || 'All');
          }}
          placeholder="Search Kroger products (e.g., milk, apples, coffee)..."
        />

        {/* Quick Category Chips */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {QUICK_CATEGORIES.map((cat) => {
              const isSelected = activeCategory.toLowerCase() === cat.toLowerCase();
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleCategoryPress(cat)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Offline Warning Banner */}
        {isOnline === false && (
          <Pressable onPress={() => loadInitialProducts()} style={styles.mockDataWarning}>
            <ThemedText style={styles.mockDataText}>
              ⚠️ Backend offline — Showing local data. Tap to reconnect.
            </ThemedText>
          </Pressable>
        )}

        {/* Results Header Count */}
        <View style={styles.resultsHeader}>
          <ThemedText style={styles.resultCount}>
            {loading ? 'Searching...' : `${products.length} products found`}
          </ThemedText>
          {loading && <ActivityIndicator size="small" color="#007AFF" />}
        </View>

        {/* Product List or Loading State */}
        {loading && products.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <ThemedText style={styles.loadingText}>Fetching Kroger products...</ThemedText>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyEmoji}>🔍</ThemedText>
            <ThemedText style={styles.emptyTitle}>No products found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Try a different keyword or browse a category above.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={handleProductPress} />
            )}
            scrollEnabled={true}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Store Selector Modal */}
        <StoreSelectorModal
          visible={storeModalVisible}
          onClose={() => setStoreModalVisible(false)}
          selectedStore={selectedStore}
          onSelectStore={handleSelectStore}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  onlineBadge: {
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#a8dab5',
  },
  offlineBadge: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  storeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f9ff',
    borderWidth: 1,
    borderColor: '#d0e3ff',
    marginBottom: 12,
    gap: 10,
  },
  storeBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e1eeff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeBannerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    flexShrink: 1,
  },
  livePricingBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  livePricingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1e7e34',
    textTransform: 'uppercase',
  },
  storeBannerSub: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  storeBannerPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  storeBannerPromptSub: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  storeBannerAction: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  categoriesContainer: {
    marginVertical: 10,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#444',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  mockDataWarning: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#fff3cd',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  mockDataText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  resultsHeader: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: {
    fontSize: 13,
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  pressed: {
    opacity: 0.7,
  },
});

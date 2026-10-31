import { BottomTabBar } from '@/components/bottom-tab-bar';
import { CreateListModal } from '@/components/create-list-modal';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { SelectListModal } from '@/components/select-list-modal';
import { StoreSelectorModal } from '@/components/store-selector-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_PRODUCTS, searchProducts as searchMockProducts } from '@/data/mockProducts';
import { ApiClient } from '@/services/apiClient';
import { StorageService } from '@/services/storageService';
import { GroceryList, Product, StoreLocation } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const [allLists, setAllLists] = useState<GroceryList[]>([]);
  const [activeList, setActiveList] = useState<GroceryList | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [createListModalVisible, setCreateListModalVisible] = useState(false);

  // Select List Modal State (Choose which list to add item to)
  const [selectedProductForList, setSelectedProductForList] = useState<Product | null>(null);
  const [selectListModalVisible, setSelectListModalVisible] = useState(false);

  // Toast / Status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reload lists on focus so changes from other screens are reflected
  useFocusEffect(
    useCallback(() => {
      loadListsAndSelected();
    }, [])
  );

  useEffect(() => {
    loadSavedStoreAndProducts();
  }, []);

  const showToast = (message: string) => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    setStatusMessage(message);
    statusTimer.current = setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  const loadListsAndSelected = async () => {
    const lists = await StorageService.getAllLists();
    setAllLists(lists);
    const savedId = await StorageService.getSelectedListId();
    let currentId = savedId;

    if (!currentId || !lists.some((l) => l.id === currentId)) {
      if (lists.length > 0) {
        currentId = lists[0].id;
        await StorageService.setSelectedListId(lists[0].id);
      } else {
        currentId = null;
      }
    }

    setSelectedListId(currentId);
    const found = lists.find((l) => l.id === currentId) || null;
    setActiveList(found);
  };

  const loadSavedStoreAndProducts = async () => {
    const store = await StorageService.getSelectedStore();
    setSelectedStore(store);
    loadInitialProducts(store?.locationId);
  };

  const loadInitialProducts = async (locationId?: string) => {
    setLoading(true);
    try {
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

  const performSearch = useCallback(
    async (query: string, locationId?: string) => {
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
          setProducts(searchMockProducts(trimmed));
        }
      } catch (error) {
        console.error('API search failed, falling back to mock data:', error);
        setIsOnline(false);
        setProducts(searchMockProducts(trimmed));
      } finally {
        setLoading(false);
      }
    },
    [selectedStore]
  );

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
    if (searchQuery.trim() && searchQuery !== 'All') {
      performSearch(searchQuery, store?.locationId);
    } else {
      loadInitialProducts(store?.locationId);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/add-product',
      params: {
        productId: product.id,
        listId: selectedListId || undefined,
        productJson: JSON.stringify(product),
      },
    });
  };

  // Open List Picker Modal when tapping + Add
  const handleQuickAddPress = (product: Product) => {
    if (allLists.length === 0) {
      setCreateListModalVisible(true);
      return;
    }

    // Open explicit list selection modal
    setSelectedProductForList(product);
    setSelectListModalVisible(true);
  };

  // Callback when a list is chosen in SelectListModal
  const handleAddProductToSpecificList = async (listId: string, quantity: number) => {
    if (!selectedProductForList) return;

    await StorageService.addItemToList(listId, selectedProductForList, quantity);
    await loadListsAndSelected();

    const targetList = allLists.find((l) => l.id === listId);
    const targetName = targetList ? targetList.name : 'list';
    showToast(`✓ Added ${quantity}x ${selectedProductForList.name} to "${targetName}"`);
  };

  // Quick Quantity Update from Stepper on currently active list
  const handleQuantityChange = async (product: Product, newQty: number) => {
    if (!selectedListId) return;

    if (newQty <= 0) {
      const item = activeList?.items.find((i) => i.product.id === product.id);
      if (item) {
        await StorageService.removeItemFromList(selectedListId, item.id);
        showToast(`Removed ${product.name} from list`);
      }
    } else {
      const item = activeList?.items.find((i) => i.product.id === product.id);
      if (item) {
        await StorageService.updateItemQuantity(selectedListId, item.id, newQty);
      } else {
        await StorageService.addItemToList(selectedListId, product, newQty);
      }
    }
    await loadListsAndSelected();
  };

  // Map of product id -> quantity in the currently active list
  const activeListQuantityMap = new Map<string, number>();
  if (activeList) {
    for (const item of activeList.items) {
      activeListQuantityMap.set(item.product.id, item.quantity);
    }
  }

  // Filter products based on In Stock toggle
  const displayedProducts = onlyInStock
    ? products.filter((p) => p.inStock !== false && p.stockLevel !== 'Out of Stock')
    : products;

  const inStockCount = products.filter(
    (p) => p.inStock !== false && p.stockLevel !== 'Out of Stock'
  ).length;
  const outOfStockCount = products.length - inStockCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.header}>
            Store Catalog
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
                    <ThemedText style={styles.livePricingText}>Live Stock & Prices</ThemedText>
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
                  Tap to choose store for real-time stock & in-store prices
                </ThemedText>
              </>
            )}
          </View>
          <ThemedText style={styles.storeBannerAction}>
            {selectedStore ? 'Change ›' : 'Select ›'}
          </ThemedText>
        </Pressable>

        {/* Active Target Shopping List Selector Strip */}
        <View style={styles.targetListStrip}>
          <ThemedText style={styles.targetListLabel}>Active List:</ThemedText>
          {allLists.length === 0 ? (
            <Pressable
              onPress={() => setCreateListModalVisible(true)}
              style={styles.targetListCreateBtn}
            >
              <ThemedText style={styles.targetListCreateBtnText}>
                + Create First Shopping List
              </ThemedText>
            </Pressable>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.targetListScroll}
            >
              {allLists.map((l) => {
                const isSelected = selectedListId === l.id;
                return (
                  <Pressable
                    key={l.id}
                    onPress={async () => {
                      setSelectedListId(l.id);
                      setActiveList(l);
                      await StorageService.setSelectedListId(l.id);
                    }}
                    style={[
                      styles.targetListChip,
                      isSelected && styles.targetListChipActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.targetListChipText,
                        isSelected && styles.targetListChipTextActive,
                      ]}
                    >
                      {isSelected ? '✓ ' : ''}
                      {l.name} ({l.items.length})
                    </ThemedText>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setCreateListModalVisible(true)}
                style={styles.targetListAddBtn}
              >
                <ThemedText style={styles.targetListAddBtnText}>+ New List</ThemedText>
              </Pressable>
            </ScrollView>
          )}
        </View>

        {/* Toast Notification Banner if visible */}
        {statusMessage && (
          <View style={styles.toastBanner}>
            <ThemedText style={styles.toastText}>{statusMessage}</ThemedText>
          </View>
        )}

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setActiveCategory(text || 'All');
          }}
          placeholder="Search store products (e.g., milk, apples, coffee)..."
        />

        {/* Quick Category Chips & In Stock Toggle */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {/* In Stock Only Filter Chip */}
            <Pressable
              onPress={() => setOnlyInStock(!onlyInStock)}
              style={[
                styles.filterChip,
                onlyInStock && styles.filterChipActive,
              ]}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  onlyInStock && styles.filterChipTextActive,
                ]}
              >
                {onlyInStock ? '✓ In Stock Only' : '📦 In Stock Only'}
              </ThemedText>
            </Pressable>

            <View style={styles.categoryDivider} />

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

        {/* Results Header Count & Breakdown */}
        <View style={styles.resultsHeader}>
          <ThemedText style={styles.resultCount}>
            {loading
              ? 'Searching store...'
              : `${displayedProducts.length} items${
                  selectedStore && products.length > 0
                    ? ` (${inStockCount} in stock${outOfStockCount > 0 ? `, ${outOfStockCount} out of stock` : ''})`
                    : ''
                }`}
          </ThemedText>
          {loading && <ActivityIndicator size="small" color="#007AFF" />}
        </View>

        {/* Product List or Loading State */}
        {loading && products.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <ThemedText style={styles.loadingText}>Checking store inventory & prices...</ThemedText>
          </View>
        ) : displayedProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyEmoji}>🔍</ThemedText>
            <ThemedText style={styles.emptyTitle}>
              {onlyInStock ? 'No in-stock items found' : 'No products found'}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {onlyInStock
                ? 'Try disabling the "In Stock Only" filter or searching for another item.'
                : 'Try a different keyword or browse a category above.'}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={displayedProducts}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => {
              const currentQty = activeListQuantityMap.get(item.id) || 0;
              return (
                <ProductCard
                  product={item}
                  currentQuantityInList={currentQty}
                  onPress={handleProductPress}
                  onQuickAdd={handleQuickAddPress}
                  onQuantityChange={handleQuantityChange}
                />
              );
            }}
            scrollEnabled={true}
            contentContainerStyle={[
              styles.listContent,
              activeList && activeList.items.length > 0 && { paddingBottom: 80 },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating Active List Summary Bar */}
        {activeList && activeList.items.length > 0 && (
          <View style={styles.floatingListBar}>
            <View style={styles.floatingListInfo}>
              <ThemedText style={styles.floatingListName} numberOfLines={1}>
                🛒 {activeList.name}
              </ThemedText>
              <ThemedText style={styles.floatingListMeta}>
                {activeList.items.length} {activeList.items.length === 1 ? 'item' : 'items'} • ${activeList.totalPrice.toFixed(2)}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => router.push(`/list/${activeList.id}`)}
              style={styles.floatingListViewBtn}
            >
              <ThemedText style={styles.floatingListViewText}>View List ›</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Store Selector Modal */}
        <StoreSelectorModal
          visible={storeModalVisible}
          onClose={() => setStoreModalVisible(false)}
          selectedStore={selectedStore}
          onSelectStore={handleSelectStore}
        />

        {/* Choose List Modal (when tapping + Add) */}
        <SelectListModal
          visible={selectListModalVisible}
          onClose={() => setSelectListModalVisible(false)}
          product={selectedProductForList}
          lists={allLists}
          onSelectList={handleAddProductToSpecificList}
          onCreateNewList={() => {
            setSelectListModalVisible(false);
            setCreateListModalVisible(true);
          }}
        />

        {/* Create List Modal */}
        <CreateListModal
          visible={createListModalVisible}
          onClose={() => setCreateListModalVisible(false)}
          onListCreated={async (newList) => {
            await loadListsAndSelected();
            setSelectedListId(newList.id);
            setActiveList(newList);

            // If a product was queued to add, add it to this newly created list
            if (selectedProductForList) {
              await StorageService.addItemToList(newList.id, selectedProductForList, 1);
              await loadListsAndSelected();
              showToast(`✓ Added ${selectedProductForList.name} to "${newList.name}"!`);
              setSelectedProductForList(null);
            }
          }}
        />
      </ThemedView>
      <BottomTabBar activeTab="explore" />
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
    paddingTop: 14,
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
    marginBottom: 8,
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
  targetListStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  targetListLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  targetListScroll: {
    gap: 6,
    alignItems: 'center',
  },
  targetListChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#e2e6eb',
  },
  targetListChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  targetListChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  targetListChipTextActive: {
    color: '#fff',
  },
  targetListAddBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
    backgroundColor: '#f5f9ff',
  },
  targetListAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },
  targetListCreateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#007AFF',
  },
  targetListCreateBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  toastBanner: {
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#a8dab5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  toastText: {
    color: '#1e7e34',
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesContainer: {
    marginVertical: 8,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#28a745',
  },
  filterChipActive: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#28a745',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  categoryDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#ddd',
    marginHorizontal: 2,
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
    paddingVertical: 6,
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
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  pressed: {
    opacity: 0.7,
  },
  floatingListBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingListInfo: {
    flex: 1,
    marginRight: 12,
  },
  floatingListName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  floatingListMeta: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '500',
  },
  floatingListViewBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  floatingListViewText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

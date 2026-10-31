import { AddAlternativeModal } from '@/components/add-alternative-modal';
import { ListItemCard } from '@/components/list-item-card';
import { QuickAddModal } from '@/components/quick-add-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StorageService } from '@/services/storageService';
import { GroceryList, ListItem, Product, StoreLocation } from '@/types';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed' | 'out_of_stock'>('all');

  // Modal States
  const [selectedItemForAlt, setSelectedItemForAlt] = useState<ListItem | null>(null);
  const [altModalVisible, setAltModalVisible] = useState(false);
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);

  const loadList = async (listId: string) => {
    setLoading(true);
    const loadedList = await StorageService.getList(listId);
    setList(loadedList);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadList(id);
        StorageService.getSelectedStore().then((store) => {
          setSelectedStore(store);
        });
      }
    }, [id])
  );

  const handleCheckToggle = async (itemId: string) => {
    if (!list) return;
    await StorageService.toggleItemChecked(list.id, itemId);
    const updated = await StorageService.getList(list.id);
    setList(updated);
  };

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (!list) return;
    await StorageService.updateItemQuantity(list.id, itemId, quantity);
    const updated = await StorageService.getList(list.id);
    setList(updated);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!list) return;
    await StorageService.removeItemFromList(list.id, itemId);
    const updated = await StorageService.getList(list.id);
    setList(updated);
  };

  // Quick Add Modal Handlers
  const handleQuickAddItem = async (product: Product) => {
    if (!list) return;
    await StorageService.addItemToList(list.id, product, 1);
    const updated = await StorageService.getList(list.id);
    setList(updated);
  };

  const handleQuickUpdateQuantity = async (product: Product, quantity: number) => {
    if (!list) return;
    const existingItem = list.items.find((i) => i.product.id === product.id);
    if (existingItem) {
      if (quantity <= 0) {
        await StorageService.removeItemFromList(list.id, existingItem.id);
      } else {
        await StorageService.updateItemQuantity(list.id, existingItem.id, quantity);
      }
    } else if (quantity > 0) {
      await StorageService.addItemToList(list.id, product, quantity);
    }
    const updated = await StorageService.getList(list.id);
    setList(updated);
  };

  // Alternative Handlers
  const handleOpenAddAlternative = (item: ListItem) => {
    setSelectedItemForAlt(item);
    setAltModalVisible(true);
  };

  const handleSelectAlternative = async (alternativeProduct: Product) => {
    if (!list || !selectedItemForAlt) return;
    await StorageService.addAlternativeToItem(
      list.id,
      selectedItemForAlt.id,
      alternativeProduct
    );
    const updated = await StorageService.getList(list.id);
    setList(updated);
    const updatedItem = updated?.items.find((i) => i.id === selectedItemForAlt.id);
    if (updatedItem) {
      setSelectedItemForAlt(updatedItem);
    }
  };

  const handleRemoveAlternative = async (itemId: string, altId: string) => {
    if (!list) return;
    await StorageService.removeAlternativeFromItem(list.id, itemId, altId);
    const updated = await StorageService.getList(list.id);
    setList(updated);
  };

  const handleSwapWithAlternative = async (itemId: string, altId: string) => {
    if (!list) return;
    await StorageService.swapWithAlternative(list.id, itemId, altId);
    const updated = await StorageService.getList(list.id);
    setList(updated);
  };

  const handleClearList = () => {
    Alert.alert('Clear List', 'Are you sure you want to remove all items from this list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          if (list) {
            await StorageService.clearList(list.id);
            loadList(list.id);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={{ marginTop: 12 }}>Loading list...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.centerContainer}>
          <ThemedText style={styles.notFoundTitle}>List not found</ThemedText>
          <Pressable onPress={() => router.push('/')} style={styles.backHomeBtn}>
            <ThemedText style={styles.backHomeBtnText}>Go to My Lists</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const items = list.items || [];
  const checkedCount = items.filter((item) => item.checked).length;
  const outOfStockItems = items.filter(
    (item) => item.product.inStock === false || item.product.stockLevel === 'Out of Stock'
  );

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterMode === 'pending') return !item.checked;
    if (filterMode === 'completed') return item.checked;
    if (filterMode === 'out_of_stock') {
      return item.product.inStock === false || item.product.stockLevel === 'Out of Stock';
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Header navigation and title */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>← Lists</ThemedText>
          </Pressable>

          <View style={styles.titleRow}>
            <ThemedText type="title" style={styles.title} numberOfLines={1}>
              {list.name}
            </ThemedText>
            <Pressable
              onPress={() => setQuickAddModalVisible(true)}
              style={styles.headerAddBtn}
            >
              <ThemedText style={styles.headerAddBtnText}>+ Quick Add</ThemedText>
            </Pressable>
          </View>

          {selectedStore && (
            <View style={styles.storeBadge}>
              <ThemedText style={styles.storeBadgeText}>
                📍 {selectedStore.name} ({selectedStore.address.city})
              </ThemedText>
            </View>
          )}
        </View>

        {/* Quick Search & Add Trigger Bar */}
        <Pressable
          onPress={() => setQuickAddModalVisible(true)}
          style={styles.quickAddTrigger}
        >
          <ThemedText style={styles.quickAddTriggerIcon}>🔍</ThemedText>
          <ThemedText style={styles.quickAddTriggerPlaceholder}>
            Search store items to add to this list...
          </ThemedText>
          <ThemedText style={styles.quickAddTriggerPlus}>+ Add</ThemedText>
        </Pressable>

        {/* List Summary Bar */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <ThemedText style={styles.statLabel}>ITEMS</ThemedText>
            <ThemedText style={styles.statVal}>
              {checkedCount}/{items.length} Checked
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <ThemedText style={styles.statLabel}>ESTIMATED TOTAL</ThemedText>
            <ThemedText style={styles.statValTotal}>
              ${list.totalPrice.toFixed(2)}
            </ThemedText>
          </View>
        </View>

        {/* Out of stock alert banner if items are out of stock */}
        {outOfStockItems.length > 0 && (
          <View style={styles.outOfStockBanner}>
            <ThemedText style={styles.outOfStockIcon}>⚠️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.outOfStockBannerTitle}>
                {outOfStockItems.length} item{outOfStockItems.length > 1 ? 's are' : ' is'} out of stock
              </ThemedText>
              <ThemedText style={styles.outOfStockBannerSub}>
                Check or add backup alternative options below to stay prepared.
              </ThemedText>
            </View>
          </View>
        )}

        {/* Filter Chips */}
        {items.length > 0 && (
          <View style={styles.filtersRow}>
            <Pressable
              onPress={() => setFilterMode('all')}
              style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  filterMode === 'all' && styles.filterChipTextActive,
                ]}
              >
                All ({items.length})
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setFilterMode('pending')}
              style={[styles.filterChip, filterMode === 'pending' && styles.filterChipActive]}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  filterMode === 'pending' && styles.filterChipTextActive,
                ]}
              >
                To Buy ({items.length - checkedCount})
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setFilterMode('completed')}
              style={[styles.filterChip, filterMode === 'completed' && styles.filterChipActive]}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  filterMode === 'completed' && styles.filterChipTextActive,
                ]}
              >
                Done ({checkedCount})
              </ThemedText>
            </Pressable>

            {outOfStockItems.length > 0 && (
              <Pressable
                onPress={() => setFilterMode('out_of_stock')}
                style={[
                  styles.filterChip,
                  styles.filterChipWarn,
                  filterMode === 'out_of_stock' && styles.filterChipWarnActive,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterChipWarnText,
                    filterMode === 'out_of_stock' && styles.filterChipWarnTextActive,
                  ]}
                >
                  Out of Stock ({outOfStockItems.length})
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>🛒</ThemedText>
            <ThemedText style={styles.emptyTitle}>Your list is empty</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Search the store catalog or browse products to add items with live prices and stock.
            </ThemedText>
            <View style={styles.emptyButtonRow}>
              <Pressable
                onPress={() => setQuickAddModalVisible(true)}
                style={styles.emptyQuickAddBtn}
              >
                <ThemedText style={styles.emptyQuickAddBtnText}>
                  + Search & Add Items
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  StorageService.setSelectedListId(list.id);
                  router.push('/explore');
                }}
                style={styles.emptyBrowseBtn}
              >
                <ThemedText style={styles.emptyBrowseBtnText}>
                  Browse Full Catalog ›
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        ) : filteredItems.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>No items match this filter</ThemedText>
            <Pressable onPress={() => setFilterMode('all')} style={styles.resetFilterBtn}>
              <ThemedText style={styles.resetFilterBtnText}>Show All Items</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ListItemCard
                item={item}
                onCheckToggle={() => handleCheckToggle(item.id)}
                onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
                onDelete={() => handleDeleteItem(item.id)}
                onOpenAddAlternative={() => handleOpenAddAlternative(item)}
                onRemoveAlternative={(altId) => handleRemoveAlternative(item.id, altId)}
                onSwapWithAlternative={(altId) => handleSwapWithAlternative(item.id, altId)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer Action Bar */}
        {items.length > 0 && (
          <View style={styles.actionBar}>
            <Pressable onPress={handleClearList} style={styles.clearButton}>
              <ThemedText style={styles.clearButtonText}>Clear All</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setQuickAddModalVisible(true)}
              style={styles.quickAddFooterBtn}
            >
              <ThemedText style={styles.quickAddFooterBtnText}>+ Quick Add</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                StorageService.setSelectedListId(list.id);
                router.push('/explore');
              }}
              style={styles.browseButton}
            >
              <ThemedText style={styles.browseButtonText}>Browse Catalog</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Quick Add Product Search Modal */}
        <QuickAddModal
          visible={quickAddModalVisible}
          onClose={() => setQuickAddModalVisible(false)}
          list={list}
          selectedStore={selectedStore}
          onAddItem={handleQuickAddItem}
          onUpdateQuantity={handleQuickUpdateQuantity}
          onViewProductDetails={(prod) => {
            setQuickAddModalVisible(false);
            router.push({
              pathname: '/add-product',
              params: {
                productId: prod.id,
                listId: list.id,
                productJson: JSON.stringify(prod),
              },
            });
          }}
        />

        {/* Alternative Product Search Modal */}
        <AddAlternativeModal
          visible={altModalVisible}
          onClose={() => {
            setAltModalVisible(false);
            setSelectedItemForAlt(null);
          }}
          primaryProduct={selectedItemForAlt ? selectedItemForAlt.product : null}
          existingAlternatives={selectedItemForAlt ? selectedItemForAlt.alternatives : []}
          onSelectAlternative={handleSelectAlternative}
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
    paddingTop: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  backHomeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    marginBottom: 8,
  },
  backButton: {
    marginBottom: 6,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    flex: 1,
  },
  headerAddBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerAddBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  storeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef5ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#cce2ff',
  },
  storeBadgeText: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '600',
  },
  quickAddTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e6eb',
    gap: 8,
  },
  quickAddTriggerIcon: {
    fontSize: 14,
  },
  quickAddTriggerPlaceholder: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  quickAddTriggerPlus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f8fa',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  statValTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#007AFF',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#ddd',
    marginHorizontal: 12,
  },
  outOfStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    gap: 8,
  },
  outOfStockIcon: {
    fontSize: 18,
  },
  outOfStockBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#856404',
  },
  outOfStockBannerSub: {
    fontSize: 11,
    color: '#856404',
    marginTop: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  filterChipWarn: {
    backgroundColor: '#fee',
  },
  filterChipWarnActive: {
    backgroundColor: '#dc3545',
  },
  filterChipWarnText: {
    fontSize: 12,
    color: '#c00',
    fontWeight: '600',
  },
  filterChipWarnTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyButtonRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  emptyQuickAddBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyQuickAddBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyBrowseBtn: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyBrowseBtnText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resetFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resetFilterBtnText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 14,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  quickAddFooterBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  quickAddFooterBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  browseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#eef5ff',
    borderWidth: 1,
    borderColor: '#cce2ff',
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

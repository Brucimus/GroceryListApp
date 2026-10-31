import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_PRODUCTS, searchProducts as searchMockProducts } from '@/data/mockProducts';
import { ApiClient } from '@/services/apiClient';
import { StorageService } from '@/services/storageService';
import { Product } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

interface AddAlternativeModalProps {
  visible: boolean;
  onClose: () => void;
  primaryProduct: Product | null;
  existingAlternatives?: Product[];
  onSelectAlternative: (alternative: Product) => void;
}

export function AddAlternativeModal({
  visible,
  onClose,
  primaryProduct,
  existingAlternatives = [],
  onSelectAlternative,
}: AddAlternativeModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStoreLocationId, setSelectedStoreLocationId] = useState<string | undefined>();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize search query with smart keyword from primary product
  useEffect(() => {
    if (visible && primaryProduct) {
      const existingSet = new Set(existingAlternatives.map((a) => a.id));
      setAddedIds(existingSet);

      // Smart initial keyword: first word or category
      const words = primaryProduct.name.split(' ').filter((w) => w.length > 2);
      const initialKeyword = primaryProduct.category || words[0] || primaryProduct.name;
      setSearchQuery(initialKeyword);

      StorageService.getSelectedStore().then((store) => {
        const locId = store?.locationId;
        setSelectedStoreLocationId(locId);
        searchSubstitutes(initialKeyword, locId);
      });
    }
  }, [visible, primaryProduct]);

  const searchSubstitutes = useCallback(
    async (query: string, locId?: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const results = await ApiClient.searchProducts(trimmed, 20, locId);
        if (results && results.length > 0) {
          setProducts(results);
        } else {
          setProducts(searchMockProducts(trimmed));
        }
      } catch (err) {
        setProducts(searchMockProducts(trimmed));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounce search
  useEffect(() => {
    if (!visible) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      if (searchQuery.trim()) {
        searchSubstitutes(searchQuery, selectedStoreLocationId);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, selectedStoreLocationId, searchSubstitutes, visible]);

  const handleAdd = (alt: Product) => {
    onSelectAlternative(alt);
    setAddedIds((prev) => new Set(prev).add(alt.id));
  };

  if (!primaryProduct) return null;

  // Filter out the primary item from candidate alternatives
  const candidateProducts = products.filter((p) => p.id !== primaryProduct.id);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.modalTitle}>Add Alternative Option</ThemedText>
              <ThemedText style={styles.primaryName} numberOfLines={1}>
                Substitute for: {primaryProduct.name}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Primary Item Info Banner */}
          <View style={styles.primaryCard}>
            <ThemedText style={styles.primaryLabel}>PRIMARY ITEM</ThemedText>
            <View style={styles.primaryRow}>
              <ThemedText style={styles.primaryItemName} numberOfLines={1}>
                {primaryProduct.name}
              </ThemedText>
              <ThemedText style={styles.primaryItemPrice}>
                ${primaryProduct.price.toFixed(2)}
              </ThemedText>
            </View>
            <View style={styles.primaryMetaRow}>
              {primaryProduct.stockLevel || primaryProduct.inStock !== undefined ? (
                <ThemedText
                  style={[
                    styles.primaryStockText,
                    {
                      color:
                        primaryProduct.inStock === false ||
                        primaryProduct.stockLevel === 'Out of Stock'
                          ? '#dc3545'
                          : '#28a745',
                    },
                  ]}
                >
                  {primaryProduct.stockLevel ||
                    (primaryProduct.inStock ? '● In Stock' : '● Out of Stock')}
                </ThemedText>
              ) : null}
              {primaryProduct.aisle && (
                <ThemedText style={styles.primaryAisleText}>
                  📍 {primaryProduct.aisle}
                </ThemedText>
              )}
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search alternative brand, size, or type..."
            />
          </View>

          {/* Results List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <ThemedText style={styles.loadingText}>Searching store substitutes...</ThemedText>
            </View>
          ) : candidateProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyEmoji}>🔍</ThemedText>
              <ThemedText style={styles.emptyTitle}>No matching alternatives</ThemedText>
              <ThemedText style={styles.emptySub}>
                Try searching for a different brand, flavor, or keyword.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={candidateProducts}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isAlreadyAdded = addedIds.has(item.id);
                const priceDiff = item.price - primaryProduct.price;
                const priceDiffText =
                  priceDiff === 0
                    ? 'Same price'
                    : priceDiff > 0
                    ? `+$${priceDiff.toFixed(2)}`
                    : `-$${Math.abs(priceDiff).toFixed(2)}`;

                const isOutOfStock =
                  item.inStock === false || item.stockLevel === 'Out of Stock';

                return (
                  <View style={styles.altCard}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.altImage} />
                    ) : (
                      <View style={styles.altImagePlaceholder}>
                        <ThemedText style={{ fontSize: 20 }}>🛒</ThemedText>
                      </View>
                    )}

                    <View style={styles.altInfo}>
                      <ThemedText style={styles.altName} numberOfLines={2}>
                        {item.name}
                      </ThemedText>

                      <View style={styles.altMetaRow}>
                        <ThemedText style={styles.altPrice}>
                          ${item.price.toFixed(2)}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.priceDiff,
                            {
                              color:
                                priceDiff > 0
                                  ? '#d97706'
                                  : priceDiff < 0
                                  ? '#28a745'
                                  : '#666',
                            },
                          ]}
                        >
                          ({priceDiffText})
                        </ThemedText>
                      </View>

                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.stockBadge,
                            isOutOfStock
                              ? styles.stockBadgeOut
                              : styles.stockBadgeIn,
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.stockBadgeText,
                              isOutOfStock
                                ? styles.stockBadgeTextOut
                                : styles.stockBadgeTextIn,
                            ]}
                          >
                            {item.stockLevel ||
                              (item.inStock === false ? 'Out of Stock' : 'In Stock')}
                          </ThemedText>
                        </View>
                        {item.aisle && (
                          <ThemedText style={styles.aisleText}>
                            📍 {item.aisle}
                          </ThemedText>
                        )}
                      </View>
                    </View>

                    <Pressable
                      disabled={isAlreadyAdded}
                      onPress={() => handleAdd(item)}
                      style={[
                        styles.addAltBtn,
                        isAlreadyAdded && styles.addAltBtnAdded,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.addAltBtnText,
                          isAlreadyAdded && styles.addAltBtnTextAdded,
                        ]}
                      >
                        {isAlreadyAdded ? 'Added ✓' : '+ Add'}
                      </ThemedText>
                    </Pressable>
                  </View>
                );
              }}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )}

          {/* Footer Done button */}
          <Pressable onPress={onClose} style={styles.doneBtn}>
            <ThemedText style={styles.doneBtnText}>Done</ThemedText>
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
    maxHeight: '88%',
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryName: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
  },
  primaryCard: {
    backgroundColor: '#f5f7fa',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    marginBottom: 12,
  },
  primaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  primaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryItemName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  primaryItemPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  primaryStockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  primaryAisleText: {
    fontSize: 11,
    color: '#0066cc',
  },
  searchWrapper: {
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginBottom: 8,
  },
  altImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  altImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  altInfo: {
    flex: 1,
    marginRight: 10,
  },
  altName: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 3,
  },
  altMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  altPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  priceDiff: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeIn: {
    backgroundColor: '#e6f4ea',
  },
  stockBadgeOut: {
    backgroundColor: '#fce8e6',
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stockBadgeTextIn: {
    color: '#1e7e34',
  },
  stockBadgeTextOut: {
    color: '#d93025',
  },
  aisleText: {
    fontSize: 10,
    color: '#0066cc',
    fontWeight: '500',
  },
  addAltBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  addAltBtnAdded: {
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  addAltBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  addAltBtnTextAdded: {
    color: '#28a745',
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
    fontWeight: '600',
  },
});

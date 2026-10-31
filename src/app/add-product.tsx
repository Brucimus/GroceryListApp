import { AddAlternativeModal } from '@/components/add-alternative-modal';
import { CreateListModal } from '@/components/create-list-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { ApiClient } from '@/services/apiClient';
import { StorageService } from '@/services/storageService';
import { GroceryList, Product } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddProductScreen() {
  const { productId, listId, productJson } = useLocalSearchParams<{
    productId: string;
    listId?: string;
    productJson?: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(listId || null);
  const [createListModalVisible, setCreateListModalVisible] = useState(false);

  // Alternatives state
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [altModalVisible, setAltModalVisible] = useState(false);

  useEffect(() => {
    loadLists();
  }, [listId]);

  const loadLists = async () => {
    const allLists = await StorageService.getAllLists();
    setLists(allLists);

    if (listId) {
      setSelectedListId(listId);
    } else if (allLists.length > 0) {
      const activeListId = await StorageService.getSelectedListId();
      if (activeListId && allLists.some((l) => l.id === activeListId)) {
        setSelectedListId(activeListId);
      } else {
        setSelectedListId(allLists[0].id);
      }
    }
  };

  useEffect(() => {
    if (productJson) {
      try {
        setProduct(JSON.parse(productJson));
        return;
      } catch (e) {
        console.error('Failed to parse product JSON', e);
      }
    }

    if (productId) {
      const foundProduct = MOCK_PRODUCTS.find((p) => p.id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
        return;
      }

      setLoading(true);
      ApiClient.getProduct(productId)
        .then((p) => {
          setProduct(p);
        })
        .catch((err) => {
          console.error('Failed to fetch product details', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [productId, productJson]);

  const handleAddAlternative = (altProduct: Product) => {
    if (!alternatives.some((a) => a.id === altProduct.id)) {
      setAlternatives((prev) => [...prev, altProduct]);
    }
  };

  const handleRemoveAlternative = (altId: string) => {
    setAlternatives((prev) => prev.filter((a) => a.id !== altId));
  };

  const handleAddToList = async () => {
    if (!product) return;

    let targetListId = selectedListId;

    // If no lists exist, open create modal
    if (!targetListId) {
      if (lists.length === 0) {
        setCreateListModalVisible(true);
        return;
      } else {
        targetListId = lists[0].id;
      }
    }

    const qty = parseInt(quantity) || 1;
    if (qty < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity of at least 1');
      return;
    }

    try {
      await StorageService.addItemToList(
        targetListId,
        product,
        qty,
        notes.trim() || undefined,
        alternatives.length > 0 ? alternatives : undefined
      );

      const targetList = lists.find((l) => l.id === targetListId);
      const listName = targetList ? targetList.name : 'your list';

      Alert.alert('Added to List', `Added ${qty}x ${product.name} to "${listName}"!`, [
        {
          text: 'Keep Browsing',
          onPress: () => router.back(),
        },
        {
          text: 'View List',
          onPress: () => {
            router.back();
            router.push(`/list/${targetListId}`);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to list');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={{ marginTop: 12 }}>Loading product details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>
          <ThemedText>Product not found</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const unitPrice = typeof product.price === 'number' ? product.price : 0;
  const parsedQty = parseInt(quantity || '1') || 1;
  const totalPrice = (unitPrice * parsedQty).toFixed(2);
  const isOutOfStock =
    product.inStock === false || product.stockLevel === 'Out of Stock';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>← Back to Store</ThemedText>
          </Pressable>

          <ThemedText type="title" style={styles.title}>
            Add Item to List
          </ThemedText>

          {/* Product Details Card */}
          <ThemedView style={styles.productCard}>
            <View style={styles.productHeaderRow}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.productImage} />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <ThemedText style={{ fontSize: 24 }}>🛒</ThemedText>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.productName}>{product.name}</ThemedText>
                <ThemedText style={styles.productPriceText}>
                  {unitPrice > 0 ? `$${unitPrice.toFixed(2)}` : 'In-store price'}
                </ThemedText>
              </View>
            </View>

            {product.description ? (
              <ThemedText style={styles.productDescription}>{product.description}</ThemedText>
            ) : null}

            <View style={styles.infoTable}>
              {product.stockLevel !== undefined || product.inStock !== undefined ? (
                <View style={styles.productInfo}>
                  <ThemedText style={styles.infoLabel}>Stock Status:</ThemedText>
                  <ThemedText
                    style={[
                      styles.infoValue,
                      { color: isOutOfStock ? '#dc3545' : '#28a745' },
                    ]}
                  >
                    {product.stockLevel || (product.inStock ? '● In Stock' : '● Out of Stock')}
                  </ThemedText>
                </View>
              ) : null}

              {product.aisle && (
                <View style={styles.productInfo}>
                  <ThemedText style={styles.infoLabel}>Aisle Location:</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: '#0066cc' }]}>
                    📍 {product.aisle}
                  </ThemedText>
                </View>
              )}

              {product.category && (
                <View style={styles.productInfo}>
                  <ThemedText style={styles.infoLabel}>Category:</ThemedText>
                  <ThemedText style={styles.infoValue}>{product.category}</ThemedText>
                </View>
              )}
            </View>
          </ThemedView>

          {/* Out of Stock Callout */}
          {isOutOfStock && (
            <View style={styles.outOfStockAlert}>
              <ThemedText style={styles.outOfStockAlertText}>
                ⚠️ This item is currently reported out of stock. You can add alternative backup options below!
              </ThemedText>
            </View>
          )}

          {/* Target List Selector */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Add to Shopping List</ThemedText>
            {lists.length === 0 ? (
              <Pressable
                onPress={() => setCreateListModalVisible(true)}
                style={styles.createListPromptBtn}
              >
                <ThemedText style={styles.createListPromptText}>
                  + Create New List to Save Item
                </ThemedText>
              </Pressable>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listChipsScroll}
              >
                {lists.map((l) => {
                  const isSelected = selectedListId === l.id;
                  return (
                    <Pressable
                      key={l.id}
                      onPress={() => setSelectedListId(l.id)}
                      style={[
                        styles.listChip,
                        isSelected && styles.listChipSelected,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.listChipText,
                          isSelected && styles.listChipTextSelected,
                        ]}
                      >
                        {isSelected ? '✓ ' : ''}
                        {l.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => setCreateListModalVisible(true)}
                  style={styles.newListChip}
                >
                  <ThemedText style={styles.newListChipText}>+ New List</ThemedText>
                </Pressable>
              </ScrollView>
            )}
          </View>

          {/* Quantity Stepper */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Quantity</ThemedText>
            <View style={styles.quantityInputContainer}>
              <Pressable
                onPress={() => {
                  const q = Math.max(1, parseInt(quantity || '1') - 1);
                  setQuantity(q.toString());
                }}
                style={styles.quantityBtn}
              >
                <ThemedText style={styles.quantityBtnText}>−</ThemedText>
              </Pressable>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                placeholder="1"
              />
              <Pressable
                onPress={() => {
                  const q = (parseInt(quantity || '1') || 1) + 1;
                  setQuantity(q.toString());
                }}
                style={styles.quantityBtn}
              >
                <ThemedText style={styles.quantityBtnText}>+</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Alternative Options / Substitutes */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.sectionLabel}>
                Alternative Options ({alternatives.length})
              </ThemedText>
              <Pressable
                onPress={() => setAltModalVisible(true)}
                style={styles.addAltSectionBtn}
              >
                <ThemedText style={styles.addAltSectionBtnText}>
                  + Add Backup Option
                </ThemedText>
              </Pressable>
            </View>

            {alternatives.length === 0 ? (
              <Pressable
                onPress={() => setAltModalVisible(true)}
                style={styles.altEmptyBox}
              >
                <ThemedText style={styles.altEmptyText}>
                  Tap to add a substitute in case this product is out of stock.
                </ThemedText>
              </Pressable>
            ) : (
              <View style={styles.altList}>
                {alternatives.map((alt) => (
                  <View key={alt.id} style={styles.altRow}>
                    <ThemedText style={{ fontSize: 13, marginRight: 6 }}>↳</ThemedText>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <ThemedText style={styles.altRowName} numberOfLines={1}>
                        {alt.name}
                      </ThemedText>
                      <ThemedText style={styles.altRowPrice}>
                        ${alt.price.toFixed(2)}{' '}
                        {alt.aisle ? `• 📍 ${alt.aisle}` : ''}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => handleRemoveAlternative(alt.id)}
                      style={styles.removeAltBtn}
                    >
                      <ThemedText style={styles.removeAltBtnText}>✕</ThemedText>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Notes (optional)</ThemedText>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Ripe, organic only, 2% if whole unavailable..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Total Price Preview */}
          <View style={styles.pricePreview}>
            <ThemedText style={styles.priceLabel}>
              Estimated total ({parsedQty} item{parsedQty > 1 ? 's' : ''}):
            </ThemedText>
            <ThemedText style={styles.priceValue}>
              {unitPrice > 0 ? `$${totalPrice}` : 'In-store'}
            </ThemedText>
          </View>

          {/* Action Buttons */}
          <Pressable onPress={handleAddToList} style={styles.addButton}>
            <ThemedText style={styles.addButtonText}>Add to Shopping List</ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.cancelButton}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>

      {/* Alternative Selector Modal */}
      <AddAlternativeModal
        visible={altModalVisible}
        onClose={() => setAltModalVisible(false)}
        primaryProduct={product}
        existingAlternatives={alternatives}
        onSelectAlternative={handleAddAlternative}
      />

      {/* Create List Modal */}
      <CreateListModal
        visible={createListModalVisible}
        onClose={() => setCreateListModalVisible(false)}
        onListCreated={(newList) => {
          loadLists();
          setSelectedListId(newList.id);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8edf2',
    backgroundColor: '#fff',
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  productPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#007AFF',
  },
  productDescription: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 12,
  },
  infoTable: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  outOfStockAlert: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff3cd',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    marginBottom: 16,
  },
  outOfStockAlertText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  listChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  listChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: '#e2e6eb',
  },
  listChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  listChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  listChipTextSelected: {
    color: '#fff',
  },
  newListChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
    backgroundColor: '#f5f9ff',
  },
  newListChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  createListPromptBtn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eef5ff',
    borderWidth: 1,
    borderColor: '#cce2ff',
    alignItems: 'center',
  },
  createListPromptText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 13,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  addAltSectionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eef5ff',
  },
  addAltSectionBtnText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '700',
  },
  altEmptyBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  altEmptyText: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
  },
  altList: {
    gap: 6,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fbfd',
    borderWidth: 1,
    borderColor: '#e1e8f0',
  },
  altRowName: {
    fontSize: 13,
    fontWeight: '600',
  },
  altRowPrice: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  removeAltBtn: {
    padding: 6,
  },
  removeAltBtnText: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 60,
    backgroundColor: '#fff',
  },
  pricePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f7fa',
    marginBottom: 18,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});

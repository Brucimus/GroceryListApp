import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MOCK_PRODUCTS } from '@/data/mockProducts';
import { ApiClient } from '@/services/apiClient';
import { StorageService } from '@/services/storageService';
import { Product } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddProductScreen() {
  const { productId, listId, productJson } = useLocalSearchParams<{ productId: string; listId: string; productJson?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

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

  const handleAddToList = async () => {
    if (!product || !listId) return;

    const qty = parseInt(quantity) || 1;
    if (qty < 1) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity of at least 1');
      return;
    }

    try {
      await StorageService.addItemToList(listId, product, qty);
      Alert.alert('Success', `Added ${product.name} to your list!`, [
        {
          text: 'Continue Shopping',
          onPress: () => router.back(),
        },
        {
          text: 'View List',
          onPress: () => {
            router.back();
            router.push(`/list/${listId}`);
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
          <ActivityIndicator size="large" />
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>

          <ThemedText type="title" style={styles.title}>
            Add to List
          </ThemedText>

          {/* Product Details */}
          <ThemedView style={styles.productCard}>
            <ThemedText style={styles.productName}>{product.name}</ThemedText>
            {product.description ? (
              <ThemedText style={styles.productDescription}>{product.description}</ThemedText>
            ) : null}

            <View style={styles.productInfo}>
              <ThemedText style={styles.infoLabel}>Store:</ThemedText>
              <ThemedText style={styles.infoValue}>{product.store}</ThemedText>
            </View>

            <View style={styles.productInfo}>
              <ThemedText style={styles.infoLabel}>Price:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {unitPrice > 0 ? `$${unitPrice.toFixed(2)}` : 'In-store price'}
              </ThemedText>
            </View>

            {product.category && (
              <View style={styles.productInfo}>
                <ThemedText style={styles.infoLabel}>Category:</ThemedText>
                <ThemedText style={styles.infoValue}>{product.category}</ThemedText>
              </View>
            )}
          </ThemedView>

          {/* Quantity Input */}
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

          {/* Notes */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Notes (optional)</ThemedText>
            <TextInput
              style={[styles.notesInput]}
              placeholder="Add notes, e.g., ripeness, size..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Total Price Preview */}
          <View style={styles.pricePreview}>
            <ThemedText style={styles.priceLabel}>Total for this item:</ThemedText>
            <ThemedText style={styles.priceValue}>
              {unitPrice > 0 ? `$${totalPrice}` : 'In-store'}
            </ThemedText>
          </View>

          {/* Action Buttons */}
          <Pressable onPress={handleAddToList} style={styles.addButton}>
            <ThemedText style={styles.addButtonText}>Add to List</ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.cancelButton}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
  },
  productCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
    backgroundColor: '#f0f0f0',
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
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
  },
  pricePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

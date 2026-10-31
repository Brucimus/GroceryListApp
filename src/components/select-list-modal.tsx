import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GroceryList, Product } from '@/types';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

interface SelectListModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
  lists: GroceryList[];
  onSelectList: (listId: string, quantity: number) => void;
  onCreateNewList: () => void;
}

export function SelectListModal({
  visible,
  onClose,
  product,
  lists,
  onSelectList,
  onCreateNewList,
}: SelectListModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const unitPrice = typeof product.price === 'number' ? product.price : 0;
  const totalPrice = (unitPrice * quantity).toFixed(2);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <ThemedView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <ThemedText style={styles.title}>Add to Shopping List</ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Product Mini Preview */}
          <View style={styles.productPreview}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.productImage} />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <ThemedText style={{ fontSize: 20 }}>🛒</ThemedText>
              </View>
            )}
            <View style={{ flex: 1, marginRight: 10 }}>
              <ThemedText style={styles.productName} numberOfLines={1}>
                {product.name}
              </ThemedText>
              <ThemedText style={styles.productPrice}>
                ${unitPrice.toFixed(2)} {product.aisle ? `• 📍 ${product.aisle}` : ''}
              </ThemedText>
            </View>

            {/* Quantity Stepper */}
            <View style={styles.quantityStepper}>
              <Pressable
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={styles.qtyBtn}
              >
                <ThemedText style={styles.qtyBtnText}>−</ThemedText>
              </Pressable>
              <ThemedText style={styles.qtyValue}>{quantity}</ThemedText>
              <Pressable
                onPress={() => setQuantity((q) => q + 1)}
                style={styles.qtyBtn}
              >
                <ThemedText style={styles.qtyBtnText}>+</ThemedText>
              </Pressable>
            </View>
          </View>

          <ThemedText style={styles.sectionHeading}>
            Select which list to add this item to:
          </ThemedText>

          {/* List Options */}
          <ScrollView style={styles.listScrollView} showsVerticalScrollIndicator={false}>
            {lists.length === 0 ? (
              <View style={styles.noListsContainer}>
                <ThemedText style={styles.noListsText}>
                  You don't have any shopping lists yet.
                </ThemedText>
              </View>
            ) : (
              lists.map((list) => {
                const existingItem = list.items.find(
                  (item) => item.product.id === product.id
                );

                return (
                  <Pressable
                    key={list.id}
                    onPress={() => {
                      onSelectList(list.id, quantity);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.listCard,
                      pressed && styles.listCardPressed,
                    ]}
                  >
                    <View style={styles.listIconContainer}>
                      <ThemedText style={{ fontSize: 18 }}>📝</ThemedText>
                    </View>

                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.listName}>{list.name}</ThemedText>
                      <ThemedText style={styles.listMeta}>
                        {list.items.length} {list.items.length === 1 ? 'item' : 'items'} • $
                        {list.totalPrice.toFixed(2)}
                      </ThemedText>
                      {existingItem && (
                        <ThemedText style={styles.alreadyInListText}>
                          ✓ Already in this list ({existingItem.quantity}x)
                        </ThemedText>
                      )}
                    </View>

                    <View style={styles.addToListBtn}>
                      <ThemedText style={styles.addToListBtnText}>
                        + Add ({quantity}x)
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* Create New List Button */}
            <Pressable
              onPress={() => {
                onClose();
                onCreateNewList();
              }}
              style={({ pressed }) => [
                styles.createListBtn,
                pressed && styles.listCardPressed,
              ]}
            >
              <ThemedText style={styles.createListIcon}>➕</ThemedText>
              <ThemedText style={styles.createListText}>
                Create New List & Add Item
              </ThemedText>
            </Pressable>
          </ScrollView>
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
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#888',
    fontWeight: 'bold',
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f8fa',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  productImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#e8edf2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 12,
    color: '#666',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#f0f2f5',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  qtyValue: {
    marginHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
  },
  listScrollView: {
    maxHeight: 320,
  },
  noListsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noListsText: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e6eb',
    marginBottom: 8,
  },
  listCardPressed: {
    opacity: 0.75,
    backgroundColor: '#f5f9ff',
  },
  listIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eef5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  listMeta: {
    fontSize: 11,
    color: '#777',
  },
  alreadyInListText: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 2,
  },
  addToListBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addToListBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  createListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
    backgroundColor: '#f5f9ff',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
    gap: 8,
  },
  createListIcon: {
    fontSize: 14,
  },
  createListText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

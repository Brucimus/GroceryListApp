import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ListItem } from '@/types';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

interface ListItemCardProps {
  item: ListItem;
  onCheckToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  onDelete: () => void;
  onOpenAddAlternative?: () => void;
  onRemoveAlternative?: (altId: string) => void;
  onSwapWithAlternative?: (altId: string) => void;
}

export function ListItemCard({
  item,
  onCheckToggle,
  onQuantityChange,
  onDelete,
  onOpenAddAlternative,
  onRemoveAlternative,
  onSwapWithAlternative,
}: ListItemCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(true);

  const unitPrice = typeof item.product.price === 'number' ? item.product.price : 0;
  const totalPrice = (unitPrice * item.quantity).toFixed(2);
  const alternatives = item.alternatives || [];
  const hasAlternatives = alternatives.length > 0;
  const isOutOfStock =
    item.product.inStock === false || item.product.stockLevel === 'Out of Stock';

  return (
    <ThemedView
      style={[
        styles.cardContainer,
        item.checked && styles.cardChecked,
        isOutOfStock && !item.checked && styles.cardOutOfStock,
      ]}
    >
      {/* Main Item Row */}
      <View style={styles.mainRow}>
        {/* Checkbox */}
        <Pressable onPress={onCheckToggle} style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkboxBox,
              item.checked && styles.checkboxBoxChecked,
            ]}
          >
            {item.checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
          </View>
        </Pressable>

        {/* Thumbnail */}
        {item.product.image ? (
          <Image source={{ uri: item.product.image }} style={styles.productThumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <ThemedText style={{ fontSize: 16 }}>🛒</ThemedText>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.content}>
          <ThemedText
            style={[
              styles.productName,
              item.checked && styles.textChecked,
            ]}
            numberOfLines={2}
          >
            {item.product.name}
          </ThemedText>

          {/* Pricing breakdown */}
          <View style={styles.priceRow}>
            <ThemedText style={styles.totalPrice}>${totalPrice}</ThemedText>
            {item.quantity > 1 && (
              <ThemedText style={styles.unitPrice}>
                (${unitPrice.toFixed(2)} each)
              </ThemedText>
            )}
          </View>

          {/* Meta badges: Stock and Aisle */}
          <View style={styles.metaRow}>
            {item.product.stockLevel || item.product.inStock !== undefined ? (
              <View
                style={[
                  styles.stockBadge,
                  isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeIn,
                ]}
              >
                <ThemedText
                  style={[
                    styles.stockBadgeText,
                    isOutOfStock ? styles.stockBadgeTextOut : styles.stockBadgeTextIn,
                  ]}
                >
                  {item.product.stockLevel || (item.product.inStock ? 'In Stock' : 'Out of Stock')}
                </ThemedText>
              </View>
            ) : null}

            {item.product.aisle && (
              <ThemedText style={styles.aisleText}>
                📍 {item.product.aisle}
              </ThemedText>
            )}
          </View>

          {item.notes ? (
            <ThemedText style={styles.notesText} numberOfLines={1}>
              📝 {item.notes}
            </ThemedText>
          ) : null}
        </View>

        {/* Right Actions: Quantity controls + Remove */}
        <View style={styles.rightActions}>
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <ThemedText style={styles.deleteIcon}>🗑</ThemedText>
          </Pressable>

          <View style={styles.quantityControl}>
            <Pressable
              onPress={() => onQuantityChange(Math.max(1, item.quantity - 1))}
              style={styles.quantityBtn}
            >
              <ThemedText style={styles.quantityBtnText}>−</ThemedText>
            </Pressable>
            <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
            <Pressable
              onPress={() => onQuantityChange(item.quantity + 1)}
              style={styles.quantityBtn}
            >
              <ThemedText style={styles.quantityBtnText}>+</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Alternatives Section */}
      <View style={styles.alternativesSection}>
        {hasAlternatives && (
          <View style={styles.alternativesHeader}>
            <Pressable
              onPress={() => setShowAlternatives(!showAlternatives)}
              style={styles.alternativesToggle}
            >
              <ThemedText style={styles.alternativesTitle}>
                {alternatives.length} Backup Option{alternatives.length > 1 ? 's' : ''}{' '}
                {showAlternatives ? '▾' : '▸'}
              </ThemedText>
            </Pressable>
            {onOpenAddAlternative && (
              <Pressable onPress={onOpenAddAlternative} style={styles.addAltSmallBtn}>
                <ThemedText style={styles.addAltSmallBtnText}>+ Add More</ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {/* Render alternatives list if expanded */}
        {hasAlternatives && showAlternatives && (
          <View style={styles.alternativesList}>
            {alternatives.map((alt) => {
              const altPriceDiff = alt.price - item.product.price;
              const diffText =
                altPriceDiff === 0
                  ? 'Same price'
                  : altPriceDiff > 0
                  ? `+$${altPriceDiff.toFixed(2)}`
                  : `-$${Math.abs(altPriceDiff).toFixed(2)}`;

              const altOutOfStock =
                alt.inStock === false || alt.stockLevel === 'Out of Stock';

              return (
                <View key={alt.id} style={styles.altItemRow}>
                  <ThemedText style={styles.altBranchIcon}>↳</ThemedText>

                  <View style={{ flex: 1, marginRight: 8 }}>
                    <ThemedText style={styles.altItemName} numberOfLines={1}>
                      {alt.name}
                    </ThemedText>

                    <View style={styles.altItemMeta}>
                      <ThemedText style={styles.altItemPrice}>
                        ${alt.price.toFixed(2)}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.altItemDiff,
                          {
                            color:
                              altPriceDiff > 0
                                ? '#d97706'
                                : altPriceDiff < 0
                                ? '#28a745'
                                : '#666',
                          },
                        ]}
                      >
                        ({diffText})
                      </ThemedText>
                      {alt.aisle && (
                        <ThemedText style={styles.altItemAisle}>
                          📍 {alt.aisle}
                        </ThemedText>
                      )}
                      <ThemedText
                        style={[
                          styles.altStockText,
                          { color: altOutOfStock ? '#dc3545' : '#28a745' },
                        ]}
                      >
                        {altOutOfStock ? '● Out' : '● In Stock'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Actions on alternative: Swap to primary & Remove */}
                  <View style={styles.altActions}>
                    {onSwapWithAlternative && (
                      <Pressable
                        onPress={() => onSwapWithAlternative(alt.id)}
                        style={styles.swapBtn}
                      >
                        <ThemedText style={styles.swapBtnText}>Swap</ThemedText>
                      </Pressable>
                    )}
                    {onRemoveAlternative && (
                      <Pressable
                        onPress={() => onRemoveAlternative(alt.id)}
                        style={styles.removeAltBtn}
                      >
                        <ThemedText style={styles.removeAltBtnText}>✕</ThemedText>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* If no alternatives attached yet, provide clean prompt */}
        {!hasAlternatives && onOpenAddAlternative && (
          <Pressable onPress={onOpenAddAlternative} style={styles.addAltActionRow}>
            <ThemedText style={styles.addAltActionIcon}>➕</ThemedText>
            <ThemedText style={styles.addAltActionText}>
              Add alternative option (backup if out of stock)
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    backgroundColor: '#fff',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardChecked: {
    opacity: 0.65,
    backgroundColor: '#f9f9f9',
  },
  cardOutOfStock: {
    borderColor: '#ffccbc',
    backgroundColor: '#fffcfb',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkboxContainer: {
    marginRight: 10,
    padding: 2,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  thumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 2,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  unitPrice: {
    fontSize: 11,
    color: '#666',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
    fontWeight: '600',
  },
  notesText: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
    fontStyle: 'italic',
  },
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  quantityBtn: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  quantityBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  alternativesSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafbfc',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  alternativesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alternativesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alternativesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
  },
  addAltSmallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#e1eeff',
  },
  addAltSmallBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  alternativesList: {
    gap: 6,
  },
  altItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8edf2',
  },
  altBranchIcon: {
    fontSize: 14,
    color: '#999',
    marginRight: 6,
    fontWeight: 'bold',
  },
  altItemName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  altItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  altItemPrice: {
    fontSize: 11,
    fontWeight: '700',
  },
  altItemDiff: {
    fontSize: 10,
    fontWeight: '600',
  },
  altItemAisle: {
    fontSize: 10,
    color: '#0066cc',
  },
  altStockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  altActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swapBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#cce2ff',
  },
  swapBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007AFF',
  },
  removeAltBtn: {
    padding: 4,
  },
  removeAltBtnText: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
  },
  addAltActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  addAltActionIcon: {
    fontSize: 11,
  },
  addAltActionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});

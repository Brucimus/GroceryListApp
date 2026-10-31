import { Product } from '@/types';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  showPrice?: boolean;
  currentQuantityInList?: number;
  onQuickAdd?: (product: Product) => void;
  onQuantityChange?: (product: Product, newQty: number) => void;
}

export function ProductCard({
  product,
  onPress,
  showPrice = true,
  currentQuantityInList = 0,
  onQuickAdd,
  onQuantityChange,
}: ProductCardProps) {
  const price = typeof product.price === 'number' ? product.price : 0;
  const isOutOfStock = product.inStock === false || product.stockLevel === 'Out of Stock';
  const isLowStock = product.stockLevel === 'Low Stock';
  const isInList = currentQuantityInList > 0;

  return (
    <Pressable onPress={() => onPress(product)} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView style={[styles.card, isOutOfStock && styles.cardOutOfStock]}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={[styles.image, isOutOfStock && styles.imageOutOfStock]}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <ThemedText style={{ fontSize: 28 }}>🛒</ThemedText>
          </View>
        )}
        <View style={styles.content}>
          <ThemedText style={[styles.name, isOutOfStock && styles.nameOutOfStock]} numberOfLines={2}>
            {product.name}
          </ThemedText>

          {/* Subtitle / Brand / Aisle */}
          <View style={styles.metaRow}>
            {product.description ? (
              <ThemedText style={styles.description} numberOfLines={1}>
                {product.description}
              </ThemedText>
            ) : null}
            {product.aisle ? (
              <ThemedText style={styles.aisleText} numberOfLines={1}>
                📍 {product.aisle}
              </ThemedText>
            ) : null}
          </View>

          {/* Footer with Store, Stock Badge and Price + Quick Add */}
          <View style={styles.footer}>
            <View style={styles.storeAndStock}>
              <ThemedText style={styles.store}>{product.store || 'kroger'}</ThemedText>

              {/* Stock Status Badge */}
              {product.stockLevel !== undefined || product.inStock !== undefined ? (
                <View
                  style={[
                    styles.stockBadge,
                    isOutOfStock
                      ? styles.outOfStockBadge
                      : isLowStock
                      ? styles.lowStockBadge
                      : styles.inStockBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.stockDot,
                      {
                        backgroundColor: isOutOfStock
                          ? '#dc3545'
                          : isLowStock
                          ? '#ff9800'
                          : '#28a745',
                      },
                    ]}
                  />
                  <ThemedText
                    style={[
                      styles.stockBadgeText,
                      isOutOfStock
                        ? styles.outOfStockText
                        : isLowStock
                        ? styles.lowStockText
                        : styles.inStockText,
                    ]}
                  >
                    {product.stockLevel || (product.inStock ? 'In Stock' : 'Out of Stock')}
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.priceAndActionRow}>
              {showPrice && (
                <ThemedText style={[styles.price, isOutOfStock && styles.priceOutOfStock]}>
                  {price > 0 ? `$${price.toFixed(2)}` : 'In-store'}
                </ThemedText>
              )}

              {/* Quick Add Button or Stepper */}
              {onQuickAdd && (
                <View style={styles.actionContainer}>
                  {isInList ? (
                    <View style={styles.stepperContainer}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          if (onQuantityChange) {
                            onQuantityChange(product, currentQuantityInList - 1);
                          }
                        }}
                        style={styles.stepperBtn}
                      >
                        <ThemedText style={styles.stepperBtnText}>−</ThemedText>
                      </Pressable>
                      <ThemedText style={styles.stepperQty}>{currentQuantityInList}</ThemedText>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          if (onQuantityChange) {
                            onQuantityChange(product, currentQuantityInList + 1);
                          }
                        }}
                        style={styles.stepperBtn}
                      >
                        <ThemedText style={styles.stepperBtnText}>+</ThemedText>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        onQuickAdd(product);
                      }}
                      style={styles.quickAddBtn}
                    >
                      <ThemedText style={styles.quickAddBtnText}>+ Add</ThemedText>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e6eb',
    backgroundColor: '#fff',
  },
  cardOutOfStock: {
    borderColor: '#f0d0d0',
    backgroundColor: '#fffcfc',
  },
  pressed: {
    opacity: 0.75,
  },
  image: {
    width: 84,
    height: 84,
    backgroundColor: '#f8f8f8',
  },
  imageOutOfStock: {
    opacity: 0.7,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 2,
  },
  nameOutOfStock: {
    color: '#555',
  },
  metaRow: {
    marginBottom: 4,
    gap: 2,
  },
  description: {
    fontSize: 11,
    opacity: 0.7,
  },
  aisleText: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  storeAndStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  store: {
    fontSize: 11,
    opacity: 0.6,
    textTransform: 'capitalize',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  inStockBadge: {
    backgroundColor: '#e6f4ea',
  },
  lowStockBadge: {
    backgroundColor: '#fff3e0',
  },
  outOfStockBadge: {
    backgroundColor: '#fde8e8',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inStockText: {
    color: '#1e7e34',
  },
  lowStockText: {
    color: '#d97706',
  },
  outOfStockText: {
    color: '#c53030',
  },
  priceAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  priceOutOfStock: {
    color: '#888',
  },
  actionContainer: {
    marginLeft: 2,
  },
  quickAddBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickAddBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef5ff',
    borderRadius: 16,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#cce2ff',
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepperQty: {
    marginHorizontal: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    minWidth: 14,
    textAlign: 'center',
  },
});

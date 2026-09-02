import { Product } from '@/types';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  showPrice?: boolean;
}

export function ProductCard({ product, onPress, showPrice = true }: ProductCardProps) {
  const price = typeof product.price === 'number' ? product.price : 0;

  return (
    <Pressable onPress={() => onPress(product)} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView style={styles.card}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <ThemedText style={{ fontSize: 28 }}>🛒</ThemedText>
          </View>
        )}
        <View style={styles.content}>
          <ThemedText style={styles.name} numberOfLines={2}>
            {product.name}
          </ThemedText>
          {product.description ? (
            <ThemedText style={styles.description} numberOfLines={1}>
              {product.description}
            </ThemedText>
          ) : null}
          <View style={styles.footer}>
            <ThemedText style={styles.store}>{product.store || 'kroger'}</ThemedText>
            {showPrice && (
              <ThemedText style={styles.price}>
                {price > 0 ? `$${price.toFixed(2)}` : 'In-store'}
              </ThemedText>
            )}
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pressed: {
    opacity: 0.7,
  },
  image: {
    width: 80,
    height: 80,
    backgroundColor: '#f8f8f8',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  store: {
    fontSize: 11,
    opacity: 0.6,
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
});

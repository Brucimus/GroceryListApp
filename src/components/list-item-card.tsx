import { ListItem } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface ListItemCardProps {
  item: ListItem;
  onCheckToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  onDelete: () => void;
}

export function ListItemCard({ item, onCheckToggle, onQuantityChange, onDelete }: ListItemCardProps) {
  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={onCheckToggle} style={styles.checkbox}>
        <View
          style={[
            styles.checkboxBox,
            {
              backgroundColor: item.checked ? '#4CAF50' : 'transparent',
              borderColor: item.checked ? '#4CAF50' : '#999',
            },
          ]}
        >
          {item.checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
        </View>
      </Pressable>

      <View style={styles.content}>
        <ThemedText
          style={[
            styles.productName,
            {
              textDecorationLine: item.checked ? 'line-through' : 'none',
              opacity: item.checked ? 0.6 : 1,
            },
          ]}
        >
          {item.product.name}
        </ThemedText>
        <ThemedText style={styles.price}>${(item.product.price * item.quantity).toFixed(2)}</ThemedText>
      </View>

      <View style={styles.quantityControl}>
        <Pressable
          onPress={() => onQuantityChange(Math.max(1, item.quantity - 1))}
          style={styles.quantityBtn}
        >
          <ThemedText>−</ThemedText>
        </Pressable>
        <ThemedText style={styles.quantity}>{item.quantity}</ThemedText>
        <Pressable onPress={() => onQuantityChange(item.quantity + 1)} style={styles.quantityBtn}>
          <ThemedText>+</ThemedText>
        </Pressable>
      </View>

      <Pressable onPress={onDelete} style={styles.deleteBtn}>
        <ThemedText style={styles.deleteIcon}>🗑</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  price: {
    fontSize: 12,
    opacity: 0.7,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  quantity: {
    marginHorizontal: 8,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 18,
  },
});

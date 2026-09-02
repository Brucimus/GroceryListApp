import { ListItemCard } from '@/components/list-item-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StorageService } from '@/services/storageService';
import { GroceryList } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadList(id);
    }
  }, [id]);

  const loadList = async (listId: string) => {
    setLoading(true);
    const loadedList = await StorageService.getList(listId);
    setList(loadedList);
    setLoading(false);
  };

  const handleCheckToggle = async (itemId: string) => {
    if (!list) return;
    await StorageService.toggleItemChecked(list.id, itemId);
    loadList(list.id);
  };

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (!list) return;
    await StorageService.updateListItem(list.id, itemId, { quantity });
    loadList(list.id);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!list) return;
    await StorageService.removeItemFromList(list.id, itemId);
    loadList(list.id);
  };

  const handleClearList = () => {
    Alert.alert('Clear List', 'Are you sure you want to remove all items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
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
        <ThemedView style={styles.container}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!list) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <ThemedText>List not found</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const checkedCount = list.items.filter((item) => item.checked).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            {list.name}
          </ThemedText>
        </View>

        <View style={styles.statsRow}>
          <ThemedText style={styles.stat}>
            {checkedCount}/{list.items.length} items
          </ThemedText>
          <ThemedText style={styles.stat}>Total: ${list.totalPrice.toFixed(2)}</ThemedText>
        </View>

        {list.items.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.empty}>No items yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Tap "Browse Products" to add items</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={list.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ListItemCard
                item={item}
                onCheckToggle={() => handleCheckToggle(item.id)}
                onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            )}
          />
        )}

        <View style={styles.actionBar}>
          <Pressable onPress={handleClearList} style={styles.clearButton}>
            <ThemedText style={styles.clearButtonText}>Clear All</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              router.push('/explore');
            }}
            style={styles.addButton}
          >
            <ThemedText style={styles.addButtonText}>+ Add Items</ThemedText>
          </Pressable>
        </View>
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
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  stat: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

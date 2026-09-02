import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StorageService } from '@/services/storageService';
import { GroceryList } from '@/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    const allLists = await StorageService.getAllLists();
    setLists(allLists);
    setLoading(false);
  };

  const createNewList = async () => {
    Alert.prompt('Create New List', 'Enter list name:', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Create',
        onPress: async (name: string | undefined) => {
          if (name?.trim()) {
            const newList = await StorageService.createList(name);
            await StorageService.setSelectedListId(newList.id);
            router.push(`/list/${newList.id}`);
          }
        },
      },
    ]);
  };

  const deleteList = async (id: string, name: string) => {
    Alert.alert('Delete List', `Are you sure you want to delete "${name}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await StorageService.deleteList(id);
          loadLists();
        },
      },
    ]);
  };

  const navigateToList = async (list: GroceryList) => {
    await StorageService.setSelectedListId(list.id);
    router.push(`/list/${list.id}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.header}>
          My Shopping Lists
        </ThemedText>

        {loading ? (
          <ThemedText style={styles.empty}>Loading...</ThemedText>
        ) : lists.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.empty}>No shopping lists yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Create your first list to get started!</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigateToList(item)}
                style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}
              >
                <ThemedView style={styles.listCardContent}>
                  <ThemedText style={styles.listName}>{item.name}</ThemedText>
                  <ThemedText style={styles.listMeta}>
                    {item.items.length} items · ${item.totalPrice.toFixed(2)}
                  </ThemedText>
                  <ThemedText style={styles.listDate}>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
                <Pressable
                  onPress={() => deleteList(item.id, item.name)}
                  style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                >
                  <ThemedText style={styles.deleteBtnText}>Delete</ThemedText>
                </Pressable>
              </Pressable>
            )}
            scrollEnabled={true}
          />
        )}

        <Pressable
          onPress={createNewList}
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
        >
          <ThemedText style={styles.createButtonText}>+ New List</ThemedText>
        </Pressable>
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
    marginBottom: 20,
    fontSize: 28,
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
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pressed: {
    opacity: 0.7,
  },
  listCardContent: {
    flex: 1,
    padding: 16,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  listMeta: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  listDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  deleteBtnText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  createButtonPressed: {
    opacity: 0.7,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { CreateListModal } from '@/components/create-list-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StorageService } from '@/services/storageService';
import { GroceryList } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Reload lists on screen focus
  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [])
  );

  const loadLists = async () => {
    setLoading(true);
    const allLists = await StorageService.getAllLists();
    setLists(allLists);
    setLoading(false);
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
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="title" style={styles.header}>
              My Shopping Lists
            </ThemedText>
            <ThemedText style={styles.subHeader}>
              Tap any list to view items, aisle locations, and backup options
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setCreateModalVisible(true)}
            style={styles.headerCreateBtn}
          >
            <ThemedText style={styles.headerCreateBtnText}>+ New List</ThemedText>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <ThemedText style={styles.loadingText}>Loading your lists...</ThemedText>
          </View>
        ) : lists.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>📝</ThemedText>
            <ThemedText style={styles.emptyTitle}>No shopping lists yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Create your first grocery list to organize items, track quantities, and attach backup substitutes!
            </ThemedText>
            <Pressable
              onPress={() => setCreateModalVisible(true)}
              style={styles.emptyCreateBtn}
            >
              <ThemedText style={styles.emptyCreateBtnText}>+ Create First List</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const checkedCount = item.items.filter((i) => i.checked).length;
              const outOfStockCount = item.items.filter(
                (i) => i.product.inStock === false || i.product.stockLevel === 'Out of Stock'
              ).length;
              const hasAlternativesCount = item.items.filter(
                (i) => i.alternatives && i.alternatives.length > 0
              ).length;

              // Preview top 3 items
              const previewItems = item.items.slice(0, 3);
              const remainingCount = item.items.length - previewItems.length;

              return (
                <Pressable
                  onPress={() => navigateToList(item)}
                  style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}
                >
                  <ThemedView style={styles.listCardContent}>
                    {/* Title & Price Header */}
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <ThemedText style={styles.listName}>{item.name}</ThemedText>
                        <ThemedText style={styles.listMeta}>
                          {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                          {item.items.length > 0 ? ` • ${checkedCount}/${item.items.length} checked` : ''}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.listPrice}>
                        ${item.totalPrice.toFixed(2)}
                      </ThemedText>
                    </View>

                    {/* Status Badges */}
                    {(outOfStockCount > 0 || hasAlternativesCount > 0) && (
                      <View style={styles.cardMetaRow}>
                        {outOfStockCount > 0 && (
                          <View style={styles.outOfStockBadge}>
                            <ThemedText style={styles.outOfStockBadgeText}>
                              ⚠️ {outOfStockCount} out of stock
                            </ThemedText>
                          </View>
                        )}
                        {hasAlternativesCount > 0 && (
                          <View style={styles.altBadge}>
                            <ThemedText style={styles.altBadgeText}>
                              🔄 {hasAlternativesCount} with backups
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Item Previews (What's in this list) */}
                    {item.items.length > 0 ? (
                      <View style={styles.itemPreviewContainer}>
                        <ThemedText style={styles.itemPreviewLabel}>Items in list:</ThemedText>
                        <View style={styles.previewChipsRow}>
                          {previewItems.map((listItem) => (
                            <View key={listItem.id} style={styles.previewChip}>
                              <ThemedText style={styles.previewChipText} numberOfLines={1}>
                                {listItem.quantity}x {listItem.product.name}
                              </ThemedText>
                            </View>
                          ))}
                          {remainingCount > 0 && (
                            <View style={styles.previewMoreChip}>
                              <ThemedText style={styles.previewMoreText}>
                                +{remainingCount} more
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                    ) : (
                      <ThemedText style={styles.emptyListHint}>
                        List is empty • Tap to add items from store catalog
                      </ThemedText>
                    )}

                    {/* Card Footer */}
                    <View style={styles.cardFooter}>
                      <ThemedText style={styles.listDate}>
                        Updated {new Date(item.updatedAt).toLocaleDateString()}
                      </ThemedText>
                      <ThemedText style={styles.openListAction}>
                        Open List & View Items ›
                      </ThemedText>
                    </View>
                  </ThemedView>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      deleteList(item.id, item.name);
                    }}
                    style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                  >
                    <ThemedText style={styles.deleteBtnText}>🗑</ThemedText>
                  </Pressable>
                </Pressable>
              );
            }}
          />
        )}

        {lists.length > 0 && (
          <Pressable
            onPress={() => setCreateModalVisible(true)}
            style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          >
            <ThemedText style={styles.createButtonText}>+ Create New List</ThemedText>
          </Pressable>
        )}

        {/* Cross-platform List Creation Modal */}
        <CreateListModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onListCreated={(newList) => {
            loadLists();
            router.push(`/list/${newList.id}`);
          }}
        />
      </ThemedView>
      <BottomTabBar activeTab="home" />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
  },
  subHeader: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  headerCreateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignSelf: 'center',
  },
  headerCreateBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCreateBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyCreateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e6eb',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
  listCardContent: {
    flex: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  listName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  listPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#007AFF',
  },
  listMeta: {
    fontSize: 12,
    color: '#666',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  outOfStockBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outOfStockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#856404',
  },
  altBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  altBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e7e34',
  },
  itemPreviewContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  itemPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 4,
  },
  previewChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxWidth: '85%',
  },
  previewChipText: {
    fontSize: 11,
    color: '#2d3748',
    fontWeight: '500',
  },
  previewMoreChip: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewMoreText: {
    fontSize: 11,
    color: '#4a5568',
    fontWeight: '600',
  },
  emptyListHint: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  listDate: {
    fontSize: 11,
    opacity: 0.5,
  },
  openListAction: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 18,
    opacity: 0.5,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  createButtonPressed: {
    opacity: 0.7,
  },
  createButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ApiClient } from '@/services/apiClient';
import { StoreLocation } from '@/types';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StoreSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  selectedStore: StoreLocation | null;
  onSelectStore: (store: StoreLocation | null) => void;
}

const POPULAR_ZIPS = [
  { label: 'Cincinnati, OH', zip: '45202' },
  { label: 'Dallas, TX', zip: '75001' },
  { label: 'Atlanta, GA', zip: '30301' },
  { label: 'Nashville, TN', zip: '37201' },
  { label: 'Houston, TX', zip: '77001' },
  { label: 'Seattle, WA', zip: '98101' },
];

export function StoreSelectorModal({
  visible,
  onClose,
  selectedStore,
  onSelectStore,
}: StoreSelectorModalProps) {
  const [zipInput, setZipInput] = useState('');
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (selectedStore?.address?.zipCode) {
        setZipInput(selectedStore.address.zipCode);
        handleSearch(selectedStore.address.zipCode);
      } else {
        // Default initial search for Kroger HQ area or current input
        handleSearch('45202');
      }
    }
  }, [visible]);

  const handleSearch = async (zipToSearch?: string) => {
    const zip = (zipToSearch || zipInput).trim();
    if (!zip) {
      setErrorMsg('Please enter a 5-digit US ZIP code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const results = await ApiClient.searchLocations({ zipCode: zip, limit: 10 });
      setLocations(results);
      if (results.length === 0) {
        setErrorMsg(`No Kroger stores found near ZIP ${zip}. Try another ZIP.`);
      }
    } catch (err: any) {
      console.error('Failed to search locations:', err);
      setErrorMsg('Failed to search stores. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleStorePress = (store: StoreLocation) => {
    onSelectStore(store);
    onClose();
  };

  const handleClearStore = () => {
    onSelectStore(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>Select Your Store</ThemedText>
              <ThemedText style={styles.subtitle}>
                Get live in-store pricing, stock levels & aisle info
              </ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.zipInput}
              value={zipInput}
              onChangeText={(text) => {
                setZipInput(text);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Enter 5-digit ZIP (e.g. 45202)"
              keyboardType="number-pad"
              maxLength={5}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
            />
            <Pressable
              onPress={() => handleSearch()}
              style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
            >
              <ThemedText style={styles.searchBtnText}>Find Stores</ThemedText>
            </Pressable>
          </View>

          {/* Quick ZIP Presets */}
          <View style={styles.presetsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {POPULAR_ZIPS.map((item) => (
                <Pressable
                  key={item.zip}
                  onPress={() => {
                    setZipInput(item.zip);
                    handleSearch(item.zip);
                  }}
                  style={styles.presetChip}
                >
                  <ThemedText style={styles.presetChipText}>
                    📍 {item.label} ({item.zip})
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Current Selection Bar */}
          {selectedStore && (
            <View style={styles.currentStoreBar}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.currentStoreLabel}>Currently Selected Store:</ThemedText>
                <ThemedText style={styles.currentStoreName}>{selectedStore.name}</ThemedText>
                <ThemedText style={styles.currentStoreAddress}>
                  {selectedStore.address.addressLine1}, {selectedStore.address.city},{' '}
                  {selectedStore.address.state} {selectedStore.address.zipCode}
                </ThemedText>
              </View>
              <Pressable onPress={handleClearStore} style={styles.clearBtn}>
                <ThemedText style={styles.clearBtnText}>Remove</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Error / Warning */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
            </View>
          )}

          {/* Locations List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <ThemedText style={styles.loadingText}>Searching nearby Kroger stores...</ThemedText>
            </View>
          ) : (
            <FlatList
              data={locations}
              keyExtractor={(item) => item.locationId}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isCurrent = selectedStore?.locationId === item.locationId;
                return (
                  <Pressable
                    onPress={() => handleStorePress(item)}
                    style={({ pressed }) => [
                      styles.storeCard,
                      isCurrent && styles.storeCardSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.storeHeader}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.storeName}>{item.name}</ThemedText>
                        <ThemedText style={styles.storeAddress}>
                          {item.address.addressLine1}, {item.address.city}, {item.address.state}{' '}
                          {item.address.zipCode}
                        </ThemedText>
                      </View>
                      {isCurrent ? (
                        <View style={styles.activeBadge}>
                          <ThemedText style={styles.activeBadgeText}>✓ Selected</ThemedText>
                        </View>
                      ) : (
                        <View style={styles.selectBadge}>
                          <ThemedText style={styles.selectBadgeText}>Select</ThemedText>
                        </View>
                      )}
                    </View>

                    <View style={styles.storeDetails}>
                      {item.phone ? (
                        <ThemedText style={styles.detailItem}>📞 {item.phone}</ThemedText>
                      ) : null}
                      {item.hours?.today ? (
                        <ThemedText style={styles.detailItem}>🕒 {item.hours.today}</ThemedText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                !loading && !errorMsg ? (
                  <View style={styles.centerContainer}>
                    <ThemedText style={styles.emptyText}>
                      Enter a ZIP code above to find Kroger stores near you.
                    </ThemedText>
                  </View>
                ) : null
              }
            />
          )}
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  zipInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  searchBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  presetsContainer: {
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  presetChipText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  currentStoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bce0fd',
    marginBottom: 12,
  },
  currentStoreLabel: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  currentStoreName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  currentStoreAddress: {
    fontSize: 12,
    opacity: 0.7,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff3cd',
    marginBottom: 12,
  },
  errorText: {
    color: '#856404',
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 20,
  },
  storeCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  storeCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f5f9ff',
    borderWidth: 2,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  storeAddress: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  selectBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  storeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  detailItem: {
    fontSize: 12,
    opacity: 0.65,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StorageService } from '@/services/storageService';
import { GroceryList, StoreLocation } from '@/types';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

interface CreateListModalProps {
  visible: boolean;
  onClose: () => void;
  onListCreated: (list: GroceryList) => void;
}

export function CreateListModal({ visible, onClose, onListCreated }: CreateListModalProps) {
  const [name, setName] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreLocation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setError('');
      StorageService.getSelectedStore().then((store) => {
        setSelectedStore(store);
      });
    }
  }, [visible]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a list name');
      return;
    }

    try {
      const storeName = selectedStore?.chain || selectedStore?.name || 'kroger';
      const newList = await StorageService.createList(trimmed, storeName);
      await StorageService.setSelectedListId(newList.id);
      onListCreated(newList);
      onClose();
    } catch (err) {
      console.error('Failed to create list:', err);
      setError('Failed to create list. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <ThemedView style={styles.modalContent}>
          <View style={styles.headerRow}>
            <ThemedText style={styles.title}>Create Shopping List</ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <ThemedText style={styles.closeBtnText}>✕</ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.subtitle}>
            Organize your items with live store pricing & aisle info
          </ThemedText>

          {selectedStore && (
            <View style={styles.storeTag}>
              <ThemedText style={styles.storeTagIcon}>📍</ThemedText>
              <ThemedText style={styles.storeTagText} numberOfLines={1}>
                {selectedStore.name} ({selectedStore.address.city})
              </ThemedText>
            </View>
          )}

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>List Name</ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Weekly Groceries, BBQ Party, Dinner"
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (error) setError('');
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
          </View>

          {/* Quick Name Suggestions */}
          <View style={styles.suggestionsContainer}>
            {['Weekly Groceries', 'Dinner Night', 'Produce & Dairy', 'Party Snacks'].map(
              (suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => {
                    setName(suggestion);
                    if (error) setError('');
                  }}
                  style={styles.suggestionChip}
                >
                  <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                </Pressable>
              )
            )}
          </View>

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
            </Pressable>
            <Pressable onPress={handleCreate} style={styles.createBtn}>
              <ThemedText style={styles.createBtnText}>Create List</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 16,
  },
  storeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef5ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cce2ff',
    gap: 6,
  },
  storeTagIcon: {
    fontSize: 13,
  },
  storeTagText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  suggestionChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  suggestionText: {
    fontSize: 12,
    color: '#555',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  createBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

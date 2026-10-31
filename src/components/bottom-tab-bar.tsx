import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

interface BottomTabBarProps {
  activeTab: 'home' | 'explore';
}

export function BottomTabBar({ activeTab }: BottomTabBarProps) {
  const isHome = activeTab === 'home';
  const isExplore = activeTab === 'explore';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.navBar}>
        {/* Home / My Lists Tab */}
        <Pressable
          onPress={() => {
            if (!isHome) {
              router.replace('/');
            }
          }}
          style={({ pressed }) => [
            styles.tabButton,
            isHome && styles.tabButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText style={[styles.tabIcon, isHome && styles.tabIconActive]}>
            📝
          </ThemedText>
          <ThemedText style={[styles.tabLabel, isHome && styles.tabLabelActive]}>
            My Lists
          </ThemedText>
        </Pressable>

        {/* Explore / Store Catalog Tab */}
        <Pressable
          onPress={() => {
            if (!isExplore) {
              router.replace('/explore');
            }
          }}
          style={({ pressed }) => [
            styles.tabButton,
            isExplore && styles.tabButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText style={[styles.tabIcon, isExplore && styles.tabIconActive]}>
            🛒
          </ThemedText>
          <ThemedText style={[styles.tabLabel, isExplore && styles.tabLabelActive]}>
            Store Catalog
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#e8edf2',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#eef5ff',
  },
  pressed: {
    opacity: 0.7,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
});

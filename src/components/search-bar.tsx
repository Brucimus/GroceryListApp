import { useTheme } from '@/hooks/use-theme';
import { StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search products...' }: SearchBarProps) {
  const theme = useTheme();
  const textColor = theme.text;
  const backgroundColor = theme.background;
  const borderColor = theme.backgroundElement;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TextInput
        style={[styles.input, { color: textColor, borderColor }]}
        placeholder={placeholder}
        placeholderTextColor={textColor}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});

import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, borderRadius } from '../constants/theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search products or stores…' }) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLabel}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Ionicons
        name="search-outline"
        size={18}
        color={colors.textLabel}
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.iconBg,
    color: colors.text,
    fontSize: typography.sizes.md,
    paddingVertical: 22,
    paddingLeft: 56,
    paddingRight: 24,
    borderRadius: borderRadius.sm,
  },
  icon: {
    position: 'absolute',
    left: 20,
  },
});

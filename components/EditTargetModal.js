import { useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Button from './ui/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function EditTargetModal({ visible, currentTarget, currentPrice, currency, onSave, onClose }) {
  const [value, setValue] = useState(String(currentTarget || ''));
  const [error, setError] = useState('');

  const handleSave = () => {
    const num = parseFloat(value);
    if (!num || num <= 0) {
      setError('Please enter a valid price');
      return;
    }
    if (num >= currentPrice) {
      setError('Target price must be lower than the current price');
      return;
    }
    onSave(num);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.label}>SET PRICE ALERT</Text>
          <Text style={styles.title}>Edit Target Price</Text>
          <Text style={styles.desc}>We'll notify you the instant the price drops below this value.</Text>

          <View style={styles.priceRow}>
            <Text style={styles.currencySymbol}>{currency}</Text>
            <TextInput
              style={styles.priceInput}
              value={value}
              onChangeText={(t) => { setValue(t); setError(''); }}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Save Alert" onPress={handleSave} />
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  desc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  currencySymbol: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xl,
    marginRight: spacing.xs,
  },
  priceInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    paddingVertical: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

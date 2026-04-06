import { useState } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import Input from './ui/Input';
import Button from './ui/Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function EditTargetModal({ visible, currentTarget, onSave, onClose }) {
  const [value, setValue] = useState(String(currentTarget || ''));
  const [error, setError] = useState('');

  const handleSave = () => {
    const num = parseFloat(value);
    if (!num || num <= 0) {
      setError('Please enter a valid price');
      return;
    }
    onSave(num);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Edit Target Price</Text>

          <Input
            label="New target price"
            value={value}
            onChangeText={(t) => { setValue(t); setError(''); }}
            error={error}
            placeholder="0.00"
            keyboardType="decimal-pad"
            autoFocus
          />

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.actionBtn} />
            <Button title="Save" onPress={handleSave} style={styles.actionBtn} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});

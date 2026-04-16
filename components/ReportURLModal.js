import { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { reportURL } from '../lib/reports';
import { parseError } from '../lib/errorHandler';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

export default function ReportURLModal({ visible, url, onClose }) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reportURL(url, note.trim(), user?.id);
      Alert.alert('Thanks for the report', "We'll look into it and try to add support for this URL.");
      setNote('');
      onClose();
    } catch (e) {
      Alert.alert('Error', parseError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Report this URL</Text>
          <Text style={styles.subtitle}>
            Help us improve by letting us know this URL couldn't be fetched.
          </Text>

          <View style={styles.urlBox}>
            <Text style={styles.urlText} numberOfLines={2}>{url}</Text>
          </View>

          <Text style={styles.label}>ADD A NOTE (OPTIONAL)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. this worked yesterday, dynamic pricing page..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />

          <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
            <LinearGradient
              colors={['#3fff8b', '#13ea79']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitButton, submitting && styles.buttonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  urlBox: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  urlText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textLabel,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  noteInput: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    fontSize: typography.sizes.sm,
    minHeight: 80,
    marginBottom: spacing.md,
  },
  submitButton: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accentText,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});

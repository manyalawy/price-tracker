import { View, Image, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';

export default function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View>
      <BlurView
        intensity={30}
        tint="dark"
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: spacing.md,
            paddingHorizontal: spacing.lg,
            backgroundColor: colors.background + 'cc',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
  },
});

import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightTap } from '../lib/haptics';
import { colors, borderRadius } from '../constants/theme';

const TABS = [
  { name: 'index', icon: 'home-outline', iconActive: 'home' },
  { name: 'add', icon: 'add', iconActive: 'add' },
  { name: 'settings', icon: 'settings-outline', iconActive: 'settings' },
];

export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: 24 + insets.bottom }]}>
      <View style={styles.shadow}>
        <View style={styles.clip}>
          <BlurView intensity={20} tint="dark" style={styles.pill}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const tab = TABS[index];
              const isAdd = route.name === 'add';

              const onPress = () => {
                lightTap();
                if (!isFocused) {
                  navigation.navigate(route.name);
                }
              };

              if (isAdd) {
                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={onPress}
                    style={styles.tabButton}
                    activeOpacity={0.85}
                  >
                    <View style={styles.addCircle}>
                      <Ionicons name="add" size={20} color={colors.background} />
                    </View>
                    <View style={[styles.dot, isFocused ? styles.dotVisible : styles.dotHidden]} />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.tabButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isFocused ? tab.iconActive : tab.icon}
                    size={22}
                    color={isFocused ? colors.text : colors.textMuted}
                  />
                  <View style={[styles.dot, isFocused ? styles.dotVisible : styles.dotHidden]} />
                </TouchableOpacity>
              );
            })}
          </BlurView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  shadow: {
    borderRadius: borderRadius.xl,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 8,
  },
  clip: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: 64,
    backgroundColor: 'rgba(31,31,34,0.5)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  addCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  dotVisible: {
    opacity: 1,
  },
  dotHidden: {
    opacity: 0,
  },
});

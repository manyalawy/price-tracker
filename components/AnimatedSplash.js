import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';

export default function AnimatedSplash({ onComplete }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, { opacity }]}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
});

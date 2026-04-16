import { Redirect, Stack } from 'expo-router';
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthLayout() {
  const { session } = useAuth();

  if (session) {
    return <Redirect href="/(tabs)/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

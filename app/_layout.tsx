import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { colors } from '../src/theme';
import { useSession } from '../src/useSession';
import { SignIn } from '../src/SignIn';

function Gate() {
  const { session, loading } = useSession();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!session) return <SignIn />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Gate />
    </Provider>
  );
}

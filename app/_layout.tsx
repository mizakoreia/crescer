import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </Provider>
  );
}

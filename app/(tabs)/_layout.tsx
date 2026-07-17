import { Tabs } from 'expo-router';
import { Text, ColorValue } from 'react-native';
import { colors } from '../../src/theme';

const icon = (glyph: string) => ({ color }: { color: ColorValue }) => (
  <Text style={{ fontSize: 20, color }} accessibilityElementsHidden>{glyph}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: icon('☀️') }} />
      <Tabs.Screen name="diario" options={{ title: 'Diário', tabBarIcon: icon('📔') }} />
      <Tabs.Screen name="historia" options={{ title: 'História', tabBarIcon: icon('🌱') }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: icon('📅') }} />
      <Tabs.Screen name="trabalho" options={{ title: 'Trabalho', tabBarIcon: icon('💼') }} />
    </Tabs>
  );
}

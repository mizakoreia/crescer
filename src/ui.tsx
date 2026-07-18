import { Text, View, Image, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, font } from './theme';

// Avatar afetivo: foto quando houver, senão inicial do nome num círculo suave.
export function Avatar({ uri, name, size = 64 }: { uri?: string | null; name: string; size?: number }) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={dim} accessibilityLabel={`Foto de ${name}`} />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[s.avatar, dim]} accessibilityLabel={`${name}, sem foto`}>
      <Text style={{ fontSize: size * 0.42, color: colors.primary, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
}

export function Screen({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <View style={s.screen}>
      <Text style={s.title} accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[s.chip, active && s.chipActive]}
      hitSlop={8}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// Marcação de conteúdo privado — sempre texto + cor, nunca só cor (WCAG)
export function PrivateBadge() {
  return (
    <View style={s.privateBadge}>
      <Text style={s.privateText}>🔒 Privado</Text>
    </View>
  );
}

export function CriticalBanner({ text }: { text: string }) {
  return (
    <View style={s.critical} accessibilityRole="alert">
      <Text style={s.criticalText}>⚠ {text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md, paddingTop: spacing.xl * 1.5 },
  title: { ...font.title, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    minHeight: 44, justifyContent: 'center',
  },
  avatar: {
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary,
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { ...font.body, color: colors.inkSoft },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  privateBadge: {
    backgroundColor: colors.privateBg, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start',
  },
  privateText: { fontSize: 12, color: colors.private, fontWeight: '600' },
  critical: {
    backgroundColor: colors.criticalBg, borderLeftWidth: 4, borderLeftColor: colors.critical,
    borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm,
  },
  criticalText: { ...font.body, color: colors.critical, fontWeight: '600' },
});

import { useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card } from '../../src/ui';
import { useCreateInvitationMutation, useCareLinksQuery, useRevokeLinkMutation } from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

export default function Convidar() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [email, setEmail] = useState('');
  const [invite, { data, error, isLoading }] = useCreateInvitationMutation();
  const { data: links = [] } = useCareLinksQuery(childId!);
  const [revoke] = useRevokeLinkMutation();

  return (
    <Screen title="Convidar responsável">
      <TextInput style={s.input} placeholder="E-mail (opcional)" placeholderTextColor={colors.inkSoft}
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
        accessibilityLabel="E-mail do responsável" />
      <Pressable style={s.button} onPress={() => invite({ childId: childId!, email: email || undefined })}
        disabled={isLoading} accessibilityRole="button">
        <Text style={s.buttonText}>{isLoading ? '…' : 'Gerar convite'}</Text>
      </Pressable>
      {error && <Text style={s.error} accessibilityRole="alert">Não foi possível gerar o convite.</Text>}
      {data && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={font.small}>Envie este código ao responsável (expira em 7 dias, uso único):</Text>
          <Text selectable style={s.token}>{data.token}</Text>
        </Card>
      )}

      <Text style={[font.title, { fontSize: 18, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        Quem tem acesso
      </Text>
      {links.map((l) => (
        <Card key={l.id}>
          <Text style={[font.body, { fontWeight: '600' }]}>
            {l.profiles?.name ?? 'Usuário'} · {l.role === 'professional' ? 'profissional' : 'responsável'}
          </Text>
          {l.revoked_at ? (
            <Text style={[font.small, { color: colors.critical }]}>Acesso revogado.</Text>
          ) : (
            <Pressable onPress={() => revoke(l.id)} hitSlop={8} accessibilityRole="button">
              <Text style={[font.small, { color: colors.critical, textDecorationLine: 'underline' }]}>
                Revogar acesso (efeito imediato)
              </Text>
            </Pressable>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm, ...font.body, minHeight: 48,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  token: { ...font.body, fontWeight: '700', marginTop: spacing.sm },
  error: { color: colors.critical, marginTop: spacing.sm },
});

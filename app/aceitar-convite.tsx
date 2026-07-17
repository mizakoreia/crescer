import { useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card } from '../src/ui';
import { useAcceptInvitationMutation } from '../src/api';
import { colors, spacing, radius, font } from '../src/theme';

export default function AceitarConvite() {
  const [token, setToken] = useState('');
  const [accept, { error, isLoading }] = useAcceptInvitationMutation();

  const submit = async () => {
    const res = await accept(token.trim());
    if ('data' in res) router.back();
  };

  return (
    <Screen title="Aceitar convite">
      <Card>
        <Text style={font.body}>
          Cole o código do convite que a profissional enviou. Depois de aceitar, você configura os
          consentimentos — o que pode e o que não pode ser compartilhado.
        </Text>
      </Card>
      <TextInput style={s.input} placeholder="Código do convite" placeholderTextColor={colors.inkSoft}
        autoCapitalize="none" value={token} onChangeText={setToken} accessibilityLabel="Código do convite" />
      {error && <Text style={s.error} accessibilityRole="alert">Convite inválido ou expirado.</Text>}
      <Pressable style={s.button} onPress={submit} disabled={!token.trim() || isLoading} accessibilityRole="button">
        <Text style={s.buttonText}>{isLoading ? '…' : 'Aceitar'}</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, marginVertical: spacing.sm, ...font.body, minHeight: 48,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  error: { color: colors.critical, marginBottom: spacing.sm },
});

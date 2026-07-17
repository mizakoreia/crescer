import { useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from './supabase';
import { colors, spacing, radius, font } from './theme';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setError(null);
    const { data, error } =
      mode === 'entrar'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setBusy(false); return; }
    if (mode === 'criar' && data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, name: name || email.split('@')[0] });
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={s.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={s.logo}>Crescer</Text>
      <Text style={s.tagline}>Cada criança tem seu ritmo.</Text>
      {mode === 'criar' && (
        <TextInput style={s.input} placeholder="Como você prefere ser chamada?" placeholderTextColor={colors.inkSoft}
          value={name} onChangeText={setName} accessibilityLabel="Nome" />
      )}
      <TextInput style={s.input} placeholder="E-mail" placeholderTextColor={colors.inkSoft}
        autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}
        accessibilityLabel="E-mail" />
      <TextInput style={s.input} placeholder="Senha" placeholderTextColor={colors.inkSoft}
        secureTextEntry value={password} onChangeText={setPassword} accessibilityLabel="Senha" />
      {error && <Text style={s.error} accessibilityRole="alert">{error}</Text>}
      <Pressable style={s.button} onPress={submit} disabled={busy} accessibilityRole="button">
        <Text style={s.buttonText}>{busy ? '…' : mode === 'entrar' ? 'Entrar' : 'Criar conta'}</Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === 'entrar' ? 'criar' : 'entrar')} hitSlop={8}>
        <Text style={s.switch}>{mode === 'entrar' ? 'Criar conta nova' : 'Já tenho conta'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.lg },
  logo: { fontSize: 36, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  tagline: { ...font.small, textAlign: 'center', marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm, ...font.body, minHeight: 48,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.sm, minHeight: 48, justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  switch: { ...font.body, color: colors.primary, textAlign: 'center', marginTop: spacing.md },
  error: { color: colors.critical, marginBottom: spacing.sm },
});

import { useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/ui';
import { useCreateChildMutation } from '../src/api';
import { colors, spacing, radius, font } from '../src/theme';

export default function NovaCrianca() {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [pronoun, setPronoun] = useState('');
  const [create, { error, isLoading }] = useCreateChildMutation();

  const submit = async () => {
    const res = await create({ name, birthdate, pronoun: pronoun || undefined });
    if ('data' in res) router.back();
  };

  const valid = name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(birthdate);

  return (
    <Screen title="Nova criança">
      <TextInput style={s.input} placeholder="Nome ou apelido" placeholderTextColor={colors.inkSoft}
        value={name} onChangeText={setName} accessibilityLabel="Nome ou apelido" />
      <TextInput style={s.input} placeholder="Nascimento (AAAA-MM-DD)" placeholderTextColor={colors.inkSoft}
        value={birthdate} onChangeText={setBirthdate} accessibilityLabel="Data de nascimento" />
      <TextInput style={s.input} placeholder="Pronome (opcional)" placeholderTextColor={colors.inkSoft}
        value={pronoun} onChangeText={setPronoun} accessibilityLabel="Pronome" />
      {error && <Text style={s.error} accessibilityRole="alert">{'message' in error ? error.message : 'Erro ao salvar'}</Text>}
      <Pressable style={[s.button, !valid && s.buttonOff]} onPress={submit} disabled={!valid || isLoading}
        accessibilityRole="button">
        <Text style={s.buttonText}>{isLoading ? 'Salvando…' : 'Criar perfil'}</Text>
      </Pressable>
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
    alignItems: 'center', marginTop: spacing.sm, minHeight: 48, justifyContent: 'center',
  },
  buttonOff: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  error: { color: colors.critical, marginBottom: spacing.sm },
});

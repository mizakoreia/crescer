import { useState } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card } from '../../src/ui';
import { useFamilyMessagesQuery, useAddFamilyMessageMutation } from '../../src/api';
import { useSession } from '../../src/useSession';
import { colors, spacing, radius, font } from '../../src/theme';

// Mural de recados (§10): comunicação entre família e cuidador, com autoria e
// histórico. Append-only — recados não somem.
export default function Mural() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { session } = useSession();
  const myId = session?.user.id;
  const { data: messages = [] } = useFamilyMessagesQuery(childId!, { skip: !childId });
  const [add, { isLoading }] = useAddFamilyMessageMutation();
  const [body, setBody] = useState('');

  if (!childId) {
    return <Screen title="Mural"><Card><Text style={font.body}>Selecione uma criança primeiro.</Text></Card></Screen>;
  }

  const submit = async () => {
    if (!body.trim()) return;
    await add({ child_id: childId, body: body.trim() });
    setBody('');
  };

  return (
    <Screen title="Mural de recados">
      <ScrollView keyboardShouldPersistTaps="handled">
        <Card>
          <TextInput style={s.input} multiline value={body} onChangeText={setBody}
            placeholder="Escreva um recado para a família e a equipe"
            placeholderTextColor={colors.inkSoft} accessibilityLabel="Novo recado" />
          <Pressable style={s.button} onPress={submit} disabled={isLoading || !body.trim()}
            accessibilityRole="button">
            <Text style={s.buttonText}>Publicar recado</Text>
          </Pressable>
        </Card>

        {messages.length === 0 && <Text style={font.small}>Nenhum recado ainda.</Text>}
        {messages.map((m) => (
          <Card key={m.id} style={m.author_id === myId ? s.mine : undefined}>
            <Text style={font.body}>{m.body}</Text>
            <Text style={font.small}>
              {m.author_id === myId ? 'Você' : m.author_name} ·{' '}
              {new Date(m.created_at).toLocaleDateString('pt-BR')}{' '}
              {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm, ...font.body, minHeight: 64,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  mine: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
});

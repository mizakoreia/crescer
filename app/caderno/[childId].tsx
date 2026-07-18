import { useState } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, Switch, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card, Chip } from '../../src/ui';
import {
  useGuidanceNotesQuery, useAddGuidanceNoteMutation, useAcknowledgeGuidanceMutation,
} from '../../src/api';
import { useSession } from '../../src/useSession';
import { colors, spacing, radius, font } from '../../src/theme';

const SECTIONS = ['geral', 'alimentacao', 'sono', 'higiene', 'conforto', 'rotina', 'preferencias', 'saude', 'passeios', 'telas', 'contatos'] as const;
const SECTION_LABEL: Record<string, string> = {
  geral: 'Geral', alimentacao: 'Alimentação', sono: 'Sono', higiene: 'Higiene',
  conforto: 'Conforto', rotina: 'Rotina', preferencias: 'Preferências', saude: 'Saúde',
  passeios: 'Passeios', telas: 'Telas e mídia', contatos: 'Contatos',
};

// Caderno de orientações (§11): informações que ficam espalhadas no WhatsApp,
// aqui organizadas, datadas, com autoria e confirmação de leitura.
export default function Caderno() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { session } = useSession();
  const myId = session?.user.id;
  const { data: notes = [] } = useGuidanceNotesQuery(childId!, { skip: !childId });
  const [add, { isLoading }] = useAddGuidanceNoteMutation();
  const [ack] = useAcknowledgeGuidanceMutation();

  const [section, setSection] = useState<string>('geral');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);

  if (!childId) {
    return <Screen title="Caderno"><Card><Text style={font.body}>Selecione uma criança primeiro.</Text></Card></Screen>;
  }

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    await add({ child_id: childId, section, title: title.trim(), body: body.trim(), important });
    setTitle(''); setBody(''); setImportant(false); setSection('geral');
  };

  return (
    <Screen title="Caderno de orientações">
      <ScrollView keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={[font.body, { fontWeight: '600', marginBottom: spacing.sm }]}>Nova orientação</Text>
          <View style={s.chips}>
            {SECTIONS.map((sec) => (
              <Chip key={sec} label={SECTION_LABEL[sec]} active={section === sec} onPress={() => setSection(sec)} />
            ))}
          </View>
          <TextInput style={s.input} value={title} onChangeText={setTitle}
            placeholder="Título (ex.: Horário do soninho da tarde)" placeholderTextColor={colors.inkSoft}
            accessibilityLabel="Título da orientação" />
          <TextInput style={[s.input, { minHeight: 72 }]} multiline value={body} onChangeText={setBody}
            placeholder="Detalhes da orientação" placeholderTextColor={colors.inkSoft}
            accessibilityLabel="Detalhes" />
          <View style={s.row}>
            <Text style={[font.body, { flex: 1 }]}>Marcar como importante</Text>
            <Switch value={important} onValueChange={setImportant}
              trackColor={{ true: colors.accent, false: colors.border }} accessibilityLabel="Importante" />
          </View>
          <Pressable style={s.button} onPress={submit} disabled={isLoading || !title.trim() || !body.trim()}
            accessibilityRole="button">
            <Text style={s.buttonText}>Adicionar ao caderno</Text>
          </Pressable>
        </Card>

        {notes.length === 0 && <Text style={font.small}>O caderno ainda está vazio.</Text>}
        {notes.map((n) => {
          const ackedByMe = !!myId && n.guidance_acknowledgements.some((a) => a.user_id === myId);
          const count = n.guidance_acknowledgements.length;
          return (
            <Card key={n.id} style={n.important ? s.important : undefined}>
              <View style={s.row}>
                <View style={s.sectionTag}><Text style={s.sectionTagText}>{SECTION_LABEL[n.section] ?? n.section}</Text></View>
                {n.important && <Text style={s.star}>⭐ Importante</Text>}
              </View>
              <Text style={[font.body, { fontWeight: '600' }]}>{n.title}</Text>
              <Text style={font.body}>{n.body}</Text>
              <Text style={font.small}>
                {new Date(n.created_at).toLocaleDateString('pt-BR')}
                {count > 0 ? ` · lida por ${count}` : ''}
              </Text>
              {ackedByMe ? (
                <Text style={[font.small, { color: colors.success, fontWeight: '600' }]}>✓ Você confirmou a leitura</Text>
              ) : (
                <Pressable style={s.ack} onPress={() => ack(n.id)} accessibilityRole="button">
                  <Text style={s.ackText}>Confirmar leitura</Text>
                </Pressable>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm, ...font.body, minHeight: 44,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  important: { borderColor: colors.accent, borderWidth: 1.5 },
  sectionTag: { flex: 1 },
  sectionTagText: { ...font.small, color: colors.primary, fontWeight: '600', textTransform: 'uppercase' },
  star: { ...font.small, color: colors.accent, fontWeight: '600' },
  ack: {
    alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginTop: spacing.xs, minHeight: 36, justifyContent: 'center',
  },
  ackText: { ...font.small, color: colors.primary, fontWeight: '600' },
});

import { useState } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { Screen, Card, Chip } from '../../src/ui';
import { useChildId, useLivingEntriesQuery, useAddLivingEntryMutation } from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

const SECOES = ['personalidade', 'preferencias', 'temperamento', 'interesses', 'comunicacao', 'habilidades', 'desafios', 'conquistas'] as const;
const LABEL: Record<string, string> = {
  personalidade: 'Personalidade', preferencias: 'Preferências', temperamento: 'Temperamento',
  interesses: 'Interesses', comunicacao: 'Comunicação', habilidades: 'Habilidades',
  desafios: 'Desafios', conquistas: 'Conquistas',
};

// Perfil vivo: append-only — cada seção mostra a entrada mais recente + histórico
export default function Historia() {
  const childId = useChildId();
  const { data: entries = [] } = useLivingEntriesQuery(childId!, { skip: !childId });
  const [add, { isLoading }] = useAddLivingEntryMutation();
  const [section, setSection] = useState<string | null>(null);
  const [content, setContent] = useState('');

  if (!childId) {
    return (
      <Screen title="História">
        <Card><Text style={font.body}>Selecione ou crie uma criança primeiro.</Text></Card>
      </Screen>
    );
  }

  const submit = async () => {
    if (!section || !content.trim()) return;
    await add({ child_id: childId, section, content: content.trim() });
    setContent(''); setSection(null);
  };

  const latestBySection = SECOES.map((sec) => ({
    sec,
    latest: entries.find((e) => e.section === sec),  // entries já vêm desc
    count: entries.filter((e) => e.section === sec).length,
  })).filter((x) => x.latest);

  return (
    <Screen title="História">
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={s.chips}>
          {SECOES.map((sec) => (
            <Chip key={sec} label={LABEL[sec]} active={section === sec} onPress={() => setSection(sec)} />
          ))}
        </View>

        {section && (
          <Card>
            <Text style={[font.body, { fontWeight: '600', marginBottom: spacing.sm }]}>{LABEL[section]}</Text>
            <TextInput style={s.input} multiline value={content} onChangeText={setContent}
              placeholder="O que mudou? O histórico anterior é preservado."
              placeholderTextColor={colors.inkSoft} accessibilityLabel={`Atualizar ${LABEL[section]}`} />
            <Pressable style={s.button} onPress={submit} disabled={isLoading || !content.trim()}
              accessibilityRole="button">
              <Text style={s.buttonText}>Adicionar ao perfil</Text>
            </Pressable>
          </Card>
        )}

        {latestBySection.map(({ sec, latest, count }) => (
          <Card key={sec}>
            <Text style={[font.body, { fontWeight: '600' }]}>{LABEL[sec]}</Text>
            <Text style={font.body}>{latest!.content}</Text>
            <Text style={font.small}>
              Atualizado em {new Date(latest!.created_at).toLocaleDateString('pt-BR')}
              {count > 1 ? ` · ${count - 1} registro(s) anteriores preservados` : ''}
            </Text>
          </Card>
        ))}
        {latestBySection.length === 0 && (
          <Text style={font.small}>O perfil vivo cresce com o tempo — comece por Interesses.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm, ...font.body, minHeight: 64,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

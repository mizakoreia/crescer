import { useState, useEffect } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen, Card } from '../../src/ui';
import { useObservationsQuery, useUpdateObservationMutation, useChildId } from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

// Revisão humana obrigatória (RF-09): narrativa assistida nasce rascunho,
// é totalmente editável e só compartilha com confirmação explícita.
export default function RevisarObservacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const childId = useChildId();
  const { data: observations = [] } = useObservationsQuery(childId!, { skip: !childId });
  const obs = observations.find((o) => o.id === id);
  const [update, { isLoading }] = useUpdateObservationMutation();

  const [fact, setFact] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [continuity, setContinuity] = useState('');
  useEffect(() => {
    if (obs) { setFact(obs.fact); setInterpretation(obs.interpretation ?? ''); setContinuity(obs.continuity ?? ''); }
  }, [obs?.id]);

  if (!obs) {
    return <Screen title="Observação"><Card><Text style={font.body}>Observação não encontrada.</Text></Card></Screen>;
  }

  const save = async (review_state: 'done' | 'shared') => {
    await update({ id: obs.id, fact, interpretation, continuity, review_state });
    router.back();
  };

  return (
    <Screen title="Revisar observação">
      <ScrollView keyboardShouldPersistTaps="handled">
        {obs.origin === 'assisted' && (
          <Card style={{ backgroundColor: colors.primarySoft }}>
            <Text style={font.small}>
              ✨ Sugestão gerada a partir de {obs.source_record_ids.length} registro(s) do diário.
              É uma hipótese pedagógica, não um diagnóstico. Revise e edite antes de compartilhar.
            </Text>
            {obs.low_confidence && (
              <Text style={[font.small, { color: colors.accent, marginTop: spacing.xs }]}>
                Registros curtos — a sugestão se limita ao que foi registrado.
              </Text>
            )}
          </Card>
        )}

        <Text style={s.label}>O que foi observado (fato)</Text>
        <TextInput style={s.input} multiline value={fact} onChangeText={setFact}
          accessibilityLabel="Fato observado" />

        <Text style={s.label}>Leitura pedagógica (interpretação)</Text>
        <TextInput style={s.input} multiline value={interpretation} onChangeText={setInterpretation}
          accessibilityLabel="Interpretação" />

        <Text style={s.label}>Convite para continuar explorando</Text>
        <TextInput style={s.input} multiline value={continuity} onChangeText={setContinuity}
          accessibilityLabel="Continuidade" />

        {obs.domains.length > 0 && (
          <Text style={[font.small, { marginBottom: spacing.md }]}>
            Possíveis conexões: {obs.domains.join(', ')}
          </Text>
        )}

        <View style={s.row}>
          <Pressable style={[s.button, s.secondary]} onPress={() => save('done')} disabled={isLoading}
            accessibilityRole="button">
            <Text style={[s.buttonText, { color: colors.primary }]}>Salvar</Text>
          </Pressable>
          <Pressable style={s.button} onPress={() => save('shared')} disabled={isLoading}
            accessibilityRole="button">
            <Text style={s.buttonText}>Revisar e compartilhar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { ...font.small, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, ...font.body, minHeight: 72,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  button: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.primarySoft },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

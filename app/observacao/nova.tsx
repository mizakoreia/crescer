import { useState } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card } from '../../src/ui';
import { useAddObservationMutation, useChildId } from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

// Observação manual (§5): separa fato de interpretação, linguagem hipotética,
// nunca diagnóstica. Sem IA — o adulto escreve e revisa ao mesmo tempo.
export default function NovaObservacao() {
  const childId = useChildId();
  const [add, { isLoading }] = useAddObservationMutation();
  const [fact, setFact] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [continuity, setContinuity] = useState('');

  if (!childId) {
    return (
      <Screen title="Nova observação">
        <Card><Text style={font.body}>Selecione ou crie uma criança primeiro.</Text></Card>
      </Screen>
    );
  }

  const save = async (review_state: 'done' | 'shared') => {
    if (!fact.trim()) return;
    await add({
      child_id: childId,
      fact: fact.trim(),
      interpretation: interpretation.trim() || undefined,
      continuity: continuity.trim() || undefined,
      review_state,
    });
    router.back();
  };

  return (
    <Screen title="Nova observação">
      <ScrollView keyboardShouldPersistTaps="handled">
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <Text style={font.small}>
            Registre primeiro o que você viu (fato). A leitura é uma hipótese, não um
            diagnóstico — prefira "pareceu", "foi possível observar", "vale acompanhar".
            Evite comparar com outras crianças ou concluir.
          </Text>
        </Card>

        <Text style={s.label}>O que foi observado (fato)</Text>
        <TextInput style={s.input} multiline value={fact} onChangeText={setFact}
          placeholder="Ex.: Olhou repetidamente para o reflexo no espelho."
          placeholderTextColor={colors.inkSoft} accessibilityLabel="Fato observado" />

        <Text style={s.label}>Leitura pedagógica (interpretação) — opcional</Text>
        <TextInput style={s.input} multiline value={interpretation} onChangeText={setInterpretation}
          placeholder="Ex.: Pareceu demonstrar interesse pelo próprio reflexo."
          placeholderTextColor={colors.inkSoft} accessibilityLabel="Interpretação" />

        <Text style={s.label}>Convite para continuar explorando — opcional</Text>
        <TextInput style={s.input} multiline value={continuity} onChangeText={setContinuity}
          placeholder="Ex.: A família pode observar se esse interesse se repete."
          placeholderTextColor={colors.inkSoft} accessibilityLabel="Continuidade" />

        <View style={s.row}>
          <Pressable style={[s.button, s.secondary]} onPress={() => save('done')}
            disabled={isLoading || !fact.trim()} accessibilityRole="button">
            <Text style={[s.buttonText, { color: colors.primary }]}>Salvar</Text>
          </Pressable>
          <Pressable style={s.button} onPress={() => save('shared')}
            disabled={isLoading || !fact.trim()} accessibilityRole="button">
            <Text style={s.buttonText}>Salvar e compartilhar</Text>
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

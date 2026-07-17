import { useState } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card, Chip, CriticalBanner } from '../../src/ui';
import {
  useHealthQuery, useAddHealthConditionMutation, useAddEmergencyContactMutation,
  useAddMedicationMutation, useRecordAdministrationMutation,
} from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

type FormKind = 'alergia' | 'contato' | 'medicamento' | null;

export default function Saude() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { data } = useHealthQuery(childId!);
  const [addCondition] = useAddHealthConditionMutation();
  const [addContact] = useAddEmergencyContactMutation();
  const [addMedication] = useAddMedicationMutation();
  const [record, { error: recordError }] = useRecordAdministrationMutation();

  const [form, setForm] = useState<FormKind>(null);
  const [f1, setF1] = useState(''); const [f2, setF2] = useState(''); const [f3, setF3] = useState('');

  const submit = async () => {
    if (form === 'alergia') await addCondition({ child_id: childId!, kind: 'alergia', name: f1, severity: f2 || 'moderada', instruction: f3 || undefined });
    if (form === 'contato') await addContact({ child_id: childId!, name: f1, relation: f2 || undefined, phone: f3 });
    if (form === 'medicamento') await addMedication({ child_id: childId!, name: f1, dose: f2, schedule: f3 });
    setForm(null); setF1(''); setF2(''); setF3('');
  };

  const critical = data?.conditions.filter((c) => c.severity === 'critica') ?? [];

  return (
    <Screen title="Saúde e emergência">
      <ScrollView keyboardShouldPersistTaps="handled">
        {critical.map((c) => (
          <CriticalBanner key={c.id} text={`${c.name}${c.instruction ? ` — ${c.instruction}` : ''}`} />
        ))}

        <Text style={s.section}>Contatos de emergência</Text>
        {data?.contacts.map((c) => (
          <Pressable key={c.id} onPress={() => Linking.openURL(`tel:${c.phone}`)} accessibilityRole="button">
            <Card>
              <Text style={[font.body, { fontWeight: '600' }]}>{c.name}{c.relation ? ` (${c.relation})` : ''}</Text>
              <Text style={[font.body, { color: colors.primary }]}>📞 {c.phone}</Text>
            </Card>
          </Pressable>
        ))}

        <Text style={s.section}>Alergias e restrições</Text>
        {data?.conditions.map((c) => (
          <Card key={c.id} style={c.severity === 'critica' ? { borderColor: colors.critical } : undefined}>
            <Text style={[font.body, { fontWeight: '600' }]}>{c.name} · {c.severity}</Text>
            {c.instruction ? <Text style={font.body}>{c.instruction}</Text> : null}
          </Card>
        ))}

        <Text style={s.section}>Medicamentos</Text>
        {data?.medications.map((m) => {
          const authorized = m.medication_authorizations.some((a) => !a.revoked_at);
          return (
            <Card key={m.id}>
              <Text style={[font.body, { fontWeight: '600' }]}>{m.name} — {m.dose} · {m.schedule}</Text>
              {m.instruction ? <Text style={font.body}>{m.instruction}</Text> : null}
              {authorized ? (
                <Pressable style={s.smallButton}
                  onPress={() => record({ medication_id: m.id, child_id: childId! })}
                  accessibilityRole="button">
                  <Text style={s.smallButtonText}>Registrar administração agora</Text>
                </Pressable>
              ) : (
                <Text style={[font.small, { color: colors.critical }]}>
                  Sem autorização ativa do responsável — administração bloqueada.
                </Text>
              )}
            </Card>
          );
        })}
        {recordError && (
          <Text style={[font.small, { color: colors.critical }]} accessibilityRole="alert">
            Registro rejeitado: autorização ativa é obrigatória.
          </Text>
        )}

        {(data?.administrations.length ?? 0) > 0 && (
          <>
            <Text style={s.section}>Histórico de administrações</Text>
            {data!.administrations.map((a) => (
              <Card key={a.id}>
                <Text style={font.small}>
                  {new Date(a.given_at).toLocaleString('pt-BR')} · {a.skipped ? 'não administrado' : 'administrado'}
                  {a.addendum_of ? ' · adendo' : ''}
                </Text>
                {a.note ? <Text style={font.body}>{a.note}</Text> : null}
              </Card>
            ))}
          </>
        )}

        <Text style={s.section}>Adicionar</Text>
        <View style={s.chips}>
          <Chip label="Alergia" active={form === 'alergia'} onPress={() => setForm('alergia')} />
          <Chip label="Contato" active={form === 'contato'} onPress={() => setForm('contato')} />
          <Chip label="Medicamento" active={form === 'medicamento'} onPress={() => setForm('medicamento')} />
        </View>
        {form && (
          <Card>
            <TextInput style={s.input} value={f1} onChangeText={setF1} placeholderTextColor={colors.inkSoft}
              placeholder={form === 'contato' ? 'Nome' : form === 'medicamento' ? 'Nome do medicamento' : 'Alergia/restrição'}
              accessibilityLabel="Nome" />
            <TextInput style={s.input} value={f2} onChangeText={setF2} placeholderTextColor={colors.inkSoft}
              placeholder={form === 'contato' ? 'Relação (mãe, pai...)' : form === 'medicamento' ? 'Dose (ex.: 5ml)' : 'Severidade: leve, moderada ou critica'}
              accessibilityLabel="Detalhe" />
            <TextInput style={s.input} value={f3} onChangeText={setF3} placeholderTextColor={colors.inkSoft}
              placeholder={form === 'contato' ? 'Telefone' : form === 'medicamento' ? 'Horário (ex.: 8/8h)' : 'Conduta em caso de contato'}
              accessibilityLabel="Complemento" />
            {form === 'medicamento' && (
              <Text style={font.small}>Ao salvar, sua autorização como responsável fica registrada.</Text>
            )}
            <Pressable style={s.button} onPress={submit} disabled={!f1} accessibilityRole="button">
              <Text style={s.buttonText}>Salvar</Text>
            </Pressable>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  section: { ...font.title, fontSize: 18, marginTop: spacing.md, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm, ...font.body, minHeight: 44,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: spacing.xs,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  smallButton: {
    backgroundColor: colors.primarySoft, borderRadius: radius.sm, padding: spacing.sm,
    alignItems: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.sm,
  },
  smallButtonText: { ...font.body, color: colors.primary, fontWeight: '600' },
});

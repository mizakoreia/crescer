import { useState, useEffect } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, StyleSheet, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card } from '../../src/ui';
import {
  useWeeklyReportQuery, useComposeWeekQuery, useUpsertWeeklyReportMutation, useGenerateReportPdfMutation,
} from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

const SECTIONS: { key: string; label: string }[] = [
  { key: 'rotina', label: 'Rotina' },
  { key: 'experiencias', label: 'Experiências da semana' },
  { key: 'observacoes', label: 'Observações de desenvolvimento' },
  { key: 'conquistas', label: 'Conquistas' },
  { key: 'convites', label: 'Próximos convites ao brincar' },
];

const mondayOf = (d: Date) => {
  const day = (d.getDay() + 6) % 7;
  return new Date(d.getTime() - day * 86_400_000).toISOString().slice(0, 10);
};

// RF-08: composição automática + revisão obrigatória antes de compartilhar.
export default function ResumoSemanal() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const weekStart = mondayOf(new Date());
  const { data: report } = useWeeklyReportQuery({ childId: childId!, weekStart });
  const { data: composed } = useComposeWeekQuery({ childId: childId!, weekStart }, { skip: !!report });
  const [upsert, { isLoading: saving }] = useUpsertWeeklyReportMutation();
  const [genPdf, { isLoading: generating }] = useGenerateReportPdfMutation();

  const [content, setContent] = useState<Record<string, string>>({});
  useEffect(() => {
    if (report) setContent(report.content);
    else if (composed) setContent(composed);
  }, [report?.id, composed]);

  const save = (state: 'draft' | 'shared') =>
    upsert({ child_id: childId!, week_start: weekStart, content, state, ...(report ? { id: report.id, version: report.version } : {}) });

  const pdf = async () => {
    let id = report?.id;
    if (!id) {
      const res = await save('draft');
      if ('data' in res && res.data) id = res.data.id; else return;
    }
    const res = await genPdf({ report_id: id! });
    if ('data' in res && res.data) Share.share({ message: res.data.url, title: 'Resumo semanal (PDF)' });
  };

  return (
    <Screen title={`Resumo · semana de ${new Date(weekStart).toLocaleDateString('pt-BR')}`}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <Text style={font.small}>
            Composto automaticamente só com registros compartilháveis — notas privadas ficam de fora.
            Revise e edite antes de compartilhar com a família.
          </Text>
        </Card>

        {SECTIONS.map(({ key, label }) => (
          <View key={key}>
            <Text style={s.label}>{label}</Text>
            <TextInput style={s.input} multiline value={content[key] ?? ''}
              onChangeText={(t) => setContent({ ...content, [key]: t })}
              placeholder="—" placeholderTextColor={colors.inkSoft}
              accessibilityLabel={label} />
          </View>
        ))}

        {report?.state === 'shared' && (
          <Text style={[font.small, { color: colors.success, marginBottom: spacing.sm }]}>
            Compartilhado em {report.shared_at ? new Date(report.shared_at).toLocaleString('pt-BR') : ''}.
          </Text>
        )}

        <View style={s.row}>
          <Pressable style={[s.button, s.secondary]} onPress={() => save('draft')} disabled={saving}
            accessibilityRole="button">
            <Text style={[s.buttonText, { color: colors.primary }]}>Salvar rascunho</Text>
          </Pressable>
          <Pressable style={s.button}
            onPress={() => upsert({ child_id: childId!, week_start: weekStart, content, state: 'shared', shared_at: new Date().toISOString(), ...(report ? { id: report.id, version: report.version } : {}) })}
            disabled={saving} accessibilityRole="button">
            <Text style={s.buttonText}>Revisar e compartilhar</Text>
          </Pressable>
        </View>
        <Pressable style={[s.button, { marginTop: spacing.sm }]} onPress={pdf} disabled={generating}
          accessibilityRole="button">
          <Text style={s.buttonText}>{generating ? 'Gerando…' : 'Gerar PDF'}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { ...font.small, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, ...font.body, minHeight: 64,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  button: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.primarySoft },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, Switch, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Chip, PrivateBadge } from '../../src/ui';
import {
  useChildId, useDailyRecordsQuery, useUpsertDailyRecordMutation, DailyRecord,
  useConsentsQuery, useEnrichObservationMutation,
} from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

const CATEGORIAS = [
  'alimentacao', 'mamadeira', 'agua', 'sono', 'fralda', 'higiene', 'humor',
  'atividade', 'passeio', 'leitura', 'saude', 'observacao', 'momento_especial',
] as const;
const LABEL: Record<string, string> = {
  alimentacao: 'Alimentação', mamadeira: 'Mamadeira', agua: 'Água', sono: 'Sono',
  fralda: 'Fralda', higiene: 'Higiene', humor: 'Humor', atividade: 'Atividade',
  passeio: 'Passeio', leitura: 'Leitura', saude: 'Saúde', observacao: 'Observação',
  momento_especial: 'Momento especial',
};

export default function Diario() {
  const childId = useChildId();
  const today = new Date().toISOString().slice(0, 10);
  const { data: records = [] } = useDailyRecordsQuery({ childId: childId!, day: today }, { skip: !childId });
  const [upsert] = useUpsertDailyRecordMutation();
  const { data: consents = [] } = useConsentsQuery(childId!, { skip: !childId });
  const [enrich, { isLoading: enriching }] = useEnrichObservationMutation();
  // gate: sem consentimento de recursos automáticos, o botão nem aparece (RF-09)
  const aiAllowed = consents.some((c) => c.scope === 'automated_features');
  const enrichable = records.filter((r) => r.visibility !== 'private_professional' && r.note);

  const doEnrich = async () => {
    const res = await enrich({ child_id: childId!, record_ids: enrichable.map((r) => r.id) });
    if ('data' in res && res.data) router.push(`/observacao/${res.data.id}`);
  };

  const [cat, setCat] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const payload = (state: DailyRecord['state']) => ({
    ...(draftId ? { id: draftId } : {}),
    child_id: childId!,
    category: cat!,
    note: note || null,
    duration_min: duration ? parseInt(duration, 10) : null,
    visibility: isPrivate ? 'private_professional' : 'shareable_after_review',
    state,
  });

  // autosave de rascunho (2s após parar de digitar)
  useEffect(() => {
    if (!cat || !childId || !note) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const res = await upsert(payload('draft'));
      if ('data' in res && res.data) setDraftId(res.data.id);
    }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [note, duration, isPrivate, cat]);

  const conclude = async () => {
    const res = await upsert(payload('done'));
    if ('data' in res) { setCat(null); setNote(''); setDuration(''); setIsPrivate(false); setDraftId(null); }
  };

  if (!childId) {
    return (
      <Screen title="Diário">
        <Card><Text style={font.body}>Selecione ou crie uma criança primeiro.</Text></Card>
      </Screen>
    );
  }

  return (
    <Screen title="Diário">
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={s.chips}>
          {CATEGORIAS.map((c) => (
            <Chip key={c} label={LABEL[c]} active={cat === c}
              onPress={() => { setCat(c); setDraftId(null); }} />
          ))}
        </View>

        {cat && (
          <Card>
            <Text style={[font.body, { fontWeight: '600', marginBottom: spacing.sm }]}>{LABEL[cat]}</Text>
            <TextInput
              style={s.input} multiline placeholder="O que você observou?"
              placeholderTextColor={colors.inkSoft} value={note} onChangeText={setNote}
              accessibilityLabel="Observação"
            />
            <TextInput
              style={s.input} placeholder="Duração em minutos (opcional)" keyboardType="number-pad"
              placeholderTextColor={colors.inkSoft} value={duration} onChangeText={setDuration}
              accessibilityLabel="Duração em minutos"
            />
            <View style={s.row}>
              <Text style={[font.body, { flex: 1 }]}>Nota privada (só você vê)</Text>
              <Switch value={isPrivate} onValueChange={setIsPrivate}
                trackColor={{ true: colors.private, false: colors.border }}
                accessibilityLabel="Nota privada" />
            </View>
            <Pressable style={s.button} onPress={conclude} disabled={!note} accessibilityRole="button">
              <Text style={s.buttonText}>Concluir registro</Text>
            </Pressable>
            {draftId && <Text style={font.small}>Rascunho salvo automaticamente.</Text>}
          </Card>
        )}

        {aiAllowed && enrichable.length > 0 && (
          <Pressable style={s.enrich} onPress={doEnrich} disabled={enriching} accessibilityRole="button">
            <Text style={s.enrichText}>
              {enriching ? 'Escrevendo narrativa…' : '✨ Enriquecer em narrativa pedagógica'}
            </Text>
          </Pressable>
        )}

        <Text style={[font.title, { fontSize: 18, marginTop: spacing.md }]}>Hoje</Text>
        {records.length === 0 && <Text style={font.small}>Nenhum registro ainda.</Text>}
        {records.map((r) => (
          <Card key={r.id}>
            <View style={s.row}>
              <Text style={[font.body, { fontWeight: '600', flex: 1 }]}>{LABEL[r.category] ?? r.category}</Text>
              {r.visibility === 'private_professional' && <PrivateBadge />}
            </View>
            {r.note ? <Text style={font.body}>{r.note}</Text> : null}
            <Text style={font.small}>
              {new Date(r.occurred_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {r.duration_min ? ` · ${r.duration_min} min` : ''} · {r.state === 'draft' ? 'rascunho' : r.state === 'done' ? 'concluído' : 'compartilhado'}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm, ...font.body, minHeight: 44,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center', marginBottom: spacing.xs,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  enrich: {
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
    minHeight: 48, justifyContent: 'center', marginTop: spacing.sm,
  },
  enrichText: { ...font.body, color: colors.primary, fontWeight: '600' },
});

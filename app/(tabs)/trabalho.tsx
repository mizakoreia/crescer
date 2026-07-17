import { useState } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, StyleSheet, Share } from 'react-native';
import { Screen, Card } from '../../src/ui';
import {
  useChildId, useWorkQuery, useStartWorkPeriodMutation, useEndWorkPeriodMutation, useAddExpenseMutation,
} from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const hours = (start: string, end: string | null, breakMin: number) =>
  end ? Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000 - breakMin / 60) : 0;

export default function Trabalho() {
  const childId = useChildId();
  const { data } = useWorkQuery(childId!, { skip: !childId });
  const [start] = useStartWorkPeriodMutation();
  const [end] = useEndWorkPeriodMutation();
  const [addExpense] = useAddExpenseMutation();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!childId) {
    return <Screen title="Trabalho"><Card><Text style={font.body}>Selecione ou crie uma criança primeiro.</Text></Card></Screen>;
  }

  const open = data?.periods.find((p) => !p.ended_at);
  const month = new Date().toISOString().slice(0, 7);
  const monthPeriods = data?.periods.filter((p) => p.started_at.startsWith(month)) ?? [];
  const monthHours = monthPeriods.reduce((acc, p) => acc + hours(p.started_at, p.ended_at, p.break_min), 0);
  const monthExpenses = data?.expenses.filter((e) => e.occurred_on.startsWith(month)) ?? [];

  // exportação mensal simples (RF-07): CSV via share sheet
  const exportMonth = () => {
    const lines = [
      'tipo;data;detalhe;valor',
      ...monthPeriods.map((p) =>
        `horas;${p.started_at.slice(0, 10)};${hours(p.started_at, p.ended_at, p.break_min).toFixed(2)}h${p.overtime ? ' (extra)' : ''};`),
      ...monthExpenses.map((e) => `despesa;${e.occurred_on};${e.kind}${e.note ? ` ${e.note}` : ''};${brl(e.amount_cents)}`),
    ];
    Share.share({ message: lines.join('\n'), title: `Crescer — ${month}` });
  };

  return (
    <Screen title="Trabalho">
      <ScrollView keyboardShouldPersistTaps="handled">
        <Card>
          {open ? (
            <>
              <Text style={font.body}>
                Período aberto desde {new Date(open.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
              </Text>
              <Pressable style={s.button} onPress={() => end({ id: open.id })} accessibilityRole="button">
                <Text style={s.buttonText}>Encerrar período</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={s.button} onPress={() => start({ child_id: childId })} accessibilityRole="button">
              <Text style={s.buttonText}>Iniciar período de trabalho</Text>
            </Pressable>
          )}
        </Card>

        <Card>
          <Text style={[font.body, { fontWeight: '600' }]}>Este mês</Text>
          <Text style={font.body}>{monthHours.toFixed(1)} horas · {monthExpenses.length} despesa(s) ({brl(monthExpenses.reduce((a, e) => a + e.amount_cents, 0))})</Text>
          <Pressable style={s.secondary} onPress={exportMonth} accessibilityRole="button">
            <Text style={s.secondaryText}>Exportar mês (CSV)</Text>
          </Pressable>
        </Card>

        <Text style={s.section}>Nova despesa</Text>
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput style={[s.input, { width: 110 }]} placeholder="R$ 0,00" keyboardType="decimal-pad"
              placeholderTextColor={colors.inkSoft} value={amount} onChangeText={setAmount}
              accessibilityLabel="Valor da despesa" />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Descrição (ex.: transporte)"
              placeholderTextColor={colors.inkSoft} value={note} onChangeText={setNote}
              accessibilityLabel="Descrição da despesa" />
          </View>
          <Pressable style={s.button} disabled={!amount}
            onPress={async () => {
              const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100);
              if (!Number.isFinite(cents) || cents < 0) return;
              await addExpense({ child_id: childId, kind: note.toLowerCase().includes('transporte') ? 'transporte' : 'outro', amount_cents: cents, note: note || undefined });
              setAmount(''); setNote('');
            }}
            accessibilityRole="button">
            <Text style={s.buttonText}>Registrar despesa</Text>
          </Pressable>
        </Card>

        <Text style={s.section}>Pagamentos</Text>
        {data?.payments.map((p) => (
          <Card key={p.id}>
            <Text style={font.body}>
              {p.period_month.slice(0, 7)} · {brl(p.amount_cents)} · {p.status}
              {p.confirmed_by_guardian ? ' · confirmado pela família' : ''}
            </Text>
          </Card>
        ))}
        {data?.payments.length === 0 && <Text style={font.small}>Nenhum pagamento registrado.</Text>}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  section: { ...font.title, fontSize: 18, marginTop: spacing.md, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm, ...font.body, minHeight: 44,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: spacing.xs,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondary: {
    backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.sm,
    alignItems: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.sm,
  },
  secondaryText: { ...font.body, color: colors.primary, fontWeight: '600' },
});

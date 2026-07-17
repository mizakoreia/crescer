import { useState } from 'react';
import { Text, TextInput, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { Screen, Card, Chip } from '../../src/ui';
import {
  useChildId, useAgendaQuery, useAddEventMutation,
  useAddChecklistItemMutation, useUpdateChecklistItemMutation,
} from '../../src/api';
import { colors, spacing, radius, font } from '../../src/theme';

const KINDS = ['consulta', 'vacina', 'rotina', 'evento', 'lembrete'] as const;

export default function Agenda() {
  const childId = useChildId();
  const { data } = useAgendaQuery(childId!, { skip: !childId });
  const [addEvent] = useAddEventMutation();
  const [addItem] = useAddChecklistItemMutation();
  const [updateItem] = useUpdateChecklistItemMutation();

  const [kind, setKind] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [itemName, setItemName] = useState('');

  if (!childId) {
    return <Screen title="Agenda"><Card><Text style={font.body}>Selecione ou crie uma criança primeiro.</Text></Card></Screen>;
  }

  const validWhen = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(when);
  const submitEvent = async () => {
    await addEvent({ child_id: childId, kind: kind!, title, starts_at: new Date(when).toISOString() });
    setKind(null); setTitle(''); setWhen('');
  };

  return (
    <Screen title="Agenda">
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={s.chips}>
          {KINDS.map((k) => <Chip key={k} label={k} active={kind === k} onPress={() => setKind(k)} />)}
        </View>
        {kind && (
          <Card>
            <TextInput style={s.input} placeholder="Título" placeholderTextColor={colors.inkSoft}
              value={title} onChangeText={setTitle} accessibilityLabel="Título do evento" />
            <TextInput style={s.input} placeholder="Quando (AAAA-MM-DD HH:MM)" placeholderTextColor={colors.inkSoft}
              value={when} onChangeText={setWhen} accessibilityLabel="Data e hora" />
            <Pressable style={s.button} onPress={submitEvent} disabled={!title || !validWhen} accessibilityRole="button">
              <Text style={s.buttonText}>Adicionar à agenda</Text>
            </Pressable>
          </Card>
        )}

        {data?.events.map((e) => (
          <Card key={e.id}>
            <Text style={[font.body, { fontWeight: '600' }]}>{e.title}</Text>
            <Text style={font.small}>
              {e.kind} · {new Date(e.starts_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Card>
        ))}
        {data?.events.length === 0 && <Text style={font.small}>Nenhum evento futuro.</Text>}

        <Text style={s.section}>Materiais</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
          <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Novo item (ex.: fraldas)"
            placeholderTextColor={colors.inkSoft} value={itemName} onChangeText={setItemName}
            accessibilityLabel="Novo item de material" />
          <Pressable style={[s.button, { paddingHorizontal: spacing.md }]} disabled={!itemName.trim()}
            onPress={async () => { await addItem({ child_id: childId, name: itemName.trim() }); setItemName(''); }}
            accessibilityRole="button">
            <Text style={s.buttonText}>+</Text>
          </Pressable>
        </View>
        {data?.items.map((i) => (
          <Card key={i.id}>
            <View style={s.row}>
              <Text style={[font.body, { flex: 1, fontWeight: '600' }]}>{i.name}</Text>
              <Chip label={i.low_stock ? 'Baixo estoque' : 'OK'} active={i.low_stock}
                onPress={() => updateItem({ id: i.id, low_stock: !i.low_stock })} />
              <Chip label={i.confirmed ? 'Confirmado' : 'Confirmar'} active={i.confirmed}
                onPress={() => updateItem({ id: i.id, confirmed: !i.confirmed })} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  section: { ...font.title, fontSize: 18, marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.sm, ...font.body, minHeight: 44,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.sm,
    alignItems: 'center', minHeight: 44, justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

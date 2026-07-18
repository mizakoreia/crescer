import { Text, ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Screen, Card, PrivateBadge } from '../../src/ui';
import { useTimelineQuery, TimelineItem } from '../../src/api';
import { CATEGORY_LABEL, formatAmount } from '../../src/format';
import { colors, spacing, font } from '../../src/theme';

// Linha do tempo (§7): história cronológica da criança, não tabela clínica.
// Junta registros do diário e observações; agrupa por dia.
export default function LinhaDoTempo() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { data: items = [], isLoading } = useTimelineQuery(childId!, { skip: !childId });

  // agrupa mantendo a ordem (itens já vêm do mais recente ao mais antigo)
  const groups: { day: string; items: TimelineItem[] }[] = [];
  for (const it of items) {
    const day = new Date(it.at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(it);
    else groups.push({ day, items: [it] });
  }

  const time = (at: string) => new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Screen title="Linha do tempo">
      <ScrollView>
        {!isLoading && items.length === 0 && (
          <Card><Text style={font.body}>A história começa com o primeiro registro.</Text></Card>
        )}

        {groups.map((g) => (
          <View key={g.day}>
            <Text style={s.day}>{g.day}</Text>
            {g.items.map((it) =>
              it.kind === 'observation' ? (
                <Link key={it.id} href={`/observacao/${it.obsId}`} asChild>
                  <Pressable accessibilityRole="button">
                    <Card style={s.obs}>
                      <Text style={s.tag}>✨ Descoberta · {time(it.at)}</Text>
                      <Text style={font.body} numberOfLines={3}>{it.fact}</Text>
                    </Card>
                  </Pressable>
                </Link>
              ) : (
                <Card key={it.id} style={it.category === 'momento_especial' ? s.special : undefined}>
                  <View style={s.head}>
                    <Text style={[font.body, { fontWeight: '600', flex: 1 }]}>
                      {it.category === 'momento_especial' ? '⭐ ' : ''}
                      {CATEGORY_LABEL[it.category!] ?? it.category}
                    </Text>
                    {it.isPrivate && <PrivateBadge />}
                  </View>
                  {it.amount_text ? <Text style={font.body}>{formatAmount(it.category!, it.amount_text)}</Text> : null}
                  {it.note ? <Text style={font.body}>{it.note}</Text> : null}
                  <Text style={font.small}>{time(it.at)}</Text>
                </Card>
              ),
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  day: { ...font.small, fontWeight: '700', color: colors.inkSoft, marginTop: spacing.md, marginBottom: spacing.xs, textTransform: 'capitalize' },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  obs: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  special: { borderColor: colors.accent, borderWidth: 1.5 },
  tag: { ...font.small, color: colors.primary, fontWeight: '600', marginBottom: spacing.xs },
});

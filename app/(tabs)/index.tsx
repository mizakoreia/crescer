import { Text, ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Screen, Card, Chip, CriticalBanner, Avatar } from '../../src/ui';
import { useMyChildrenQuery, useHealthQuery, useDailyRecordsQuery, useObservationsQuery } from '../../src/api';
import { RootState, selectChild } from '../../src/store';
import { supabase } from '../../src/supabase';
import { formatAge, summarizeDay } from '../../src/format';
import { colors, spacing, font } from '../../src/theme';

export default function Hoje() {
  const { data: children = [] } = useMyChildrenQuery();
  const childId = useSelector((s: RootState) => s.session.childId) ?? children[0]?.id ?? null;
  const dispatch = useDispatch();
  const child = children.find((c) => c.id === childId);
  const { data: health } = useHealthQuery(childId!, { skip: !childId });
  const critical = health?.conditions.filter((c) => c.severity === 'critica') ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const { data: records = [] } = useDailyRecordsQuery({ childId: childId!, day: today }, { skip: !childId });
  const daySummary = summarizeDay(records);
  const { data: observations = [] } = useObservationsQuery(childId!, { skip: !childId });
  // "descobertas" = observações já revisadas (nunca rascunho), as 3 mais recentes
  const discoveries = observations.filter((o) => o.review_state !== 'draft').slice(0, 3);
  const photoUri = child?.photo_path
    ? supabase.storage.from('child-photos').getPublicUrl(child.photo_path).data.publicUrl
    : null;

  return (
    <Screen title="Hoje">
      <ScrollView>
        {children.length > 1 && (
          <View style={s.selector}>
            {children.map((c) => (
              <Chip key={c.id} label={c.name} active={c.id === childId}
                onPress={() => dispatch(selectChild(c.id))} />
            ))}
          </View>
        )}

        {child ? (
          <>
            {critical.map((c) => (
              <CriticalBanner key={c.id} text={`${c.name}${c.instruction ? ` — ${c.instruction}` : ''}`} />
            ))}
            <Card style={s.hero}>
              <Avatar uri={photoUri} name={child.name} size={72} />
              <View style={s.heroText}>
                <Text style={font.title} numberOfLines={1}>{child.name}</Text>
                <Text style={[font.body, { color: colors.inkSoft }]}>{formatAge(child.birthdate)}</Text>
              </View>
            </Card>

            <Link href="/diario" asChild>
              <Pressable style={s.cta} accessibilityRole="button">
                <Text style={s.ctaText}>＋ Registrar momento</Text>
              </Pressable>
            </Link>

            <Card>
              <Text style={[font.body, { fontWeight: '600', marginBottom: spacing.sm }]}>Hoje</Text>
              {daySummary.length > 0 ? (
                <View style={s.pills}>
                  {daySummary.map((label) => (
                    <View key={label} style={s.pill}>
                      <Text style={s.pillText}>{label}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={font.small}>O dia ainda está começando. Registre o primeiro momento.</Text>
              )}
            </Card>

            {discoveries.length > 0 && (
              <Card>
                <Text style={[font.body, { fontWeight: '600', marginBottom: spacing.sm }]}>Descobertas recentes</Text>
                {discoveries.map((o) => (
                  <Link key={o.id} href={`/observacao/${o.id}`} asChild>
                    <Pressable style={s.discovery} accessibilityRole="button">
                      <Text style={font.body} numberOfLines={2}>{o.fact}</Text>
                      <Text style={font.small}>
                        {new Date(o.created_at).toLocaleDateString('pt-BR')}
                        {o.review_state === 'shared' ? ' · compartilhada' : ' · revisada'}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </Card>
            )}
            <View style={s.actions}>
              <Link href={`/linha-do-tempo/${child.id}`} asChild>
                <Pressable style={s.action} accessibilityRole="button">
                  <Text style={s.actionText}>Linha do tempo</Text>
                </Pressable>
              </Link>
              <Link href={`/caderno/${child.id}`} asChild>
                <Pressable style={s.action} accessibilityRole="button">
                  <Text style={s.actionText}>Caderno de orientações</Text>
                </Pressable>
              </Link>
              <Link href={`/mural/${child.id}`} asChild>
                <Pressable style={s.action} accessibilityRole="button">
                  <Text style={s.actionText}>Mural de recados</Text>
                </Pressable>
              </Link>
              <Link href={`/saude/${child.id}`} asChild>
                <Pressable style={s.actionHealth} accessibilityRole="button">
                  <Text style={[s.actionText, { color: colors.critical }]}>Saúde e emergência</Text>
                </Pressable>
              </Link>
              <Link href={`/convidar/${child.id}`} asChild>
                <Pressable style={s.action} accessibilityRole="button">
                  <Text style={s.actionText}>Convidar responsável</Text>
                </Pressable>
              </Link>
              <Link href={`/consentimentos/${child.id}`} asChild>
                <Pressable style={s.action} accessibilityRole="button">
                  <Text style={s.actionText}>Consentimentos</Text>
                </Pressable>
              </Link>
              <Link href={`/resumo/${child.id}`} asChild>
                <Pressable style={s.action} accessibilityRole="button">
                  <Text style={s.actionText}>Resumo semanal</Text>
                </Pressable>
              </Link>
            </View>
          </>
        ) : (
          <Card>
            <Text style={font.body}>Nenhuma criança ainda. Crie um perfil ou aceite um convite.</Text>
          </Card>
        )}

        <View style={s.actions}>
          <Link href="/nova-crianca" asChild>
            <Pressable style={s.action} accessibilityRole="button">
              <Text style={s.actionText}>Nova criança</Text>
            </Pressable>
          </Link>
          <Link href="/aceitar-convite" asChild>
            <Pressable style={s.action} accessibilityRole="button">
              <Text style={s.actionText}>Aceitar convite</Text>
            </Pressable>
          </Link>
        </View>

        <Pressable onPress={() => supabase.auth.signOut()} hitSlop={8} accessibilityRole="button">
          <Text style={s.signOut}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroText: { flex: 1 },
  // objeto único (não array): filho direto de <Link asChild> usa Slot
  cta: {
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: spacing.md,
    alignItems: 'center', justifyContent: 'center', minHeight: 56, marginBottom: spacing.sm,
  },
  ctaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    backgroundColor: colors.primarySoft, borderRadius: 999,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  pillText: { ...font.small, color: colors.primary, fontWeight: '600' },
  // objeto único (não array): filho direto de <Link asChild> usa Slot
  discovery: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  selector: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  action: {
    backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center',
  },
  actionText: { ...font.body, color: colors.primary, fontWeight: '600' },
  // objeto único (não array): Link asChild usa Slot, e array de estilos no
  // filho do Slot quebra no react-native-web (CSSStyleDeclaration indexado).
  actionHealth: {
    backgroundColor: colors.criticalBg, borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center',
  },
  signOut: { ...font.small, textAlign: 'center', marginTop: spacing.xl, textDecorationLine: 'underline' },
});

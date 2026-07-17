import { Text, ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { Screen, Card, Chip } from '../../src/ui';
import { useMyChildrenQuery } from '../../src/api';
import { RootState, selectChild } from '../../src/store';
import { supabase } from '../../src/supabase';
import { colors, spacing, font } from '../../src/theme';

export default function Hoje() {
  const { data: children = [] } = useMyChildrenQuery();
  const childId = useSelector((s: RootState) => s.session.childId) ?? children[0]?.id ?? null;
  const dispatch = useDispatch();
  const child = children.find((c) => c.id === childId);

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
            <Card>
              <Text style={[font.body, { fontWeight: '600' }]}>{child.name}</Text>
              <Text style={font.small}>Nascimento: {child.birthdate}</Text>
            </Card>
            <View style={s.actions}>
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
  selector: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.sm },
  action: {
    backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center',
  },
  actionText: { ...font.body, color: colors.primary, fontWeight: '600' },
  signOut: { ...font.small, textAlign: 'center', marginTop: spacing.xl, textDecorationLine: 'underline' },
});

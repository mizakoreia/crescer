import { Text, Switch, View, StyleSheet, Pressable, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card } from '../../src/ui';
import { useConsentsQuery, useGrantConsentMutation, useRevokeConsentMutation, useExportChildDataMutation } from '../../src/api';
import { colors, spacing, font } from '../../src/theme';

// Consentimento granular, por finalidade, com exemplo concreto de efeito (spec §04)
const SCOPES: { scope: string; label: string; hint: string }[] = [
  { scope: 'media', label: 'Fotos', hint: 'A profissional pode anexar fotos aos registros. Sem isso, nenhuma mídia é enviada.' },
  { scope: 'reports', label: 'Relatórios', hint: 'Você recebe o resumo semanal com os registros compartilháveis.' },
  { scope: 'automated_features', label: 'Recursos automáticos', hint: 'Sugestões de narrativa pedagógica, sempre revisadas pela profissional antes de você ver.' },
  { scope: 'notifications', label: 'Notificações', hint: 'Avisos de novos compartilhamentos, sem detalhes sensíveis na tela bloqueada.' },
];

export default function Consentimentos() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { data: consents = [] } = useConsentsQuery(childId!);
  const [grant] = useGrantConsentMutation();
  const [revoke] = useRevokeConsentMutation();
  const [exportData, { isLoading: exporting }] = useExportChildDataMutation();

  const doExport = async () => {
    const res = await exportData(childId!);
    if ('data' in res && res.data) {
      await Share.share({ message: JSON.stringify(res.data, null, 2), title: 'Exportação de dados' });
    }
  };

  const active = (scope: string) => consents.find((c) => c.scope === scope);

  return (
    <Screen title="Consentimentos">
      <Text style={[font.small, { marginBottom: spacing.md }]}>
        Cada permissão é separada e pode ser retirada a qualquer momento, com efeito imediato.
      </Text>
      {SCOPES.map(({ scope, label, hint }) => {
        const c = active(scope);
        return (
          <Card key={scope}>
            <View style={s.row}>
              <Text style={[font.body, { fontWeight: '600', flex: 1 }]}>{label}</Text>
              <Switch
                value={!!c}
                onValueChange={(on) => { if (on) grant({ childId: childId!, scope }); else if (c) revoke(c.id); }}
                trackColor={{ true: colors.primary, false: colors.border }}
                accessibilityLabel={`Consentimento: ${label}`}
              />
            </View>
            <Text style={font.small}>{hint}</Text>
          </Card>
        );
      })}

      <Pressable onPress={doExport} disabled={exporting} hitSlop={8} accessibilityRole="button">
        <Text style={s.export}>{exporting ? 'Exportando…' : 'Exportar todos os dados (LGPD)'}</Text>
      </Pressable>
      <Text style={[font.small, { textAlign: 'center' }]}>
        Para solicitar exclusão definitiva, fale com o suporte — o fluxo é verificável e documentado.
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  export: {
    ...font.body, color: colors.primary, fontWeight: '600', textAlign: 'center',
    marginTop: spacing.lg, marginBottom: spacing.xs, textDecorationLine: 'underline',
  },
});

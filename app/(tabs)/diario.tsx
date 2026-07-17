import { Text, ScrollView, View } from 'react-native';
import { useState } from 'react';
import { Screen, Card, Chip } from '../../src/ui';
import { font, spacing } from '../../src/theme';

const CATEGORIAS = ['alimentacao', 'sono', 'higiene', 'atividade', 'passeio', 'leitura', 'saude', 'observacao'] as const;
const LABEL: Record<string, string> = {
  alimentacao: 'Alimentação', sono: 'Sono', higiene: 'Higiene', atividade: 'Atividade',
  passeio: 'Passeio', leitura: 'Leitura', saude: 'Saúde', observacao: 'Observação',
};

export default function Diario() {
  const [cat, setCat] = useState<string | null>(null);
  return (
    <Screen title="Diário">
      <ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
          {CATEGORIAS.map((c) => (
            <Chip key={c} label={LABEL[c]} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </View>
        <Card>
          <Text style={font.body}>
            {cat ? `Registro de ${LABEL[cat]} — formulário na fase 3.` : 'Toque numa categoria para registrar.'}
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

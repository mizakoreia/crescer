import { Text, ScrollView } from 'react-native';
import { Screen, Card, CriticalBanner } from '../../src/ui';
import { font } from '../../src/theme';

// Hoje: rotina atual, alertas críticos, atalhos, pendências (fase 2+ liga aos dados)
export default function Hoje() {
  return (
    <Screen title="Hoje">
      <ScrollView>
        <CriticalBanner text="Alergias e contatos de emergência ficam aqui, sempre visíveis." />
        <Card>
          <Text style={font.body}>Bem-vinda ao Crescer. Crie o perfil de uma criança para começar.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

import { Text } from 'react-native';
import { Screen, Card } from '../../src/ui';
import { font } from '../../src/theme';

export default function Trabalho() {
  return (
    <Screen title="Trabalho">
      <Card>
        <Text style={font.body}>Horas, despesas e pagamentos (fase 5).</Text>
      </Card>
    </Screen>
  );
}

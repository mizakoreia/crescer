import { Text } from 'react-native';
import { Screen, Card } from '../../src/ui';
import { font } from '../../src/theme';

export default function Agenda() {
  return (
    <Screen title="Agenda">
      <Card>
        <Text style={font.body}>Eventos, lembretes e checklist de materiais (fase 5).</Text>
      </Card>
    </Screen>
  );
}

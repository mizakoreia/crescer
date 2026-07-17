import { Text } from 'react-native';
import { Screen, Card } from '../../src/ui';
import { font } from '../../src/theme';

// História: perfil vivo + observações de desenvolvimento (fase 3/3b)
export default function Historia() {
  return (
    <Screen title="História">
      <Card>
        <Text style={font.body}>Perfil vivo e observações de desenvolvimento aparecem aqui.</Text>
      </Card>
    </Screen>
  );
}

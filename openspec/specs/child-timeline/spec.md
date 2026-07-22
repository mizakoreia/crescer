# child-timeline (RF-11)

## Purpose
Transformar registros cotidianos em uma memória organizada da infância — história
individual da criança, não tabela clínica.

## Requirements

### Requirement: Composição cronológica
A linha do tempo SHALL reunir registros do diário, observações revisadas e (quando houver) mídia, ordenados do mais recente ao mais antigo e agrupados por dia.

#### Scenario: Registro e descoberta no mesmo dia
- **WHEN** existem, no mesmo dia, um registro de diário e uma observação revisada
- **THEN** ambos aparecem sob o cabeçalho daquele dia, em ordem de horário, com a observação identificada como descoberta

### Requirement: Momento especial
O adulto SHALL poder marcar um registro como "momento especial"; esses itens têm destaque visual na linha do tempo.

#### Scenario: Momento especial destacado
- **WHEN** um registro é da categoria "momento especial"
- **THEN** ele aparece com destaque visual distinto na linha do tempo

### Requirement: Privacidade preservada
Itens privados (visibilidade `private_professional`) SHALL aparecer apenas para quem tem autorização; NUNCA em materiais compartilhados ou álbuns.

#### Scenario: Privado fora do compartilhável
- **WHEN** um álbum ou material compartilhado é montado a partir da linha do tempo
- **THEN** itens `private_professional` não são incluídos

### Requirement: Navegação
A visualização SHALL permitir localizar acontecimentos antigos e acessar o detalhe de uma observação a partir da linha do tempo.

#### Scenario: Abrir detalhe da observação
- **WHEN** o adulto toca em uma descoberta na linha do tempo
- **THEN** o detalhe da observação é aberto

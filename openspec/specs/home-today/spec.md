# home-today (RF-10)

## Purpose
Tela inicial afetiva: na primeira visita o adulto entende que o app é uma
ferramenta de cuidado, observação e memória — não um rastreador de rotina.

## Requirements

### Requirement: Cabeçalho da criança
A tela SHALL abrir com foto (ou inicial do nome quando sem foto), nome e idade em linguagem natural, calculada da data de nascimento.

#### Scenario: Cabeçalho afetivo
- **WHEN** o adulto abre a tela inicial de uma criança
- **THEN** vê a foto (ou inicial), o nome e a idade em linguagem natural

### Requirement: Ação principal em destaque
A tela SHALL ter um único botão primário "Registrar momento" visualmente dominante sobre as ações secundárias.

#### Scenario: Botão principal identificável
- **WHEN** o adulto olha a tela inicial
- **THEN** o botão "Registrar momento" é o elemento de ação mais evidente

### Requirement: Resumo do dia sem IA
A tela SHALL compor um resumo do dia a partir dos registros do dia atual (contagem por categoria, em linguagem afetiva), sem chamar IA. Sem registros, SHALL mostrar estado vazio gentil.

#### Scenario: Resumo a partir dos registros
- **WHEN** há dois registros de alimentação e um de passeio hoje
- **THEN** o resumo mostra "2 refeições" e "1 passeio", sem chamar IA

#### Scenario: Dia sem registros
- **WHEN** ainda não há registros no dia
- **THEN** um estado vazio gentil convida ao primeiro registro

### Requirement: Descobertas recentes
A tela SHALL destacar as observações mais recentes já revisadas (nunca rascunho), cada uma com acesso ao detalhe. Sem descobertas, o cartão fica oculto.

#### Scenario: Só observações revisadas
- **WHEN** existe uma observação em rascunho e outra revisada
- **THEN** apenas a revisada aparece em "Descobertas recentes"

### Requirement: Alertas críticos primeiro
Condições de saúde críticas SHALL aparecer como alerta persistente acima de qualquer outro conteúdo.

#### Scenario: Alerta acima de tudo
- **WHEN** a criança tem uma alergia crítica cadastrada
- **THEN** o alerta aparece no topo, antes do cabeçalho e dos cartões

### Requirement: Sem excesso
A tela SHALL evitar mostrar muita informação simultânea; cartões sem conteúdo não aparecem.

#### Scenario: Cartão vazio oculto
- **WHEN** não há descobertas revisadas
- **THEN** o cartão de descobertas não é renderizado

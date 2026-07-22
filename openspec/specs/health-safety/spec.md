# health-safety (RF-05)

## Purpose
Alergias, medicamentos, contatos de emergência. Zero ambiguidade, zero perda de histórico.

## Requirements

### Requirement: Alergias
Alergias/restrições SHALL ser fornecidas pela família (guardian), com severidade e conduta. Alerta visual persistente em telas de cuidado.

#### Scenario: Alerta persistente
- **WHEN** existe uma alergia crítica cadastrada
- **THEN** um alerta é exibido de forma persistente nas telas de cuidado

### Requirement: Autorização de medicamento
Registrar administração SHALL exigir autorização ativa do guardian (nome, dose, horário, instrução). Sem autorização ativa, o servidor SHALL rejeitar (regra de domínio validada no backend, não só UI).

#### Scenario: Sem autorização, sem registro
- **WHEN** profissional tenta registrar administração sem autorização ativa
- **THEN** o servidor rejeita a operação

#### Scenario: Com autorização, registro permitido
- **WHEN** o guardian tem autorização ativa e o profissional registra a administração
- **THEN** o registro é aceito

### Requirement: Histórico imutável
Administrações SHALL ser append-only. Correção somente por adendo referenciando o registro original.

#### Scenario: Correção por adendo
- **WHEN** um registro de administração precisa ser corrigido
- **THEN** um adendo é criado referenciando o original, que permanece intacto

### Requirement: Emergência rápida
Contatos de emergência SHALL ser acessíveis em ≤2 toques da tela inicial.

#### Scenario: Acesso rápido
- **WHEN** o cuidador precisa de um contato de emergência a partir da tela inicial
- **THEN** ele o alcança em no máximo dois toques

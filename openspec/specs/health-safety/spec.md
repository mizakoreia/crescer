# health-safety (RF-05)

## Purpose
Alergias, medicamentos, contatos de emergência. Zero ambiguidade, zero perda de histórico.

## Requirements

### Requirement: Alergias
Alergias/restrições SHALL ser fornecidas pela família (guardian), com severidade e conduta. Alerta visual persistente em telas de cuidado.

### Requirement: Autorização de medicamento
Registrar administração SHALL exigir autorização ativa do guardian (nome, dose, horário, instrução). Sem autorização ativa, banco SHALL rejeitar (constraint/trigger, não só UI).

### Requirement: Histórico imutável
Administrações SHALL ser append-only. Correção somente por adendo referenciando o registro original.

### Requirement: Emergência rápida
Contatos de emergência SHALL ser acessíveis em ≤2 toques da tela inicial.

#### Scenario: Sem autorização, sem registro
- **WHEN** profissional tenta registrar administração sem autorização ativa
- **THEN** insert falha no banco

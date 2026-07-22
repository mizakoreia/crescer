# access-control (RF-01)

## Purpose
Contas, papéis, convites e vínculos por criança. Fundação de toda autorização.

## Requirements

### Requirement: Papéis
Sistema SHALL suportar papéis `professional` e `guardian` (responsável legal) por vínculo.

#### Scenario: Papel define permissões
- **WHEN** um usuário é vinculado a uma criança com papel `guardian`
- **THEN** ele recebe as permissões de responsável (ex.: autorizar medicamento, gerenciar consentimentos), distintas das de `professional`

### Requirement: Convite
Profissional SHALL convidar responsável por link/e-mail com token de uso único e expiração (7 dias). Aceite cria `care_link` pendente de consentimentos.

#### Scenario: Aceite de convite cria vínculo
- **WHEN** o responsável abre um convite válido e não expirado e o aceita
- **THEN** um `care_link` é criado e o token não pode ser reutilizado

#### Scenario: Convite expirado
- **WHEN** o responsável tenta aceitar um convite após 7 dias
- **THEN** o servidor rejeita o aceite

### Requirement: Vínculo por criança
Todo acesso a dados de criança SHALL exigir `care_link` ativo (não revogado, não expirado) — imposto no servidor (autorização em toda requisição da API), nunca só na UI.

#### Scenario: Sem vínculo, sem acesso
- **WHEN** usuário sem `care_link` ativo consulta qualquer dado da criança
- **THEN** a API nega o acesso (nenhum dado retorna)

### Requirement: Revogação imediata
Revogar vínculo SHALL bloquear novas consultas imediatamente (o servidor reavalia a autorização a cada requisição).

#### Scenario: Acesso cessa ao revogar
- **WHEN** um vínculo é revogado e o usuário faz uma nova requisição
- **THEN** a requisição é negada, sem carência

### Requirement: Auditoria
Ações sensíveis (convite, aceite, revogação, consentimento, medicamento, relatório, exportação) SHALL gravar em log append-only.

#### Scenario: Ação sensível auditada
- **WHEN** um responsável autoriza um medicamento
- **THEN** um registro de auditoria imutável é gravado com autor, criança e ação

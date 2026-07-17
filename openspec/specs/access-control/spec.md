# access-control (RF-01)

## Purpose
Contas, papéis, convites e vínculos por criança. Fundação de toda autorização.

## Requirements

### Requirement: Papéis
Sistema SHALL suportar papéis `professional` e `guardian` (responsável legal) por vínculo.

### Requirement: Convite
Profissional SHALL convidar responsável por link/e-mail com token de uso único e expiração (7 dias). Aceite cria `care_link` pendente de consentimentos.

### Requirement: Vínculo por criança
Todo acesso a dados de criança SHALL exigir `care_link` ativo (não revogado, não expirado) — imposto por RLS no banco.

### Requirement: Revogação imediata
Revogar vínculo SHALL bloquear novas consultas imediatamente (RLS reavalia por query).

### Requirement: Auditoria
Ações sensíveis (convite, aceite, revogação, consentimento, medicamento, relatório, exportação) SHALL gravar em `audit_log` append-only.

#### Scenario: Sem vínculo, sem acesso
- **WHEN** usuário sem care_link ativo consulta qualquer tabela da criança
- **THEN** zero linhas retornam

# consent-privacy (transversal)

## Purpose
Consentimento granular, versionado, auditável. LGPD by design.

## Requirements

### Requirement: Escopos
Consentimentos SHALL ser separados por finalidade: `media`, `reports`, `automated_features`, `notifications`. Cada um: guardian, versão do texto, data, revogação.

### Requirement: Revogação prospectiva
Revogar SHALL ter efeito imediato em novos usos; conteúdo já compartilhado segue política de retenção.

### Requirement: Exportação e exclusão
Guardian SHALL poder exportar dados da criança em formato legível e solicitar exclusão.

### Requirement: Mídia off por padrão
Upload/compartilhamento de mídia SHALL exigir consentimento `media` ativo.

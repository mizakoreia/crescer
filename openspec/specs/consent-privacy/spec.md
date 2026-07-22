# consent-privacy (transversal)

## Purpose
Consentimento granular, versionado, auditável. LGPD by design.

## Requirements

### Requirement: Escopos
Consentimentos SHALL ser separados por finalidade: `media`, `reports`, `automated_features`, `notifications`. Cada um: guardian, versão do texto, data, revogação.

#### Scenario: Consentimento por finalidade
- **WHEN** o responsável concede `reports` mas não `automated_features`
- **THEN** relatórios podem ser compartilhados, mas recursos de IA permanecem indisponíveis

### Requirement: Revogação prospectiva
Revogar SHALL ter efeito imediato em novos usos; conteúdo já compartilhado segue política de retenção.

#### Scenario: Revogação bloqueia novos usos
- **WHEN** o responsável revoga o consentimento `media`
- **THEN** novos uploads/compartilhamentos de mídia são bloqueados imediatamente

### Requirement: Exportação e exclusão
Guardian SHALL poder exportar dados da criança em formato legível e solicitar exclusão.

#### Scenario: Exportar dados
- **WHEN** o responsável solicita a exportação
- **THEN** recebe os dados da criança em formato legível

### Requirement: Mídia off por padrão
Upload/compartilhamento de mídia SHALL exigir consentimento `media` ativo. Fotos e vídeos SHALL ser privados por padrão (nunca públicos).

#### Scenario: Sem consentimento, sem mídia
- **WHEN** um cuidador tenta subir uma foto sem consentimento `media` ativo
- **THEN** o servidor rejeita o upload

### Requirement: Transparência de acesso
A família SHALL poder visualizar quem tem acesso à criança e revogar acessos. Acessos relevantes SHALL ser registrados de forma auditável.

#### Scenario: Ver e revogar acesso
- **WHEN** o responsável abre a lista de vínculos
- **THEN** vê quem tem acesso e pode revogar qualquer vínculo

### Requirement: Sem uso para treino de IA
Imagens e dados da criança SHALL NÃO ser usados para treinar modelos de IA sem consentimento específico. Dados pessoais SHALL ser separados dos dados usados para geração de texto.

#### Scenario: Prompt sem PII desnecessária
- **WHEN** uma geração de texto por IA é preparada
- **THEN** o conteúdo enviado exclui dados pessoais não essenciais e nada é retido para treino sem consentimento

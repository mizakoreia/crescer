# weekly-report (RF-08)

## Purpose
Resumo semanal editável + PDF, só com conteúdo autorizado.

## Requirements

### Requirement: Composição
Sistema SHALL compor resumo do período a partir de registros elegíveis (visibilidade shareable/shared + consentimento de relatório ativo). Seções: rotina, experiências, observações, conquistas, próximos convites ao brincar.

### Requirement: Revisão obrigatória
Compartilhar SHALL exigir revisão humana explícita. Estado: rascunho → revisado → compartilhado, versionado.

### Requirement: PDF
PDF gerado via Edge Function: identidade visual simples, data, autoria, apenas mídia autorizada. Link com expiração.

#### Scenario: Nota privada fora do PDF
- **WHEN** relatório composto
- **THEN** entradas private_professional ausentes da composição e do PDF

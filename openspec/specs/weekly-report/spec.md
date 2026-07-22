# weekly-report (RF-08)

## Purpose
Resumo semanal editável + PDF, só com conteúdo autorizado.

## Requirements

### Requirement: Composição
Sistema SHALL compor resumo do período a partir de registros elegíveis (visibilidade shareable/shared + consentimento de relatório ativo). Seções: rotina, experiências, observações, conquistas, próximos convites ao brincar.

#### Scenario: Nota privada fora da composição
- **WHEN** o relatório é composto
- **THEN** entradas `private_professional` estão ausentes da composição e do PDF

### Requirement: Revisão obrigatória
Compartilhar SHALL exigir revisão humana explícita. Estado: rascunho → revisado → compartilhado, versionado.

#### Scenario: Revisão antes de compartilhar
- **WHEN** um relatório é composto automaticamente
- **THEN** ele nasce como rascunho e só é compartilhado após revisão humana explícita

### Requirement: PDF
PDF gerado server-side (job assíncrono) SHALL ter identidade visual simples, data, autoria e apenas mídia autorizada, com link de expiração.

#### Scenario: Gerar PDF
- **WHEN** um relatório revisado é exportado
- **THEN** um PDF é gerado server-side com data, autoria e link que expira

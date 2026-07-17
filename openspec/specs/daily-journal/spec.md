# daily-journal (RF-04)

## Purpose
Diário rápido: registrar um dia típico em ≤3 minutos.

## Requirements

### Requirement: Categorias
Entradas SHALL suportar categorias: alimentação, sono, higiene, atividade, passeio, leitura, saúde, observação. Campos: horário, quantidade/duração quando aplicável, texto livre, tags.

### Requirement: Visibilidade separada
Cada entrada SHALL ser `private_professional` ou `shareable_after_review`. Notas privadas NUNCA aparecem para família, em resumos, PDFs, notificações ou prompts de IA.

### Requirement: Estados
Entrada SHALL transitar rascunho → concluído → compartilhado. Autosave em rascunho.

### Requirement: Resumo do dia
Sistema SHALL compor resumo do dia editável antes de compartilhar.

#### Scenario: Nota privada invisível para família
- **WHEN** responsável consulta registros do dia
- **THEN** entradas private_professional não retornam (RLS)

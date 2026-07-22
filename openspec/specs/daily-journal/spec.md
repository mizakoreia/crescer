# daily-journal (RF-04)

## Purpose
Diário rápido: registrar um dia típico em ≤3 minutos.

## Requirements

### Requirement: Categorias
Entradas SHALL suportar categorias: alimentação, mamadeira, água, sono, fralda, higiene, humor, atividade, passeio, leitura, saúde, observação, momento especial. Medicamento NÃO é categoria do diário — administração passa pelo módulo de saúde com autorização.

#### Scenario: Registro por categoria
- **WHEN** o cuidador escolhe "sono" e informa a duração
- **THEN** um registro de sono é criado com horário e duração

### Requirement: Campos por categoria
Cada categoria SHALL mostrar apenas os campos pertinentes: quantidade em ml (mamadeira, água), quantidade/porção (alimentação), estado de humor (humor), tipo (fralda), duração em minutos (sono, atividade, passeio, leitura). Horário atual é preenchido automaticamente e pode ser alterado.

#### Scenario: Campo contextual
- **WHEN** o cuidador escolhe "mamadeira"
- **THEN** um campo de quantidade em ml é oferecido, e não o campo de duração

### Requirement: Registro mínimo
Um registro rápido SHALL poder ser concluído com poucos toques — só quantidade ou humor, sem texto livre obrigatório.

#### Scenario: Registro sem texto
- **WHEN** o cuidador registra "água 50 ml" sem escrever observação
- **THEN** o registro é concluído normalmente

### Requirement: Visibilidade separada
Cada entrada SHALL ser `private_professional` ou `shareable_after_review`. Notas privadas NUNCA aparecem para família, em resumos, PDFs, notificações ou prompts de IA.

#### Scenario: Nota privada invisível para família
- **WHEN** responsável consulta registros do dia
- **THEN** entradas `private_professional` não retornam (autorização server-side)

### Requirement: Estados
Entrada SHALL transitar rascunho → concluído → compartilhado. Autosave em rascunho.

#### Scenario: Autosave em rascunho
- **WHEN** o cuidador digita e para
- **THEN** o rascunho é salvo automaticamente e pode ser retomado

### Requirement: Resumo do dia
Sistema SHALL compor resumo do dia editável antes de compartilhar.

#### Scenario: Resumo composto
- **WHEN** há vários registros no dia
- **THEN** o sistema compõe um resumo editável a partir deles

# family-communication (RF-13)

## Purpose
Centralizar recados entre família e cuidador, reduzindo ruído de comunicação —
mural com autoria e histórico.

## Requirements

### Requirement: Mural de recados
Pessoas com vínculo ativo SHALL poder publicar recados sobre a criança; todos os vinculados leem o mural.

#### Scenario: Publicar recado
- **WHEN** um responsável publica um recado
- **THEN** ele aparece no mural para os demais vinculados

### Requirement: Autoria preservada
Cada recado SHALL exibir quem escreveu e quando. O nome do autor é preservado no recado mesmo que perfis não sejam legíveis entre usuários.

#### Scenario: Recado com autoria
- **WHEN** um recado é publicado
- **THEN** ele mostra o nome do autor e o horário

### Requirement: Histórico imutável
O mural SHALL ser append-only: recados não são editados nem apagados, preservando o histórico da comunicação.

#### Scenario: Recado permanece
- **WHEN** um recado já publicado
- **THEN** ele não pode ser editado nem apagado e permanece no histórico

### Requirement: Acesso por vínculo
Publicar e ler SHALL exigir vínculo ativo com a criança (autorização server-side).

#### Scenario: Sem vínculo, sem mural
- **WHEN** um usuário sem vínculo ativo tenta ler ou publicar no mural
- **THEN** a operação é negada

# schedule-supplies (RF-06)

## Purpose
Calendário, lembretes e checklist de materiais por criança.

## Requirements

### Requirement: Eventos
Eventos SHALL suportar: consulta, vacina (informativa), rotina, evento, lembrete; com data/hora, recorrência simples e criança relacionada.

#### Scenario: Criar evento
- **WHEN** o cuidador cria uma consulta com data e hora
- **THEN** o evento aparece na agenda da criança

### Requirement: Materiais
Checklist de materiais por criança SHALL suportar itens recorrentes e flag de baixo estoque, com confirmação simples entre profissional e família (visibilidade `shared`).

#### Scenario: Baixo estoque sinalizado
- **WHEN** um item de material é marcado como baixo estoque
- **THEN** a sinalização fica visível para profissional e família

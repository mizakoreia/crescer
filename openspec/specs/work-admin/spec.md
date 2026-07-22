# work-admin (RF-07)

## Purpose
Horas, despesas e pagamentos do profissional. Visibilidade `administrative`.

## Requirements

### Requirement: Período de trabalho
Registro de período SHALL ter início, fim, pausas (minutos) e flag de hora extra.

#### Scenario: Fechar período
- **WHEN** o profissional encerra um período iniciado
- **THEN** o período fica com início, fim e pausas registrados

### Requirement: Despesas
Sistema SHALL registrar despesas (transporte e outras) com valor e descrição.

#### Scenario: Registrar despesa
- **WHEN** o profissional adiciona uma despesa de transporte com valor
- **THEN** a despesa é registrada e listada no período

### Requirement: Status de pagamento
Pagamento SHALL seguir o fluxo pendente → conferido → pago, com confirmação das duas partes.

#### Scenario: Confirmação das duas partes
- **WHEN** profissional e responsável confirmam um pagamento
- **THEN** o status avança de forma consistente até "pago"

### Requirement: Exportação mensal
Sistema SHALL permitir exportação simples (CSV) do mês por vínculo.

#### Scenario: Exportar CSV
- **WHEN** o profissional exporta o mês
- **THEN** recebe um CSV com períodos e despesas do vínculo

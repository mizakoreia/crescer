# guidance-notebook (RF-12)

## Purpose
Organizar orientações que normalmente ficam espalhadas em mensagens — o "caderno"
da criança, datado, com autoria e confirmação de leitura.

## Requirements

### Requirement: Seções
Orientações SHALL ser organizadas por seção: geral, alimentação, sono, higiene, conforto, rotina, preferências, saúde, passeios, telas e mídia, contatos.

#### Scenario: Criar orientação em seção
- **WHEN** o adulto cria uma orientação na seção "sono"
- **THEN** ela aparece no caderno associada a essa seção

### Requirement: Autoria e data
Cada orientação SHALL registrar autor e data de criação; alterações preservam histórico (a orientação antiga não substitui a nova silenciosamente).

#### Scenario: Autoria registrada
- **WHEN** uma orientação é criada
- **THEN** ela exibe quem a escreveu e quando

### Requirement: Importância e validade
Uma orientação SHALL poder ser marcada como importante (destaque) e opcionalmente ter prazo de validade.

#### Scenario: Orientação importante em destaque
- **WHEN** uma orientação é marcada como importante
- **THEN** ela recebe destaque visual sobre as demais

### Requirement: Confirmação de leitura
Qualquer pessoa com vínculo ativo SHALL poder confirmar a leitura de uma orientação; o sistema mostra quantas pessoas confirmaram e se o usuário atual já confirmou.

#### Scenario: Confirmar leitura
- **WHEN** um cuidador abre uma orientação e confirma a leitura
- **THEN** a confirmação é gravada uma única vez por usuário e o contador de leituras reflete a confirmação

### Requirement: Não é fonte médica
O caderno é informativo. Medicamento e alergia SHALL continuar sob o módulo de saúde, com suas travas — o caderno NÃO autoriza administração nem substitui esses registros.

#### Scenario: Caderno não autoriza medicamento
- **WHEN** existe uma orientação na seção "saúde" sobre um remédio
- **THEN** ela é apenas informativa e não habilita registrar administração fora do módulo de saúde

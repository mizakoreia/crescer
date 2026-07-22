# child-profile (RF-02 + RF-03)

## Purpose
Cadastro da criança e perfil vivo versionado.

## Requirements

### Requirement: Cadastro
Criança SHALL ter: nome, nome pelo qual é chamada, data de nascimento, foto opcional, pronome opcional, relação do usuário com a criança, responsáveis, contatos de emergência, alergias/restrições, medicamentos autorizados, rotina aproximada, preferências e formas de conforto, observações da família.

#### Scenario: Criar perfil
- **WHEN** um usuário cria uma criança com nome e data de nascimento
- **THEN** o perfil é criado, o criador recebe vínculo, e é possível ter mais de uma criança, cada uma com seus próprios registros

### Requirement: Foto e idade
Onde a criança é apresentada, o sistema SHALL exibir a foto (ou a inicial do nome quando ausente) e a idade em linguagem natural calculada da data de nascimento. Alterações de informações relevantes SHALL registrar quem inseriu/alterou.

#### Scenario: Idade em linguagem natural
- **WHEN** a criança tem 28 meses
- **THEN** a idade exibida é "2 anos e 4 meses", não uma data crua

### Requirement: Campos sensíveis diferenciados
Informações críticas (alergias, medicação) SHALL usar visibilidade `critical_care` — acessíveis a cuidadores autorizados, com destaque visual persistente.

#### Scenario: Alergia crítica em destaque
- **WHEN** um cuidador autorizado abre a criança com alergia crítica cadastrada
- **THEN** um alerta persistente é exibido nas telas de cuidado

### Requirement: Perfil vivo
Seções: personalidade, preferências, temperamento, interesses, comunicação, habilidades, desafios, conquistas. Cada atualização SHALL gravar autor + data; histórico preservado (append, sem sobrescrever).

#### Scenario: Atualização não sobrescreve
- **WHEN** profissional atualiza a seção "interesses"
- **THEN** entrada nova é criada; as anteriores permanecem consultáveis

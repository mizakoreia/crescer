# child-profile (RF-02 + RF-03)

## Purpose
Cadastro da criança e perfil vivo versionado.

## Requirements

### Requirement: Cadastro
Criança SHALL ter: nome social/apelido, data de nascimento, foto opcional, pronome opcional, responsáveis, contatos de emergência, alergias/restrições, rotina.

### Requirement: Campos sensíveis diferenciados
Informações críticas (alergias, medicação) SHALL usar visibilidade `critical_care` — acessíveis a cuidadores autorizados, destaque visual persistente.

### Requirement: Perfil vivo
Seções: personalidade, preferências, temperamento, interesses, comunicação, habilidades, desafios, conquistas. Cada atualização SHALL gravar autor + data; histórico preservado (append, sem sobrescrever).

#### Scenario: Atualização não sobrescreve
- **WHEN** profissional atualiza seção "interesses"
- **THEN** entrada nova criada; anteriores permanecem consultáveis

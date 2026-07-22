# pedagogical-enrichment (RF-09)

## Purpose
Transformar pequenos acontecimentos em evidências do desenvolvimento infantil — o diferencial central.

Exemplo canônico: "Brincamos de blocos" → "Hoje Olivia explorou diferentes formas de empilhar blocos. Demonstrou persistência ao tentar equilibrá-los e comemorou quando conseguiu. Essa brincadeira pode favorecer coordenação motora fina, percepção espacial, resolução de problemas e autonomia."

## Requirements

### Requirement: Modelo de observação
Narrativa SHALL seguir o modelo: fato observado → contexto → iniciativa/estratégias → possíveis domínios → continuidade (convite ao brincar).

#### Scenario: Estrutura da narrativa
- **WHEN** uma observação é composta
- **THEN** ela apresenta fato, contexto, possíveis domínios e um convite de continuidade, claramente diferenciados

### Requirement: Observação manual
O adulto SHALL poder criar uma observação à mão, sem IA, separando fato de interpretação de continuidade. A UI SHALL orientar linguagem hipotética ("pareceu", "vale acompanhar") e desencorajar diagnóstico/comparação. Observação manual tem origin=manual e não consome IA.

#### Scenario: Observação sem IA
- **WHEN** o adulto preenche fato e interpretação à mão e salva
- **THEN** a observação é criada com origin=manual, sem chamada de IA

### Requirement: Gate de consentimento
Recurso assistido por IA SHALL só existir com consentimento `automated_features` ativo do guardian. Sem consentimento, o botão nem aparece.

#### Scenario: Sem consentimento, sem IA
- **WHEN** não há consentimento `automated_features` ativo
- **THEN** a ação de enriquecer por IA não é oferecida

### Requirement: Prompt limpo
Prompt SHALL conter apenas conteúdo compartilhável + faixa etária aproximada + interesses do perfil vivo. Notas privadas NUNCA entram.

#### Scenario: Nota privada fora do prompt
- **WHEN** existem notas privadas entre os registros de origem
- **THEN** elas não são incluídas no prompt enviado à IA

### Requirement: Linguagem
Saída SHALL usar linguagem hipotética ("pode favorecer", "oferece oportunidade"). PROIBIDO: diagnóstico, comparação, score, "atrasado"/"avançado", inventar eventos/falas/emoções.

#### Scenario: Linguagem não diagnóstica
- **WHEN** a narrativa é gerada
- **THEN** ela usa termos hipotéticos e não contém diagnóstico, comparação ou score

### Requirement: Revisão humana
Saída SHALL nascer como rascunho editável (origin=assisted, com referências aos registros de origem). Compartilhar exige revisão explícita.

#### Scenario: Rascunho antes de compartilhar
- **WHEN** a IA gera uma narrativa
- **THEN** ela nasce como rascunho editável e só é compartilhada após revisão explícita

### Requirement: Baixa confiança
Registro curto demais → sistema SHALL sinalizar baixa confiança em vez de inventar detalhe.

#### Scenario: Registro curto
- **WHEN** os registros de origem são muito curtos
- **THEN** o sistema sinaliza baixa confiança e não inventa detalhes

#### Scenario: Exemplo canônico
- **WHEN** profissional enriquece "Brincamos de blocos" (criança 18m, interesse: empilhar)
- **THEN** a narrativa traz estratégias observáveis + "pode favorecer..." + convite de continuidade; nada inventado além do registro

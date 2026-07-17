# pedagogical-enrichment (RF-09)

## Purpose
Transformar pequenos acontecimentos em evidências do desenvolvimento infantil — o diferencial central.

Exemplo canônico: "Brincamos de blocos" → "Hoje Olivia explorou diferentes formas de empilhar blocos. Demonstrou persistência ao tentar equilibrá-los e comemorou quando conseguiu. Essa brincadeira pode favorecer coordenação motora fina, percepção espacial, resolução de problemas e autonomia."

## Requirements

### Requirement: Modelo de observação
Narrativa SHALL seguir doc 03: fato observado → contexto → iniciativa/estratégias → possíveis domínios → continuidade (convite ao brincar).

### Requirement: Gate de consentimento
Recurso SHALL só existir com consentimento `automated_features` ativo do guardian. Sem consentimento, botão nem aparece.

### Requirement: Prompt limpo
Prompt SHALL conter apenas conteúdo compartilhável + faixa etária aproximada + interesses do perfil vivo. Notas privadas NUNCA entram.

### Requirement: Linguagem
Saída SHALL usar linguagem hipotética ("pode favorecer", "oferece oportunidade"). PROIBIDO: diagnóstico, comparação, score, "atrasado"/"avançado", inventar eventos/falas/emoções.

### Requirement: Revisão humana
Saída SHALL nascer como rascunho editável em `pedagogical_observations` (origin=assisted, refs aos registros de origem). Compartilhar exige revisão explícita.

### Requirement: Baixa confiança
Registro curto demais → sistema SHALL sinalizar baixa confiança em vez de inventar detalhe.

#### Scenario: Exemplo canônico
- **WHEN** profissional enriquece "Brincamos de blocos" (criança 18m, interesse: empilhar)
- **THEN** narrativa com estratégias observáveis + "pode favorecer..." + convite de continuidade; nada inventado além do registro

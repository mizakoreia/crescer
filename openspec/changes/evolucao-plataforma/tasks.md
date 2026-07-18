# Tasks — Evolução para plataforma

Ordem = maior impacto / menor custo / menor risco de banco primeiro.
Legenda: 💚 grátis · 💛 pago por uso (Claude API/transcrição) · ⚠️ exige migration.

## Fase 1 — Alma do produto (💚, sem IA)
- [x] 1.1 Tela "Hoje" afetiva: foto + nome + idade calculada da `birthdate` (§2)
- [x] 1.2 Cartão "resumo do dia" compondo `daily_records` de hoje (sem IA)
- [x] 1.3 Cartão "Descobertas recentes" = últimas observações revisadas
- [ ] 1.4 Botão principal único "Registrar momento" em destaque
- [ ] 1.5 Foto: bucket Storage + upload + grava `photo_path` (respeita consent `media`)
- [ ] 1.6 Exibir foto na Hoje e no topo do perfil

## Fase 2 — Registro mais rico (💚, ⚠️ migration)
- [ ] 2.1 Migration: ampliar CHECK de `daily_records.category` (fralda, mamadeira,
       agua, humor, medicamento, momento_especial) (§4)
- [ ] 2.2 Atualizar união TS `CATEGORIAS` + `LABEL` no diário
- [ ] 2.3 Campos mínimos por categoria (ex.: quantidade em água/mamadeira)
- [ ] 2.4 Form manual de Observação com fato / interpretação / continuidade
       separados, linguagem hipotética (§5) — sem gastar token

## Fase 3 — Memória e comunicação (💚, tabela nova + RLS)
- [ ] 3.1 Linha do tempo: view cronológica de registros + mídia + observações (§7)
- [ ] 3.2 Marcar registro como "momento especial"; privados fora de compartilháveis
- [ ] 3.3 Caderno de orientações: tabela + RLS + tela + confirmação de leitura (§11)
- [ ] 3.4 Mural/recados família com histórico e autoria (§10)

## Fase 4 — IA (💛 pago, só depois de validar Fases 1–3)
- [ ] 4.1 Deploy das 3 Edge Functions existentes (enrich/PDF/export)
- [ ] 4.2 Relato do dia com IA: tom selecionável, revisão obrigatória, WhatsApp/PDF (§6)
- [ ] 4.3 Descobertas/padrões com rastreabilidade aos registros de origem (§8)
- [ ] 4.4 Sugestões de atividade com alertas de segurança (§9)
- [ ] 4.5 Registro por voz → transcrição → texto editável (§4)

## Fase 5 — Expansão (💚, futuro)
- [ ] 5.1 Álbum/retrospectiva com curadoria manual (§13)
- [ ] 5.2 Documentação pedagógica estruturada / portfólio (§12)

## Transversal (a cada fase)
- [ ] T.1 Nada de linguagem de desempenho/diagnóstico na UI (§16)
- [ ] T.2 RLS testada antes de expor qualquer dado sensível novo
- [ ] T.3 Aviso "não substitui pediatra" onde a IA aparece (§15)

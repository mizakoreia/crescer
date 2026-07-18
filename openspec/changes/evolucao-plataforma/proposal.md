# Evolução: de rastreador para plataforma de acompanhamento

## Why
A spec de evolução do cliente pede uma mudança de percepção: o app não pode
parecer "mais um rastreador de rotina infantil". Deve ajudar adultos a
**perceber, compreender com cuidado e preservar a história de quem a criança
está se tornando** (spec §1, §16). Hoje a primeira tela ("Hoje") é um menu de
botões — trai esse sentimento logo na entrada.

## Descoberta importante (banco já suporta)
Auditando `supabase/migrations/0001_init.sql`, boa parte da Fase 2 da spec **já
existe no dado, sem UI**:
- `children.photo_path` e `children.routine_notes` — nunca lidos/escritos.
- Tabela `media_assets` + trigger que exige consentimento `media` — sem upload/UI.
- `pedagogical_observations` já separa `fact` / `interpretation` / `continuity`
  / `low_confidence` — exatamente a separação fato≠interpretação da spec §5,
  mas só a IA preenche hoje (falta entrada manual).

Consequência: foto, linha do tempo com mídia e separação fato/interpretação são
**UI sobre dado existente**, não produto novo.

## What Changes (escopo, por prioridade e custo)

### Prioridade ALTA
- **child-profile / MODIFIED — Tela "Hoje" afetiva** (spec §2). Foto, idade,
  resumo do dia composto dos `daily_records`, últimas observações, botão único
  "Registrar momento". 💚 sem banco, sem IA.
- **child-profile / MODIFIED — Foto da criança** (spec §2, §3). Upload → Storage,
  grava `photo_path`/`media_assets`, respeita consentimento `media` (trigger já
  bloqueia). 💚 sem IA (só bucket + tela).
- **daily-journal / MODIFIED — Categorias ampliadas** (spec §4). Adiciona fralda,
  mamadeira, água, humor, medicamento, momento especial. ⚠️ exige migration
  (altera o CHECK de `daily_records.category`) + tipo TS + labels. 💚 sem custo.
- **pedagogical-enrichment / MODIFIED — Observação manual fato/interpretação**
  (spec §5). Form manual usando os campos que já existem, sem gastar token. 💚.

### Prioridade MÉDIA
- **child-timeline / ADDED — Linha do tempo** (spec §7). Compõe `daily_records`
  + `media_assets` + observações em ordem cronológica; marcar "momento especial".
  💚 (usa dado existente; foto depende do passo de mídia).
- **guidance-notebook / ADDED — Caderno de orientações** (spec §11). Tabela nova
  + RLS + tela. 💚 sem IA.
- **family-space / ADDED — Mural e recados** (spec §10). Tabela nova + RLS +
  confirmação de leitura. 💚 sem IA.
- **daily-report / ADDED — Relato do dia com IA** (spec §6). Edge Function nova
  (Claude API), tom selecionável, revisão humana obrigatória, saída WhatsApp/PDF.
  💛 pago por uso.

### Prioridade BAIXA
- **patterns-discoveries / ADDED — Descobertas e padrões** (spec §8). 💛 IA.
- **activity-suggestions / ADDED — Sugestões de atividade** (spec §9). 💛 IA.
- **voice-capture / ADDED — Registro por voz** (spec §4). 💛 transcrição paga.
- **album-memory / ADDED — Álbum e retrospectiva** (spec §13). 💚 (curadoria manual).

## Invariantes (não regredir)
- Autorização sempre no banco (RLS por `care_links`); UI nunca é a barreira.
- Notas privadas fora de família, PDF, notificação e prompt de IA.
- Linguagem de IA hipotética e não diagnóstica (spec §15); nunca comparar crianças.
- Registros críticos append-only.
- Mídia só com consentimento `media`; nada público por padrão (spec §14).

## Impact
- Specs afetadas: `child-profile`, `daily-journal`, `pedagogical-enrichment`
  (MODIFIED) + capabilities novas listadas acima (ADDED).
- Migrations: nova para categorias; nova(s) para caderno/mural/timeline flags.
- Edge Functions novas (pagas) só nas fases MÉDIA/BAIXA.

-- Amplia as categorias de registro do diário (spec §4): fralda, mamadeira,
-- água, humor, momento especial.
--
-- 'medicamento' é DELIBERADAMENTE omitido: administração de medicamento passa
-- pelo módulo de Saúde, que exige autorização ativa do responsável
-- (trigger require_active_med_auth). Um registro livre no diário burlaria essa
-- trava de segurança.

alter table daily_records drop constraint if exists daily_records_category_check;

alter table daily_records add constraint daily_records_category_check
  check (category in (
    'alimentacao','sono','higiene','atividade','passeio','leitura','saude','observacao',
    'fralda','mamadeira','agua','humor','momento_especial'
  ));

-- Testes de autorização (critérios de aceite RF-01/RF-04/RF-05).
-- Rodar com: supabase db reset && psql "$DB_URL" -f supabase/tests/rls_test.sql
-- Falha = exceção; sucesso = imprime OK no fim.

begin;

-- usuários simulados
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'pro@test.dev'),
  ('00000000-0000-0000-0000-000000000002', 'mae@test.dev'),
  ('00000000-0000-0000-0000-000000000003', 'intruso@test.dev');
insert into profiles (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Pro'),
  ('00000000-0000-0000-0000-000000000002', 'Mae'),
  ('00000000-0000-0000-0000-000000000003', 'Intruso');

-- pro cria criança + vínculo
set local role postgres;
insert into children (id, name, birthdate, created_by)
  values ('10000000-0000-0000-0000-000000000001', 'Lia', '2024-06-01', '00000000-0000-0000-0000-000000000001');
insert into care_links (child_id, user_id, role)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'professional'),
         ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'guardian');

-- registro privado + compartilhado
insert into daily_records (id, child_id, author_id, category, note, visibility, state) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', 'observacao', 'nota privada', 'private_professional', 'shared'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', 'atividade', 'brincou de blocos', 'shared', 'shared');

-- ── T1: intruso (sem vínculo) não vê nada ─────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';
do $$ begin
  if (select count(*) from children) <> 0 then raise exception 'T1 FAIL: intruso ve criancas'; end if;
  if (select count(*) from daily_records) <> 0 then raise exception 'T1 FAIL: intruso ve registros'; end if;
end $$;

-- ── T2: guardian vê criança e registro compartilhado, nunca o privado ──
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$ begin
  if (select count(*) from children) <> 1 then raise exception 'T2 FAIL: guardian nao ve crianca'; end if;
  if exists (select 1 from daily_records where visibility = 'private_professional') then
    raise exception 'T2 FAIL: nota privada vazou para guardian';
  end if;
  if (select count(*) from daily_records) <> 1 then raise exception 'T2 FAIL: guardian nao ve compartilhado'; end if;
end $$;

-- ── T3: medicamento sem autorização é rejeitado ───────────────
set local role postgres;
insert into medications (id, child_id, name, dose, schedule, created_by)
  values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
          'Antitermico', '5ml', '8/8h', '00000000-0000-0000-0000-000000000002');
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$ begin
  begin
    insert into medication_administrations (medication_id, child_id, given_by)
      values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
              '00000000-0000-0000-0000-000000000001');
    raise exception 'T3 FAIL: administrou sem autorizacao';
  exception when others then
    if sqlerrm like '%T3 FAIL%' then raise; end if; -- esperado: bloqueio
  end;
end $$;

-- ── T4: com autorização, administra; após revogar vínculo, guardian perde acesso ──
set local role postgres;
insert into medication_authorizations (medication_id, guardian_id)
  values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';
insert into medication_administrations (medication_id, child_id, given_by)
  values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000001');

set local role postgres;
update care_links set revoked_at = now()
  where user_id = '00000000-0000-0000-0000-000000000002';
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$ begin
  if (select count(*) from children) <> 0 then raise exception 'T4 FAIL: acesso apos revogacao'; end if;
end $$;

select 'RLS TESTS OK' as result;
rollback;

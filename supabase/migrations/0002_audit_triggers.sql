-- Auditoria automática de ações sensíveis (spec §04 — requisitos de auditoria)
create function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  cid := coalesce(new.child_id, old.child_id);
  insert into audit_log (actor_id, child_id, action, detail)
  values (auth.uid(), cid, tg_table_name || ':' || lower(tg_op),
          jsonb_build_object('id', coalesce(new.id, old.id)));
  return coalesce(new, old);
end $$;

create trigger audit_consents after insert or update on consents
  for each row execute function audit_row();
create trigger audit_care_links after insert or update on care_links
  for each row execute function audit_row();
create trigger audit_med_adm after insert on medication_administrations
  for each row execute function audit_row();
create trigger audit_medications after insert on medications
  for each row execute function audit_row();
create trigger audit_reports after insert or update on weekly_reports
  for each row execute function audit_row();

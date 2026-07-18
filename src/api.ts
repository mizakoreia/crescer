import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from './supabase';

// Toda query passa pelo supabase-js; RLS no banco é a autorização real.
const run = async <T>(
  p: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<{ data: T } | { error: { message: string } }> => {
  const { data, error } = await p;
  return error ? { error: { message: error.message } } : { data: data as T };
};

export interface Child { id: string; name: string; birthdate: string; pronoun: string | null; photo_path: string | null }
export interface DailyRecord {
  id: string; child_id: string; author_id: string; category: string;
  occurred_at: string; duration_min: number | null; amount_text: string | null;
  note: string | null; tags: string[]; visibility: string; state: string;
}

export interface Consent { id: string; child_id: string; scope: string; text_version: string; revoked_at: string | null }
export interface LivingEntry { id: string; child_id: string; author_id: string; section: string; content: string; created_at: string }
export interface HealthCondition { id: string; child_id: string; kind: string; name: string; severity: string; instruction: string | null }
export interface EmergencyContact { id: string; child_id: string; name: string; relation: string | null; phone: string }
export interface Medication {
  id: string; child_id: string; name: string; dose: string; schedule: string; instruction: string | null;
  medication_authorizations: { id: string; revoked_at: string | null }[];
}
export interface MedAdministration {
  id: string; medication_id: string; child_id: string; given_by: string; given_at: string;
  skipped: boolean; note: string | null; addendum_of: string | null;
}
export interface CalendarEvent { id: string; child_id: string; kind: string; title: string; starts_at: string; ends_at: string | null; note: string | null }
export interface ChecklistItem { id: string; child_id: string; name: string; recurring: boolean; low_stock: boolean; confirmed: boolean }
export interface WorkPeriod { id: string; child_id: string; professional_id: string; started_at: string; ended_at: string | null; break_min: number; overtime: boolean }
export interface Expense { id: string; child_id: string; kind: string; amount_cents: number; note: string | null; occurred_on: string }
export interface Payment { id: string; child_id: string; period_month: string; amount_cents: number; status: string; confirmed_by_guardian: boolean }
export interface WeeklyReport {
  id: string; child_id: string; author_id: string; week_start: string; version: number;
  content: Record<string, string>; state: 'draft' | 'done' | 'shared'; shared_at: string | null; pdf_path: string | null;
}
export interface TimelineItem {
  id: string; kind: 'record' | 'observation'; at: string;
  category?: string; note?: string | null; amount_text?: string | null; isPrivate?: boolean;
  obsId?: string; fact?: string; interpretation?: string | null;
}
export interface Observation {
  id: string; child_id: string; author_id: string; fact: string; context: string | null;
  interpretation: string | null; domains: string[]; continuity: string | null;
  origin: 'manual' | 'assisted'; source_record_ids: string[]; low_confidence: boolean;
  review_state: 'draft' | 'done' | 'shared'; created_at: string;
}

export const api = createApi({
  baseQuery: fakeBaseQuery<{ message: string }>(),
  tagTypes: ['Children', 'Daily', 'Living', 'Obs', 'Health', 'Agenda', 'Work', 'Report', 'Consents'],
  endpoints: (b) => ({
    createChild: b.mutation<Child, { name: string; birthdate: string; pronoun?: string }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user!.id;
        // id gerado no cliente: sem .select()/RETURNING, que a policy de SELECT
        // (has_active_link) barraria antes do care_link existir.
        const id = crypto.randomUUID();
        const ins = await supabase.from('children').insert({ id, ...input, created_by: uid });
        if (ins.error) return { error: { message: ins.error.message } };
        // vínculo do criador como profissional
        const link = await supabase.from('care_links')
          .insert({ child_id: id, user_id: uid, role: 'professional' });
        if (link.error) return { error: { message: link.error.message } };
        return { data: { id, name: input.name, birthdate: input.birthdate, pronoun: input.pronoun ?? null, photo_path: null } };
      },
      invalidatesTags: ['Children'],
    }),
    createInvitation: b.mutation<{ token: string }, { childId: string; email?: string }>({
      queryFn: async ({ childId, email }) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<{ token: string }>(
          supabase.from('invitations')
            .insert({ child_id: childId, email, invited_by: auth.user!.id })
            .select('token').single(),
        );
      },
    }),
    acceptInvitation: b.mutation<string, string>({
      queryFn: (token) => run<string>(supabase.rpc('accept_invitation', { invite_token: token })),
      invalidatesTags: ['Children', 'Consents'],
    }),
    careLinks: b.query<{ id: string; user_id: string; role: string; revoked_at: string | null; profiles: { name: string } | null }[], string>({
      queryFn: async (childId) => {
        // desambigua o embed: care_links tem 2 FKs para profiles (user_id e invited_by)
        const { data, error } = await supabase.from('care_links')
          .select('id, user_id, role, revoked_at, profiles:care_links_user_id_fkey(name)').eq('child_id', childId);
        if (error) return { error: { message: error.message } };
        // supabase-js tipa a relação como array; normaliza para objeto único
        return {
          data: (data ?? []).map((l) => ({
            ...l,
            profiles: Array.isArray(l.profiles) ? (l.profiles[0] ?? null) : l.profiles,
          })),
        };
      },
      providesTags: ['Children'],
    }),
    revokeLink: b.mutation<unknown, string>({
      queryFn: (id) => run(supabase.from('care_links').update({ revoked_at: new Date().toISOString() }).eq('id', id).select().single()),
      invalidatesTags: ['Children'],
    }),
    exportChildData: b.mutation<Record<string, unknown>, string>({
      queryFn: async (child_id) => {
        const { data, error } = await supabase.functions.invoke('export-child-data', { body: { child_id } });
        return error ? { error: { message: error.message } } : { data: data as Record<string, unknown> };
      },
    }),
    consents: b.query<Consent[], string>({
      queryFn: (childId) => run(supabase.from('consents').select('*').eq('child_id', childId).is('revoked_at', null)),
      providesTags: ['Consents'],
    }),
    grantConsent: b.mutation<Consent, { childId: string; scope: string }>({
      queryFn: async ({ childId, scope }) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<Consent>(supabase.from('consents')
          .insert({ child_id: childId, guardian_id: auth.user!.id, scope, text_version: 'v1' })
          .select().single());
      },
      invalidatesTags: ['Consents'],
    }),
    revokeConsent: b.mutation<Consent, string>({
      queryFn: (id) => run<Consent>(
        supabase.from('consents').update({ revoked_at: new Date().toISOString() }).eq('id', id).select().single()),
      invalidatesTags: ['Consents'],
    }),
    myChildren: b.query<Child[], void>({
      queryFn: () => run(supabase.from('children').select('id,name,birthdate,pronoun,photo_path').order('name')),
      providesTags: ['Children'],
    }),
    dailyRecords: b.query<DailyRecord[], { childId: string; day: string }>({
      queryFn: ({ childId, day }) =>
        run(supabase.from('daily_records').select('*')
          .eq('child_id', childId)
          .gte('occurred_at', `${day}T00:00:00`).lt('occurred_at', `${day}T23:59:59`)
          .order('occurred_at')),
      providesTags: ['Daily'],
    }),
    upsertDailyRecord: b.mutation<DailyRecord, Partial<DailyRecord>>({
      queryFn: async (rec) => {
        // author_id é NOT NULL e a policy exige author_id = auth.uid()
        const { data: auth } = await supabase.auth.getUser();
        return run<DailyRecord>(supabase.from('daily_records')
          .upsert({ author_id: auth.user!.id, ...rec } as never).select().single());
      },
      invalidatesTags: ['Daily'],
    }),
    weeklyReport: b.query<WeeklyReport | null, { childId: string; weekStart: string }>({
      queryFn: async ({ childId, weekStart }) => {
        const { data, error } = await supabase.from('weekly_reports').select('*')
          .eq('child_id', childId).eq('week_start', weekStart)
          .order('version', { ascending: false }).limit(1).maybeSingle();
        return error ? { error: { message: error.message } } : { data: data as WeeklyReport | null };
      },
      providesTags: ['Report'],
    }),
    // composição automática (RF-08): só registros compartilháveis + observações revisadas
    composeWeek: b.query<Record<string, string>, { childId: string; weekStart: string }>({
      queryFn: async ({ childId, weekStart }) => {
        const end = new Date(new Date(weekStart).getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
        const [recs, obs] = await Promise.all([
          supabase.from('daily_records').select('category, note, occurred_at')
            .eq('child_id', childId).neq('visibility', 'private_professional')
            .gte('occurred_at', weekStart).lt('occurred_at', end).order('occurred_at'),
          supabase.from('pedagogical_observations').select('fact, interpretation, continuity, review_state')
            .eq('child_id', childId).in('review_state', ['done', 'shared'])
            .gte('created_at', weekStart).lt('created_at', end),
        ]);
        const err = recs.error ?? obs.error;
        if (err) return { error: { message: err.message } };
        const byCat: Record<string, number> = {};
        for (const r of recs.data ?? []) byCat[r.category] = (byCat[r.category] ?? 0) + 1;
        return {
          data: {
            rotina: Object.entries(byCat).map(([c, n]) => `${c}: ${n} registro(s)`).join('\n'),
            experiencias: (recs.data ?? [])
              .filter((r) => ['atividade', 'passeio', 'leitura'].includes(r.category) && r.note)
              .map((r) => `• ${r.note}`).join('\n'),
            observacoes: (obs.data ?? []).map((o) => `${o.fact}${o.interpretation ? `\n${o.interpretation}` : ''}`).join('\n\n'),
            conquistas: '',
            convites: (obs.data ?? []).filter((o) => o.continuity).map((o) => `• ${o.continuity}`).join('\n'),
          },
        };
      },
    }),
    upsertWeeklyReport: b.mutation<WeeklyReport, Partial<WeeklyReport> & { child_id: string; week_start: string }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<WeeklyReport>(supabase.from('weekly_reports')
          .upsert({ author_id: auth.user!.id, ...input } as never, { onConflict: 'child_id,week_start,version' })
          .select().single());
      },
      invalidatesTags: ['Report'],
    }),
    generateReportPdf: b.mutation<{ url: string }, { report_id: string }>({
      queryFn: async (body) => {
        const { data, error } = await supabase.functions.invoke('weekly-report-pdf', { body });
        return error ? { error: { message: error.message } } : { data: data as { url: string } };
      },
      invalidatesTags: ['Report'],
    }),
    agenda: b.query<{ events: CalendarEvent[]; items: ChecklistItem[] }, string>({
      queryFn: async (childId) => {
        const [e, i] = await Promise.all([
          supabase.from('calendar_events').select('*').eq('child_id', childId)
            .gte('starts_at', new Date().toISOString().slice(0, 10)).order('starts_at').limit(50),
          supabase.from('checklist_items').select('*').eq('child_id', childId).order('name'),
        ]);
        const err = e.error ?? i.error;
        if (err) return { error: { message: err.message } };
        return { data: { events: (e.data ?? []) as CalendarEvent[], items: (i.data ?? []) as ChecklistItem[] } };
      },
      providesTags: ['Agenda'],
    }),
    addEvent: b.mutation<CalendarEvent, { child_id: string; kind: string; title: string; starts_at: string; note?: string }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<CalendarEvent>(supabase.from('calendar_events')
          .insert({ ...input, created_by: auth.user!.id }).select().single());
      },
      invalidatesTags: ['Agenda'],
    }),
    addChecklistItem: b.mutation<ChecklistItem, { child_id: string; name: string; recurring?: boolean }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<ChecklistItem>(supabase.from('checklist_items')
          .insert({ ...input, created_by: auth.user!.id }).select().single());
      },
      invalidatesTags: ['Agenda'],
    }),
    updateChecklistItem: b.mutation<ChecklistItem, Partial<ChecklistItem> & { id: string }>({
      queryFn: ({ id, ...patch }) =>
        run<ChecklistItem>(supabase.from('checklist_items').update(patch).eq('id', id).select().single()),
      invalidatesTags: ['Agenda'],
    }),
    work: b.query<{ periods: WorkPeriod[]; expenses: Expense[]; payments: Payment[] }, string>({
      queryFn: async (childId) => {
        const [p, e, pay] = await Promise.all([
          supabase.from('work_periods').select('*').eq('child_id', childId).order('started_at', { ascending: false }).limit(60),
          supabase.from('expenses').select('*').eq('child_id', childId).order('occurred_on', { ascending: false }).limit(60),
          supabase.from('payments').select('*').eq('child_id', childId).order('period_month', { ascending: false }),
        ]);
        const err = p.error ?? e.error ?? pay.error;
        if (err) return { error: { message: err.message } };
        return { data: { periods: (p.data ?? []) as WorkPeriod[], expenses: (e.data ?? []) as Expense[], payments: (pay.data ?? []) as Payment[] } };
      },
      providesTags: ['Work'],
    }),
    startWorkPeriod: b.mutation<WorkPeriod, { child_id: string }>({
      queryFn: async ({ child_id }) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<WorkPeriod>(supabase.from('work_periods')
          .insert({ child_id, professional_id: auth.user!.id, started_at: new Date().toISOString() }).select().single());
      },
      invalidatesTags: ['Work'],
    }),
    endWorkPeriod: b.mutation<WorkPeriod, { id: string; break_min?: number; overtime?: boolean }>({
      queryFn: ({ id, ...patch }) =>
        run<WorkPeriod>(supabase.from('work_periods')
          .update({ ended_at: new Date().toISOString(), ...patch }).eq('id', id).select().single()),
      invalidatesTags: ['Work'],
    }),
    addExpense: b.mutation<Expense, { child_id: string; kind: string; amount_cents: number; note?: string }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<Expense>(supabase.from('expenses')
          .insert({ ...input, professional_id: auth.user!.id }).select().single());
      },
      invalidatesTags: ['Work'],
    }),
    health: b.query<{ conditions: HealthCondition[]; contacts: EmergencyContact[]; medications: Medication[]; administrations: MedAdministration[] }, string>({
      queryFn: async (childId) => {
        const [c1, c2, c3, c4] = await Promise.all([
          supabase.from('health_conditions').select('*').eq('child_id', childId),
          supabase.from('emergency_contacts').select('*').eq('child_id', childId),
          supabase.from('medications').select('*, medication_authorizations(id, revoked_at)').eq('child_id', childId),
          supabase.from('medication_administrations').select('*').eq('child_id', childId)
            .order('given_at', { ascending: false }).limit(20),
        ]);
        const err = c1.error ?? c2.error ?? c3.error ?? c4.error;
        if (err) return { error: { message: err.message } };
        return {
          data: {
            conditions: (c1.data ?? []) as HealthCondition[],
            contacts: (c2.data ?? []) as EmergencyContact[],
            medications: (c3.data ?? []) as Medication[],
            administrations: (c4.data ?? []) as MedAdministration[],
          },
        };
      },
      providesTags: ['Health'],
    }),
    addHealthCondition: b.mutation<HealthCondition, { child_id: string; kind: string; name: string; severity: string; instruction?: string }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<HealthCondition>(supabase.from('health_conditions')
          .insert({ ...input, created_by: auth.user!.id }).select().single());
      },
      invalidatesTags: ['Health'],
    }),
    addEmergencyContact: b.mutation<EmergencyContact, { child_id: string; name: string; relation?: string; phone: string }>({
      queryFn: (input) => run<EmergencyContact>(supabase.from('emergency_contacts').insert(input).select().single()),
      invalidatesTags: ['Health'],
    }),
    addMedication: b.mutation<Medication, { child_id: string; name: string; dose: string; schedule: string; instruction?: string }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        // registro do medicamento; a autorização é um passo separado do responsável
        return run<Medication>(supabase.from('medications')
          .insert({ ...input, created_by: auth.user!.id }).select('*, medication_authorizations(id, revoked_at)').single());
      },
      invalidatesTags: ['Health'],
    }),
    // só o responsável legal consegue (RLS: has_role_link guardian)
    authorizeMedication: b.mutation<unknown, string>({
      queryFn: async (medication_id) => {
        const { data: auth } = await supabase.auth.getUser();
        return run(supabase.from('medication_authorizations')
          .insert({ medication_id, guardian_id: auth.user!.id }).select().single());
      },
      invalidatesTags: ['Health'],
    }),
    recordAdministration: b.mutation<MedAdministration, { medication_id: string; child_id: string; skipped?: boolean; note?: string }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        // sem autorização ativa, o trigger do banco rejeita — a UI só reflete
        return run<MedAdministration>(supabase.from('medication_administrations')
          .insert({ ...input, given_by: auth.user!.id }).select().single());
      },
      invalidatesTags: ['Health'],
    }),
    // linha do tempo (§7): registros e observações mesclados, mais recentes primeiro.
    // Mídia entra aqui quando o upload existir (Fase 1.5).
    timeline: b.query<TimelineItem[], string>({
      queryFn: async (childId) => {
        const [recs, obs] = await Promise.all([
          supabase.from('daily_records')
            .select('id,category,note,amount_text,occurred_at,visibility')
            .eq('child_id', childId).order('occurred_at', { ascending: false }).limit(150),
          supabase.from('pedagogical_observations')
            .select('id,fact,interpretation,created_at,review_state')
            .eq('child_id', childId).order('created_at', { ascending: false }).limit(100),
        ]);
        const err = recs.error ?? obs.error;
        if (err) return { error: { message: err.message } };
        const items: TimelineItem[] = [
          ...(recs.data ?? []).map((r) => ({
            id: `r-${r.id}`, kind: 'record' as const, at: r.occurred_at,
            category: r.category, note: r.note, amount_text: r.amount_text,
            isPrivate: r.visibility === 'private_professional',
          })),
          ...(obs.data ?? []).map((o) => ({
            id: `o-${o.id}`, kind: 'observation' as const, at: o.created_at,
            obsId: o.id, fact: o.fact, interpretation: o.interpretation,
          })),
        ].sort((a, b) => (a.at < b.at ? 1 : -1));
        return { data: items };
      },
      providesTags: ['Daily', 'Obs'],
    }),
    observations: b.query<Observation[], string>({
      queryFn: (childId) =>
        run(supabase.from('pedagogical_observations').select('*')
          .eq('child_id', childId).order('created_at', { ascending: false })),
      providesTags: ['Obs'],
    }),
    enrichObservation: b.mutation<Observation, { child_id: string; record_ids: string[] }>({
      queryFn: async (body) => {
        const { data, error } = await supabase.functions.invoke('enrich-observation', { body });
        return error ? { error: { message: error.message } } : { data: data as Observation };
      },
      invalidatesTags: ['Obs'],
    }),
    // observação manual (§5): fato/interpretação/continuidade preenchidos à mão,
    // sem IA. author_id NOT NULL e exigido pela policy; origin 'manual'.
    addObservation: b.mutation<Observation, {
      child_id: string; fact: string; interpretation?: string; continuity?: string;
      review_state?: 'draft' | 'done' | 'shared';
    }>({
      queryFn: async ({ review_state = 'draft', ...input }) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<Observation>(supabase.from('pedagogical_observations')
          .insert({ ...input, author_id: auth.user!.id, origin: 'manual', review_state })
          .select().single());
      },
      invalidatesTags: ['Obs'],
    }),
    updateObservation: b.mutation<Observation, Partial<Observation> & { id: string }>({
      queryFn: ({ id, ...patch }) =>
        run<Observation>(supabase.from('pedagogical_observations').update(patch).eq('id', id).select().single()),
      invalidatesTags: ['Obs'],
    }),
    livingEntries: b.query<LivingEntry[], string>({
      queryFn: (childId) =>
        run(supabase.from('living_profile_entries').select('*')
          .eq('child_id', childId).order('created_at', { ascending: false })),
      providesTags: ['Living'],
    }),
    addLivingEntry: b.mutation<LivingEntry, { child_id: string; section: string; content: string }>({
      queryFn: async (input) => {
        const { data: auth } = await supabase.auth.getUser();
        return run<LivingEntry>(supabase.from('living_profile_entries')
          .insert({ ...input, author_id: auth.user!.id }).select().single());
      },
      invalidatesTags: ['Living'],
    }),
  }),
});

export const {
  useMyChildrenQuery, useDailyRecordsQuery, useUpsertDailyRecordMutation,
  useCreateChildMutation, useCreateInvitationMutation, useAcceptInvitationMutation,
  useConsentsQuery, useGrantConsentMutation, useRevokeConsentMutation,
  useLivingEntriesQuery, useAddLivingEntryMutation,
  useObservationsQuery, useEnrichObservationMutation, useUpdateObservationMutation, useAddObservationMutation,
  useTimelineQuery,
  useHealthQuery, useAddHealthConditionMutation, useAddEmergencyContactMutation,
  useAddMedicationMutation, useAuthorizeMedicationMutation, useRecordAdministrationMutation,
  useAgendaQuery, useAddEventMutation, useAddChecklistItemMutation, useUpdateChecklistItemMutation,
  useWorkQuery, useStartWorkPeriodMutation, useEndWorkPeriodMutation, useAddExpenseMutation,
  useWeeklyReportQuery, useComposeWeekQuery, useUpsertWeeklyReportMutation, useGenerateReportPdfMutation,
  useCareLinksQuery, useRevokeLinkMutation, useExportChildDataMutation,
} = api;

// hook: criança selecionada (default = primeira)
import { useSelector } from 'react-redux';
import type { RootState } from './store';
export function useChildId(): string | null {
  const { data: children = [] } = useMyChildrenQuery();
  const selected = useSelector((s: RootState) => s.session.childId);
  return selected ?? children[0]?.id ?? null;
}

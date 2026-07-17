import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from './supabase';

// Toda query passa pelo supabase-js; RLS no banco é a autorização real.
const run = async <T>(
  p: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<{ data: T } | { error: { message: string } }> => {
  const { data, error } = await p;
  return error ? { error: { message: error.message } } : { data: data as T };
};

export interface Child { id: string; name: string; birthdate: string; pronoun: string | null }
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
        const res = await run<Child>(
          supabase.from('children').insert({ ...input, created_by: uid }).select().single(),
        );
        if ('error' in res) return res;
        // vínculo do criador como profissional
        const link = await run(supabase.from('care_links')
          .insert({ child_id: res.data.id, user_id: uid, role: 'professional' }));
        if ('error' in link) return link;
        return res;
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
      queryFn: () => run(supabase.from('children').select('id,name,birthdate,pronoun').order('name')),
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
      queryFn: (rec) => run<DailyRecord>(supabase.from('daily_records').upsert(rec as never).select().single()),
      invalidatesTags: ['Daily'],
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
        // guardian cria medicamento + autorização junto (fluxo da spec: instrução + autorização)
        const res = await run<Medication>(supabase.from('medications')
          .insert({ ...input, created_by: auth.user!.id }).select('*, medication_authorizations(id, revoked_at)').single());
        if ('error' in res) return res;
        await supabase.from('medication_authorizations')
          .insert({ medication_id: res.data.id, guardian_id: auth.user!.id });
        return res;
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
  useObservationsQuery, useEnrichObservationMutation, useUpdateObservationMutation,
  useHealthQuery, useAddHealthConditionMutation, useAddEmergencyContactMutation,
  useAddMedicationMutation, useRecordAdministrationMutation,
} = api;

// hook: criança selecionada (default = primeira)
import { useSelector } from 'react-redux';
import type { RootState } from './store';
export function useChildId(): string | null {
  const { data: children = [] } = useMyChildrenQuery();
  const selected = useSelector((s: RootState) => s.session.childId);
  return selected ?? children[0]?.id ?? null;
}

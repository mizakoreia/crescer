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
  }),
});

export const {
  useMyChildrenQuery, useDailyRecordsQuery, useUpsertDailyRecordMutation,
  useCreateChildMutation, useCreateInvitationMutation, useAcceptInvitationMutation,
  useConsentsQuery, useGrantConsentMutation, useRevokeConsentMutation,
} = api;

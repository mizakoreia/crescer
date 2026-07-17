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

export const api = createApi({
  baseQuery: fakeBaseQuery<{ message: string }>(),
  tagTypes: ['Children', 'Daily', 'Living', 'Obs', 'Health', 'Agenda', 'Work', 'Report'],
  endpoints: (b) => ({
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

export const { useMyChildrenQuery, useDailyRecordsQuery, useUpsertDailyRecordMutation } = api;

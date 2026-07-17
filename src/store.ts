import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from './api';

// criança selecionada (seletor visível no topo quando >1 vínculo)
const session = createSlice({
  name: 'session',
  initialState: { childId: null as string | null },
  reducers: {
    selectChild: (s, a: PayloadAction<string | null>) => { s.childId = a.payload; },
  },
});

export const { selectChild } = session.actions;

export const store = configureStore({
  reducer: { session: session.reducer, [api.reducerPath]: api.reducer },
  middleware: (gdm) => gdm().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

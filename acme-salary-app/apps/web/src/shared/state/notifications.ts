import { createSlice, nanoid } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
export type FeedbackTone = 'success' | 'error' | 'info' | 'warning';
export type LocalFeedback = { message: string; tone: FeedbackTone };
export type NoticeInput = LocalFeedback;
export type Notice = NoticeInput & { id: string };
export const notifications = createSlice({
  name: 'notifications',
  initialState: { items: [] as Notice[] },
  reducers: {
    notify: {
      prepare: (input: string | NoticeInput) => ({
        payload: {
          ...(typeof input === 'string' ? { message: input, tone: 'info' as const } : input),
          id: nanoid(),
        },
      }),
      reducer: (state, action: PayloadAction<Notice>) => {
        if (
          !action.payload.message ||
          state.items.some(
            (item) => item.message === action.payload.message && item.tone === action.payload.tone,
          )
        )
          return;
        state.items = [...state.items, action.payload].slice(-3);
      },
    },
    dismiss: (state, action: PayloadAction<string | undefined>) => {
      state.items = action.payload ? state.items.filter((item) => item.id !== action.payload) : [];
    },
  },
});
export const { notify, dismiss } = notifications.actions;

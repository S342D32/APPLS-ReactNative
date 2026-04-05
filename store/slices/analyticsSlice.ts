import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export type QuizAttempt = {
  id?: string;
  start_time?: string;
  created_at?: string;
  createdAt?: string;
  total_questions?: number;
  totalQuestions?: number;
  score?: number;
  topic?: string;
  sub_topic?: string;
  subTopic?: string;
};

type AnalyticsState = {
  attempts: QuizAttempt[];
};

const initialState: AnalyticsState = {
  attempts: [],
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAttempts(state, action: PayloadAction<QuizAttempt[]>) {
      state.attempts = action.payload;
    },
    removeAttempt(state, action: PayloadAction<string>) {
      state.attempts = state.attempts.filter((a) => a.id !== action.payload);
    },
  },
});

export const { setAttempts, removeAttempt } = analyticsSlice.actions;
export default analyticsSlice.reducer;

// Derived stats selector (memoized)
export const selectQuizStats = createSelector(
  (state: RootState) => state.analytics.attempts,
  (attempts) => {
    if (!attempts.length) return null;
    const totalAttempts = attempts.length;
    const totalQuestions = attempts.reduce(
      (sum, a) => sum + (a.total_questions || a.totalQuestions || 0),
      0
    );
    const totalCorrect = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
    const averageScore =
      totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(2) : '0.00';
    return { totalAttempts, totalQuestions, totalCorrect, averageScore };
  }
);

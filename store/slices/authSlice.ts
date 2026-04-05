import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type BackendUser = {
  id: number;
  email: string;
  name: string;
  profileImage?: string;
};

type AuthState = {
  jwtToken: string | null;
  backendUser: BackendUser | null;
  isLoading: boolean;
};

const initialState: AuthState = {
  jwtToken: null,
  backendUser: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called after successful firebase-sync
    setSession(state, action: PayloadAction<{ jwtToken: string; backendUser: BackendUser }>) {
      state.jwtToken = action.payload.jwtToken;
      state.backendUser = action.payload.backendUser;
      state.isLoading = false;
    },
    // Called on logout or firebase-sync failure
    clearSession(state) {
      state.jwtToken = null;
      state.backendUser = null;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setSession, clearSession, setLoading } = authSlice.actions;
export default authSlice.reducer;

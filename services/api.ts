import axios from 'axios';
import Constants from 'expo-constants';
import { store } from '@/store';
import { setSession, clearSession } from '@/store/slices/authSlice';
import { auth } from '@/config/firebase';

export const BASE_URL = (Constants.expoConfig?.extra?.backendUrl as string) ?? 'http://10.150.211.202:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach backend JWT from Redux store to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.jwtToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (JWT expired) — re-sync with Firebase to get a fresh backend JWT.
// Mobile doesn't need refresh tokens because Firebase handles its own token
// refresh automatically via getIdToken(). This replaces the web's refresh token flow.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // prevent infinite retry loop

      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        
        // No Firebase session — force logout
        store.dispatch(clearSession());
        return Promise.reject(error);
      }

      try {
        // Force-refresh the Firebase token (true = bypass cache)
        const freshFirebaseToken = await firebaseUser.getIdToken(true);

        // Re-sync with backend to get a new JWT
        const res = await axios.post(
          `${BASE_URL}/api/auth/firebase-sync`,
          {},
          { headers: { Authorization: `Bearer ${freshFirebaseToken}` } }
        );

        const { accessToken, user } = res.data;

        // Update Redux store — redux-persist saves to AsyncStorage automatically
        store.dispatch(setSession({ jwtToken: accessToken, backendUser: user }));

        // Retry the original failed request with the new JWT
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        // Re-sync failed — clear session and let auth guard redirect to login
        store.dispatch(clearSession());
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import { auth } from '@/config/firebase';
import { store } from '@/store';
import { clearSession, setSession } from '@/store/slices/authSlice';
import axios from 'axios';
import Constants from 'expo-constants';

export const BASE_URL = (Constants.expoConfig?.extra?.backendUrl as string) ?? 'http://10.150.211.202:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Dev logger — shows every request & response in the Expo terminal ─────────
if (__DEV__) {
  api.interceptors.request.use((config) => {
    console.log(`\n🌐 REQUEST  ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) console.log('📤 PAYLOAD :', JSON.stringify(config.data, null, 2));
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.log(`✅ RESPONSE ${response.status} ${response.config.url}`);
      console.log('📥 DATA    :', JSON.stringify(response.data, null, 2));
      return response;
    },
    (error) => {
      console.log(`❌ ERROR    ${error.response?.status ?? 'NO_STATUS'} ${error.config?.url}`);
      console.log('📥 ERROR DATA:', JSON.stringify(error.response?.data, null, 2));
      return Promise.reject(error);
    }
  );
}

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

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import analyticsReducer from './slices/analyticsSlice';
import chatReducer from './slices/chatSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  analytics: analyticsReducer,
  chat: chatReducer,
});

// Persist config — uses AsyncStorage so state survives app restarts
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'analytics'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Required: ignore redux-persist action types in serializability check
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Typed hooks helpers
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { Tokens } from '../services/api';
import { getStoredTokens, setStoredTokens } from '../services/api';

type AuthState = {
  tokens: Tokens | null;
};

const initialState: AuthState = {
  tokens: getStoredTokens(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<Tokens | null>) {
      state.tokens = action.payload;
      setStoredTokens(action.payload);
    },
    logout(state) {
      state.tokens = null;
      setStoredTokens(null);
    },
  },
});

export const { setTokens, logout } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

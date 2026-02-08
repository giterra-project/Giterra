import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types/store';
import { API_BASE_URL } from '../lib/apiBase';

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoggingIn: false,

            login: () => {
                if (get().isLoggingIn) return;
                set({ isLoggingIn: true });
                // 백엔드 로그인 엔드포인트로 이동
                window.location.href = `${API_BASE_URL}/auth/login`;
            },

            setAuth: (user, token) =>
                set({
                    user,
                    accessToken: token,
                    isAuthenticated: true,
                    isLoggingIn: false,
                }),

            resetLoggingIn: () => set({ isLoggingIn: false }),

            clearAuth: () => {
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                    isLoggingIn: false,
                });
                window.location.href = '/';
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

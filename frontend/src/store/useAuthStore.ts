import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types/store';

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
                // 백엔드 로그인 엔드포인트로 이동 (VITE_API_BASE_URL이 없으면 로컬호스트 기본값 사용)
                const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                window.location.href = `${BASE_URL}/auth/login`;
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
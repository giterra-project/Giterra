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

                const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
                const REDIRECT_URI = `${window.location.origin}/login/callback`;

                if (!CLIENT_ID) {
                    alert("Client ID가 설정되지 않았습니다.");
                    return;
                }

                set({ isLoggingIn: true });

                const GITHUB_URL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user`;
                window.location.assign(GITHUB_URL);
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
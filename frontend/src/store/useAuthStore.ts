import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User } from '../types/store';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            setAuth: (user: User, token: string) =>
                set({
                    user,
                    accessToken: token,
                    isAuthenticated: true,
                }),
            clearAuth: () =>
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
import { create } from 'zustand';
import type { PlacementData, SlotIndex, PlanetType } from '../types/index';

interface ValidationError {
    field: string;
    value: unknown;
    reason: string;
}

interface ErrorResponse {
    code?: number;
    message?: string;
    errors?: ValidationError[];
}

export interface PlanetStore {
    serverPlacements: PlacementData[];
    localPlacements: PlacementData[];
    isSaving: boolean;
    errorMessage: string | null;
    setServerPlacements: (placements: PlacementData[]) => void;
    movePlacement: (repoId: number, targetSlot: SlotIndex, planetType: PlanetType) => void;
    saveToServer: () => Promise<void>;
    resetLocalChanges: () => void;
    clearError: () => void;
}

export const usePlanetStore = create<PlanetStore>((set, get) => ({
    serverPlacements: [],
    localPlacements: [],
    isSaving: false,
    errorMessage: null,

    setServerPlacements: (placements: PlacementData[]) => set({
        serverPlacements: placements,
        localPlacements: placements
    }),

    movePlacement: (repoId: number, targetSlot: SlotIndex, planetType: PlanetType) => set((state: PlanetStore) => {
        const existingSlotIndex = state.localPlacements.findIndex((p: PlacementData) => p.slot_index === targetSlot);
        const newPlacements = [...state.localPlacements];

        if (existingSlotIndex !== -1 && newPlacements[existingSlotIndex].repo_id !== repoId) {
            return state;
        }

        const targetRepoIndex = newPlacements.findIndex((p: PlacementData) => p.repo_id === repoId);

        if (targetRepoIndex !== -1) {
            newPlacements[targetRepoIndex] = {
                ...newPlacements[targetRepoIndex],
                slot_index: targetSlot,
                planet_type: planetType
            };
        } else {
            newPlacements.push({
                repo_id: repoId,
                slot_index: targetSlot,
                planet_type: planetType
            });
        }

        return { localPlacements: newPlacements };
    }),

    saveToServer: async () => {
        set({ isSaving: true, errorMessage: null });
        try {
            const { localPlacements } = get();
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

            const requestBody = {
                planets: localPlacements.map(p => ({
                    repo_id: p.repo_id,
                    slot_index: p.slot_index
                }))
            };

            const response = await fetch('http://localhost:8000/user/planets', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token ?? ''}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                let fallbackMessage = '저장에 실패했습니다.';

                if (response.status === 404) {
                    fallbackMessage = '서버 API 경로를 찾을 수 없습니다. (404 Not Found)';
                } else if (response.status === 401) {
                    fallbackMessage = '권한이 없습니다. 다시 로그인해 주세요. (401 Unauthorized)';
                } else if (response.status === 500) {
                    fallbackMessage = '서버 내부 오류가 발생했습니다. (500 Internal Server Error)';
                } else {
                    const errorData = await response.json().catch(() => ({})) as ErrorResponse;
                    if (errorData.errors && errorData.errors.length > 0) {
                        fallbackMessage = errorData.errors.map(e => `${e.field}: ${e.reason}`).join('\n');
                    } else if (errorData.message) {
                        fallbackMessage = errorData.message;
                    }
                }

                throw new Error(fallbackMessage);
            }

            set({
                serverPlacements: [...localPlacements],
                isSaving: false
            });
        } catch (error: unknown) {
            const err = error as Error;
            const finalMessage = err.message === 'Failed to fetch'
                ? '서버와 연결할 수 없습니다. 서버가 켜져 있는지 확인해 주세요.'
                : err.message;

            set({
                errorMessage: finalMessage,
                isSaving: false
            });
        }
    },

    resetLocalChanges: () => set((state: PlanetStore) => ({
        localPlacements: [...state.serverPlacements],
        errorMessage: null
    })),

    clearError: () => set({ errorMessage: null })
}));
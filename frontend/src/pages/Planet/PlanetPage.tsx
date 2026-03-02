import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ToggleLeft, ToggleRight, Loader2, Save, AlertCircle, X, RotateCcw } from 'lucide-react';

import { usePlanetStore } from '../../store/usePlanetStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import Header from '../../components/layout/Header';
import PlanetCanvas from './PlanetCanvas';
import type { PlanetType, SlotIndex } from '../../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const PLANET_TYPES: PlanetType[] = [
    '수성', '금성', '지구', '화성', '목성', '토성', '천왕성', '해왕성'
];

interface ApiRepo {
    repoId: number;
    repoName: string;
    repoURL: string;
    description: string;
}

interface Repo {
    id: number;
    name: string;
    url: string;
    description: string;
}

interface ApiPlanet {
    repoId: number;
    slot: SlotIndex;
    repoName: string;
    repoURL: string;
    description: string;
}

interface AuthState {
    accessToken: string | null;
}

const RepositoryList = ({
    username,
    isMockMode,
    setIsMockMode
}: {
    username: string,
    isMockMode: boolean,
    setIsMockMode: (v: boolean) => void
}) => {
    const { t } = useLanguageStore();
    const accessToken = useAuthStore((state: unknown) => (state as AuthState).accessToken);
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const mockRepos: Repo[] = [
        { id: 101, name: 'Giterra-Core', description: '', url: '' },
        { id: 102, name: 'Giterra-Frontend', description: '', url: '' },
        { id: 103, name: 'AI-Model', description: '', url: '' },
        { id: 104, name: 'Legacy-Server', description: '', url: '' },
        { id: 105, name: 'Docs-Project', description: '', url: '' },
        { id: 106, name: 'Design-System', description: '', url: '' },
    ];

    useEffect(() => {
        const fetchRealRepos = async () => {
            if (username === "Guest") {
                setRepos(mockRepos);
                setIsMockMode(true);
                return;
            }

            setIsLoading(true);
            try {
                const token = accessToken || localStorage.getItem('token') || localStorage.getItem('accessToken');
                const res = await fetch(`${API_BASE_URL}/user/repos`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token ?? ''}`
                    }
                });

                if (!res.ok) throw new Error('Failed');

                const json = await res.json();
                const fetchedRepos = json.data?.repos?.map((r: ApiRepo) => ({
                    id: r.repoId,
                    name: r.repoName,
                    url: r.repoURL,
                    description: r.description
                })) || [];

                setRepos(fetchedRepos);
            } catch (e) {
                setRepos(mockRepos);
                setIsMockMode(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (isMockMode) {
            setRepos(mockRepos);
        } else if (username) {
            fetchRealRepos();
        }
    }, [isMockMode, username, setIsMockMode, accessToken]);

    const handleDragStart = (e: React.DragEvent, id: number) => {
        e.dataTransfer.setData("repoId", id.toString());
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute left-0 top-0 z-50 h-full w-[350px] bg-black/60 pt-24 backdrop-blur-xl border-r border-white/10"
        >
            <div className="px-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">{t('Repositories', 'Repositories')}</h2>
                    <button
                        onClick={() => setIsMockMode(!isMockMode)}
                        className="flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-indigo-300"
                    >
                        {isMockMode ? "MOCK DATA" : "REAL API"}
                        {isMockMode ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-white" /></div>
                ) : (
                    <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar pb-10">
                        {repos.map((repo) => {
                            return (
                                <div
                                    key={repo.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, repo.id)}
                                    className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all"
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-white">{repo.name}</div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const PlanetPage = () => {
    const location = useLocation();
    const username = location.state?.username || "Guest";
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMockMode, setIsMockMode] = useState(username === "Guest");
    const accessToken = useAuthStore((state: unknown) => (state as AuthState).accessToken);

    const isSaving = usePlanetStore((state) => state.isSaving);
    const errorMessage = usePlanetStore((state) => state.errorMessage);
    const saveToServer = usePlanetStore((state) => state.saveToServer);
    const clearError = usePlanetStore((state) => state.clearError);
    const setServerPlacements = usePlanetStore((state) => state.setServerPlacements);
    const resetLocalChanges = usePlanetStore((state) => state.resetLocalChanges);
    const localPlacements = usePlanetStore((state) => state.localPlacements);
    const serverPlacements = usePlanetStore((state) => state.serverPlacements);

    const isModified = JSON.stringify(localPlacements) !== JSON.stringify(serverPlacements);

    useEffect(() => {
        const fetchPlacements = async () => {
            if (username === "Guest") return;
            try {
                const token = accessToken || localStorage.getItem('token') || localStorage.getItem('accessToken');
                const res = await fetch(`${API_BASE_URL}/user/profile`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token ?? ''}`
                    }
                });

                if (res.ok) {
                    const json = await res.json();
                    if (json.data && json.data.planets) {
                        const parsedPlacements = json.data.planets.map((p: ApiPlanet) => ({
                            repo_id: p.repoId,
                            slot_index: p.slot,
                            planet_type: PLANET_TYPES[p.slot]
                        }));
                        setServerPlacements(parsedPlacements);
                    }
                }
            } catch (e) {
            }
        };

        fetchPlacements();
    }, [username, accessToken, setServerPlacements]);

    return (
        <div className="relative h-screen w-screen bg-black overflow-hidden">
            <Header showSearch={true} />

            <AnimatePresence>
                {isSidebarOpen && (
                    <RepositoryList
                        key="sidebar"
                        username={username}
                        isMockMode={isMockMode}
                        setIsMockMode={setIsMockMode}
                    />
                )}
            </AnimatePresence>

            <main className="relative h-full w-full">
                <PlanetCanvas />

                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-4 rounded-2xl flex items-center gap-3 z-50 backdrop-blur-md shadow-2xl"
                        >
                            <AlertCircle size={20} />
                            <span className="font-semibold whitespace-pre-wrap">{errorMessage}</span>
                            <button onClick={clearError} className="ml-2 hover:text-red-200 transition-colors">
                                <X size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute bottom-8 right-8 flex gap-4 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 font-bold transition-all"
                    >
                        {isSidebarOpen ? "Hide Repos" : "Show Repos"}
                    </button>

                    {isModified && (
                        <button
                            onClick={resetLocalChanges}
                            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 px-6 py-3 rounded-xl backdrop-blur-md border border-red-500/50 font-bold transition-all"
                        >
                            <RotateCcw size={20} />
                            Cancel
                        </button>
                    )}

                    <button
                        onClick={saveToServer}
                        disabled={isSaving || !isModified}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:text-white/50 text-white px-6 py-3 rounded-xl backdrop-blur-md border border-indigo-500/50 font-bold shadow-lg transition-all"
                    >
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {isSaving ? "Saving..." : "Save Placements"}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PlanetPage;
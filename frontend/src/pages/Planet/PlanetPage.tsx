import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Search, ChevronRight, RotateCcw, Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useLanguageStore } from '../../store/useLanguageStore';

interface Repo {
    name: string;
    description: string | null;
    stars: number;
    language: string | null;
    updated_at: string;
}

const RepositoryList = ({ username }: { username?: string }) => {
    const { t } = useLanguageStore();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (username) {
            fetchRepos();
        }
    }, [username]);

    const fetchRepos = async () => {
        setIsLoading(true);
        try {
            const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const res = await fetch(`${BASE_URL}/repos/${username}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRepos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, repoName: string) => {
        e.dataTransfer.setData("repoName", repoName);
    };

    return (
        <motion.div
            initial={{ x: -500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -500, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="absolute left-0 top-0 z-50 h-full w-[500px] bg-black/60 pt-24 backdrop-blur-2xl border-r border-white/10"
        >
            <div className="px-12 h-full flex flex-col">
                <h2 className="text-3xl font-bold mb-8 text-white">{t('레포지토리 목록', 'Repository List')}</h2>

                {username && <p className="text-indigo-400 mb-4 font-semibold">User: {username}</p>}

                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-2 border border-white/10 mb-6">
                    <input
                        type="text"
                        placeholder={t('에셋 검색', 'search asset')}
                        className="flex-1 bg-transparent px-4 py-3 text-base outline-none text-white placeholder:text-gray-500"
                    />
                    <button className="p-3 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
                        <Search size={20} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white/50" size={32} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 overflow-y-auto pr-4 custom-scrollbar pb-10">
                        {repos.map((repo, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, repo.name)}
                                className="group flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing"
                            >
                                <div className="min-w-0">
                                    <div className="text-lg font-semibold text-white truncate">{repo.name}</div>
                                    <div className="text-sm text-indigo-300 mt-2 opacity-60 flex gap-2">
                                        <span>{repo.language || 'Unknown'}</span>
                                        <span>•</span>
                                        <span>⭐ {repo.stars}</span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const PlanetPage = () => {
    const { t } = useLanguageStore();
    const location = useLocation();
    const username = location.state?.username;

    // 만약 username이 있으면 사이드바를 자동으로 열어줌 (선택사항)
    const [isSidebarOpen, setIsSidebarOpen] = useState(!!username);
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
    const [sectionData, setSectionData] = useState<{ [key: string]: string }>({});
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const [isBackFacing, setIsBackFacing] = useState(false);

    const springConfig = { damping: 30, stiffness: 120 };
    const smoothRotateX = useSpring(rotateX, springConfig);
    const smoothRotateY = useSpring(rotateY, springConfig);

    useEffect(() => {
        const unsubscribe = rotateY.onChange((v) => {
            const normalizedY = Math.abs(Math.floor((v + 90) / 180) % 2);
            setIsBackFacing(normalizedY === 1);
        });
        return () => unsubscribe();
    }, [rotateY]);

    const positions = ['TL', 'TR', 'BL', 'BR'];

    const handleSegmentClick = (side: 'Front' | 'Back', pos: string) => {
        const id = `${side}-${pos}`;
        if (selectedSegment === id) handleBackToPlanet();
        else setSelectedSegment(id);
    };

    const handleBackToPlanet = () => {
        if (selectedSegment) {
            const [side] = selectedSegment.split('-');
            rotateX.set(0);
            rotateY.set(side === 'Back' ? 180 : 0);
        }
        setSelectedSegment(null);
    };

    const onDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (dragOverId !== id) setDragOverId(id);
    };

    const onDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverId(null);
        }
    };

    const onDrop = (e: React.DragEvent, side: string, pos: string) => {
        e.preventDefault();
        setDragOverId(null);
        const repoName = e.dataTransfer.getData("repoName");
        if (repoName) {
            setSectionData(prev => ({
                ...prev,
                [`${side}-${pos}`]: repoName
            }));
        }
    };

    const getZoomTransform = () => {
        if (!selectedSegment) return { x: 0, y: 0, scale: 1, rx: null, ry: null };
        const [side, pos] = selectedSegment.split('-');
        const moveOffset = 300;
        let x = 0, y = 0;
        if (pos === 'TL') { x = moveOffset; y = moveOffset; }
        else if (pos === 'TR') { x = -moveOffset; y = moveOffset; }
        else if (pos === 'BL') { x = moveOffset; y = -moveOffset; }
        else if (pos === 'BR') { x = -moveOffset; y = -moveOffset; }
        return { x, y, scale: 2.2, rx: 0, ry: side === 'Back' ? 180 : 0 };
    };

    const zoom = getZoomTransform();

    const renderSegment = (side: 'Front' | 'Back', pos: string) => {
        const id = `${side}-${pos}`;
        const isSelected = selectedSegment === id;
        const isDraggedOver = dragOverId === id;

        return (
            <div
                key={id}
                onClick={(e) => { e.stopPropagation(); handleSegmentClick(side, pos); }}
                onDragOver={(e) => onDragOver(e, id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, side, pos)}
                className={`
                    relative flex flex-col items-center justify-center border border-white/10 transition-all duration-300 overflow-hidden
                    ${isSelected ? 'bg-white/30 backdrop-blur-md' : ''}
                    ${isDraggedOver ? 'bg-indigo-500/40' : ''}
                `}
            >
                <AnimatePresence>
                    {isDraggedOver && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 border-4 border-indigo-400/60 shadow-[inset_0_0_30px_rgba(129,140,248,0.5)] pointer-events-none"
                        />
                    )}
                </AnimatePresence>
                <div className="flex flex-col items-center justify-center pointer-events-none z-10 transition-transform duration-300">
                    <span className={`text-white font-bold text-center px-4 break-all text-sm ${isDraggedOver ? 'scale-110' : ''}`}>
                        {sectionData[id] || `${side.toUpperCase()} ${pos}`}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-screen w-screen bg-black overflow-hidden perspective-[1500px]"
        >
            <Header showSearch={true} />
            <AnimatePresence>{isSidebarOpen && <RepositoryList username={username} key="repo-list" />}</AnimatePresence>

            <main className="relative flex h-full w-full items-center justify-center overflow-hidden">
                <motion.div
                    drag={!selectedSegment}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0}
                    onDrag={(_, info) => {
                        rotateY.set(rotateY.get() + info.delta.x * 0.3);
                        rotateX.set(rotateX.get() - info.delta.y * 0.3);
                    }}
                    animate={{
                        x: zoom.x,
                        y: zoom.y,
                        scale: zoom.scale,
                        rotateX: zoom.rx !== null ? zoom.rx : undefined,
                        rotateY: zoom.ry !== null ? zoom.ry : undefined,
                    }}
                    style={{
                        rotateX: zoom.rx === null ? smoothRotateX : undefined,
                        rotateY: zoom.ry === null ? smoothRotateY : undefined,
                        transformStyle: 'preserve-3d',
                    }}
                    transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                    className="relative w-[600px] h-[600px] cursor-grab active:cursor-grabbing"
                >
                    <div
                        className="absolute inset-0 z-10"
                        style={{
                            backfaceVisibility: 'hidden',
                            pointerEvents: isBackFacing ? 'none' : 'auto'
                        }}
                    >
                        <div className="absolute inset-0 rounded-full bg-indigo-600/30 blur-[120px]" />
                        <div className="relative h-full w-full rounded-full overflow-hidden border-[3px] border-white/20 bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900 shadow-[inset_-40px_-40px_100px_rgba(0,0,0,0.8)]">
                            <div className="grid grid-cols-2 grid-rows-2 h-full w-full z-10 relative">
                                {positions.map(pos => renderSegment('Front', pos))}
                            </div>
                        </div>
                    </div>

                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            transform: 'rotateY(180deg)',
                            backfaceVisibility: 'hidden',
                            pointerEvents: isBackFacing ? 'auto' : 'none'
                        }}
                    >
                        <div className="absolute inset-0 rounded-full bg-emerald-600/30 blur-[120px]" />
                        <div className="relative h-full w-full rounded-full overflow-hidden border-[3px] border-white/20 bg-gradient-to-tl from-emerald-900 via-teal-800 to-cyan-900 shadow-[inset_40px_40px_100px_rgba(0,0,0,0.8)]">
                            <div className="grid grid-cols-2 grid-rows-2 h-full w-full z-10 relative">
                                {positions.map(pos => renderSegment('Back', pos))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {!selectedSegment && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-20 text-center pointer-events-none">
                            <h2 className="text-4xl font-black text-white tracking-tighter">GITERRA PLANET</h2>
                            <p className="text-indigo-300 mt-2 text-sm font-bold tracking-widest uppercase">{t('드래그하여 에셋 배치', 'Drag Assets to Assign')}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute top-28 right-12 z-[60] rounded-xl border-2 px-8 py-3 text-lg font-bold bg-black/40 text-white border-white/20 hover:bg-indigo-600/20 hover:border-indigo-400 backdrop-blur-xl transition-all shadow-lg"
                >
                    {isSidebarOpen ? t('닫기', 'CLOSE') : t('편집', 'EDIT P.G')}
                </button>

                <AnimatePresence>
                    {selectedSegment && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleBackToPlanet}
                            className="absolute bottom-12 z-[60] flex items-center gap-3 rounded-full bg-white/10 border border-white/20 px-8 py-4 text-white backdrop-blur-xl hover:bg-white/20 transition-all shadow-2xl"
                        >
                            <RotateCcw size={20} />
                            <span className="font-bold tracking-widest text-lg uppercase">{t('행성으로 돌아가기', 'Back to Planet')}</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </main>
        </motion.div>
    );
};

export default PlanetPage;
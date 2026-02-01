import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Search, ChevronRight, RotateCcw, Loader2, Shield, MessageSquare, Zap, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Header from '../../components/layout/Header';
import InsightCard from '../../components/analysis/InsightCard';
import InsightModal from '../../components/analysis/InsightModal';
import { getHeadline, getPreview, splitMarkdownSections, stripMarkdown } from '../../lib/analysis';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { PlanetData, RepoDetail } from '../../types/store';

// ... (RepositoryList component remains unchanged for now) ...
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
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="absolute right-0 top-0 z-50 h-full w-[500px] bg-black/60 pt-24 backdrop-blur-2xl border-l border-white/10"
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



// [NEW] Detailed Analysis Panel
const DetailPanel = ({
    repo,
    onOpenInsight,
}: {
    repo: RepoDetail;
    onOpenInsight: (title: string, content: string) => void;
}) => {
    const { t } = useLanguageStore();

    const cards = [
        {
            label: t('커뮤니케이션·컨벤션', 'Communication & Convention'),
            content: repo.analysis_sub3 ? stripMarkdown(repo.analysis_sub3) : t('분석 데이터가 없습니다.', 'No analysis data.'),
        },
        {
            label: t('안정성·유지보수', 'Stability & Maintenance'),
            content: repo.analysis_sub2 ? stripMarkdown(repo.analysis_sub2) : t('분석 데이터가 없습니다.', 'No analysis data.'),
        },
        {
            label: t('기술·아키텍처', 'Tech & Architecture'),
            content: repo.analysis_sub1 ? stripMarkdown(repo.analysis_sub1) : t('분석 데이터가 없습니다.', 'No analysis data.'),
        },
        {
            label: t('AI 요약', 'AI Summary'),
            content: repo.analysis_summary ? stripMarkdown(repo.analysis_summary) : t('요약 정보가 없습니다.', 'No summary available.'),
        },
    ].map((item) => ({
        ...item,
        title: getHeadline(item.content) || item.label,
        preview: getPreview(item.content, 130),
    }));

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute right-10 top-24 bottom-24 w-[400px] z-50 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 overflow-y-auto custom-scrollbar shadow-2xl"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl filter drop-shadow-md">
                    {repo.building_type?.includes('Tree') ? '🌳' :
                        repo.building_type?.includes('Building') ? '🏢' :
                            repo.building_type?.includes('Bunker') ? '🏭' :
                                '📦'}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white leading-none">{repo.name}</h2>
                    <span className="text-indigo-400 text-sm font-semibold">{repo.building_type || 'Unknown Asset'}</span>
                    {repo.updated_at && (
                        <span className="block text-xs text-gray-500 mt-1">Last Updated: {new Date(repo.updated_at).toLocaleDateString()}</span>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {cards.map((card) => (
                    <InsightCard
                        key={card.label}
                        label={card.label}
                        title={card.title}
                        preview={card.preview}
                        onClick={() => onOpenInsight(card.label, card.content)}
                    />
                ))}
            </div>
        </motion.div>
    );
};

const PlanetPage = () => {
    const { t } = useLanguageStore();
    const { user } = useAuthStore();
    const location = useLocation();
    const username = location.state?.username ?? user?.login;

    // 만약 username이 있으면 사이드바를 자동으로 열어줌 (선택사항)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 처음엔 닫아둠 (행성이 보이게)
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
    const [sectionData, setSectionData] = useState<{ [key: string]: string }>({});
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // [NEW] Planet Data State
    const [planetData, setPlanetData] = useState<PlanetData | null>(null);
    const [isLoadingPlanet, setIsLoadingPlanet] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeInsight, setActiveInsight] = useState<{ title: string; content: string } | null>(null);

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const [isBackFacing, setIsBackFacing] = useState(false);

    const springConfig = { damping: 30, stiffness: 120 };
    const smoothRotateX = useSpring(rotateX, springConfig);
    const smoothRotateY = useSpring(rotateY, springConfig);

    const overallCards = useMemo(() => {
        const sections = splitMarkdownSections(planetData?.overall_analysis);
        if (sections.length === 0) return [];

        const preferred = sections.filter((section) => /(강점|약점|종합|페르소나)/.test(section.title));
        const selected = (preferred.length > 0 ? preferred : sections).slice(0, 4);

        return selected.map((section) => {
            let icon: LucideIcon = Zap;
            let color = "text-indigo-400";

            if (section.title.includes("강점")) { icon = Zap; color = "text-amber-400"; }
            else if (section.title.includes("약점")) { icon = Target; color = "text-rose-400"; }
            else if (section.title.includes("종합")) { icon = Shield; color = "text-emerald-400"; }
            else if (section.title.includes("페르소나")) { icon = MessageSquare; color = "text-purple-400"; }

            return {
                label: section.title,
                title: getHeadline(section.content) || section.title,
                preview: getPreview(section.content, 80),
                content: section.content,
                icon,
                color
            };
        });
    }, [planetData?.overall_analysis]);

    // [NEW] Get selected repo for Detail Panel


    useEffect(() => {

        if (username) {
            fetchPlanetData();
        }
    }, [username]);

    const fetchPlanetData = async () => {
        setIsLoadingPlanet(true);
        try {
            const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const res = await fetch(`${BASE_URL}/planet/${username}`);
            if (!res.ok) throw new Error('Failed to fetch planet data');
            const data: PlanetData = await res.json();
            setPlanetData(data);

            // [Temporary] Auto-place analyzed repos into slots 
            // 분석된 레포지토리가 있으면 자동으로 슬롯에 할당하여 시각화 (앞면 TL, TR, BL, BR 순서)
            const newSectionData: { [key: string]: string } = {};
            const slots = ['Front-TL', 'Front-TR', 'Front-BL', 'Front-BR', 'Back-TL', 'Back-TR', 'Back-BL', 'Back-BR'];

            // 분석된 레포만 필터링 (building_type이 있는)
            const analyzedRepos = data.repositories.filter(r => r.building_type && r.building_type !== 'Unknown');

            analyzedRepos.forEach((repo, idx) => {
                if (idx < slots.length) {
                    newSectionData[slots[idx]] = repo.name;
                }
            });
            setSectionData((prev) => (Object.keys(prev).length > 0 ? prev : newSectionData));

        } catch (error) {
            console.error("Planet fetch error:", error);
        } finally {
            setIsLoadingPlanet(false);
        }
    };

    const handleAnalyze = async () => {
        if (!username || isAnalyzing) return;

        const selectedRepos = Array.from(new Set(Object.values(sectionData)))
            .map((repoName) => repoName.trim())
            .filter((repoName) => repoName.length > 0);

        if (selectedRepos.length === 0) {
            alert(t('레포지토리를 슬롯에 배치해주세요.', 'Place repositories into slots first.'));
            return;
        }

        setIsAnalyzing(true);
        try {
            const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const res = await fetch(`${BASE_URL}/analyze/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    github_username: username,
                    selected_repos: selectedRepos,
                }),
            });

            if (!res.ok) {
                let errorMessage = 'Failed to analyze repositories';
                const errorText = await res.text();

                if (errorText) {
                    try {
                        const errorJson = JSON.parse(errorText) as { detail?: string };
                        errorMessage = errorJson.detail ?? errorMessage;
                    } catch (parseError) {
                        errorMessage = errorText;
                    }
                }

                throw new Error(errorMessage);
            }

            await fetchPlanetData();
        } catch (error) {
            console.error('Analyze error:', error);
            alert(t('분석에 실패했습니다.', 'Analysis failed.'));
        } finally {
            setIsAnalyzing(false);
        }
    };

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

    // Helper to find repo details
    const getRepoInSlot = (slotId: string) => {
        const repoName = sectionData[slotId];
        if (!repoName) return null;

        const repo = planetData?.repositories.find(r => r.name === repoName);
        if (repo) return repo;

        return {
            name: repoName,
            stars: 0,
            building_type: 'Unknown',
        } satisfies RepoDetail;
    };

    // [NEW] Get selected repo for Detail Panel
    const selectedRepo = selectedSegment ? getRepoInSlot(selectedSegment) : null;

    const renderSegment = (side: 'Front' | 'Back', pos: string) => {
        const id = `${side}-${pos}`;
        const isSelected = selectedSegment === id;
        const isDraggedOver = dragOverId === id;
        const repo = getRepoInSlot(id);

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
                    {/* [NEW] Show Building Type if available */}
                    {repo ? (
                        <div className="text-center">
                            <span className="block text-2xl mb-1 filter drop-shadow-md">
                                {/* Simple Emoji/Icon mapping for now */}
                                {repo.building_type?.includes('Tree') ? '🌳' :
                                    repo.building_type?.includes('Building') ? '🏢' :
                                        repo.building_type?.includes('Bunker') ? '🏭' :
                                            '📦'}
                            </span>
                            <span className={`text-white font-bold text-sm ${isDraggedOver ? 'scale-110' : ''}`}>
                                {repo.name}
                            </span>
                            <span className="block text-[10px] text-white/70 mt-1">{repo.building_type}</span>
                        </div>
                    ) : (
                        <span className={`text-white/30 font-bold text-center px-4 break-all text-sm ${isDraggedOver ? 'scale-110' : ''}`}>
                            Empty Slot
                        </span>
                    )}
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

            {/* [NEW] Planet Persona HUD */}
            {planetData && !selectedSegment && (
                <div className="absolute top-24 left-10 z-10">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-black/60 backdrop-blur-2xl border border-indigo-500/30 p-6 rounded-3xl max-w-sm shadow-[0_0_50px_-10px_rgba(79,70,229,0.3)]"
                    >
                        {isLoadingPlanet ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin text-indigo-400" size={16} />
                                <span className="text-indigo-200 text-sm">Loading Planet Data...</span>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-1">PLANET PERSONA</h2>
                                <h1 className="text-3xl font-black text-white mb-2 leading-tight">{planetData.persona.split('(')[0]}</h1>
                                {planetData.persona.includes('(') && (
                                    <span className="text-white/50 text-sm font-mono block mb-4">{planetData.persona.match(/\((.*?)\)/)?.[1]}</span>
                                )}

                                <div className="flex gap-4 border-t border-white/10 pt-4">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase">Contribution</div>
                                        <div className="text-xl font-bold text-white">{planetData.total_score}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase">Repos</div>
                                        <div className="text-xl font-bold text-white">{planetData.repositories.length}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase">Theme</div>
                                        <div className="text-xl font-bold text-indigo-300 capitalize">{planetData.theme.replace('_', ' ')}</div>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-white/10 pt-4">
                                    <div className="text-xs text-gray-400 uppercase mb-2">{t('전체 분석', 'Overall Analysis')}</div>
                                    {overallCards.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {overallCards.map((card) => (
                                                <InsightCard
                                                    key={card.label}
                                                    label={card.label}
                                                    title={card.title}
                                                    preview={card.preview}
                                                    icon={card.icon}
                                                    color={card.color}
                                                    onClick={() => setActiveInsight({ title: card.label, content: card.content })}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-white/60 leading-relaxed">
                                            {t('아직 전체 분석이 없습니다. 우측 상단에서 분석 생성을 눌러주세요.', 'No overall analysis yet. Click ANALYZE to generate it.')}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={!username || isAnalyzing || Object.keys(sectionData).length === 0}
                                    className="w-full mt-6 rounded-xl border border-white/20 bg-indigo-600/20 py-3 text-sm font-bold text-white hover:bg-indigo-500/30 hover:border-indigo-400 transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isAnalyzing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            {t('분석 중...', 'Analyzing...')}
                                        </span>
                                    ) : (
                                        t('새 분석 데이터 생성', 'GENERATE NEW ANALYSIS')
                                    )}
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            )}

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

                {/* [NEW] Detail Panel for Selected Repo */}
                <AnimatePresence>
                    {selectedSegment && selectedRepo && (
                        <DetailPanel
                            repo={selectedRepo}
                            onOpenInsight={(title, content) => setActiveInsight({ title, content })}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {!selectedSegment && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-20 text-center pointer-events-none">
                            <h2 className="text-4xl font-black text-white tracking-tighter">GITERRA PLANET</h2>
                            <p className="text-indigo-300 mt-2 text-sm font-bold tracking-widest uppercase">{t('드래그하여 에셋 배치', 'Drag Assets to Assign')}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute top-28 right-12 z-[60] flex flex-col items-end gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="rounded-xl border-2 px-8 py-3 text-lg font-bold bg-black/40 text-white border-white/20 hover:bg-indigo-600/20 hover:border-indigo-400 backdrop-blur-xl transition-all shadow-lg"
                    >
                        {isSidebarOpen ? t('닫기', 'CLOSE') : t('편집', 'EDIT P.G')}
                    </button>
                </div>

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

            <AnimatePresence>
                {activeInsight && (
                    <InsightModal
                        title={activeInsight.title}
                        content={activeInsight.content}
                        onClose={() => setActiveInsight(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PlanetPage;
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ChevronRight, ArrowLeft, GitCommit, X, ToggleLeft, ToggleRight, Loader2, Database } from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';

import { generatePlanetFromCommits } from '../../utils/planetGenerator';
import type { PlanetConfig, PlanetAsset, CommitData, CommitType } from '../../types';
import PlanetAssetRenderer from '../../components/planet/PlanetAssetRenderer';
import { useLanguageStore } from '../../store/useLanguageStore';
import Header from '../../components/layout/Header';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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

const parseCommitType = (message: string): CommitType => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('feat') || lowerMsg.includes('add')) return 'feat';
    if (lowerMsg.includes('fix') || lowerMsg.includes('bug')) return 'fix';
    if (lowerMsg.includes('refactor')) return 'refactor';
    if (lowerMsg.includes('docs')) return 'docs';
    if (lowerMsg.includes('style') || lowerMsg.includes('design')) return 'style';
    if (lowerMsg.includes('chore')) return 'chore';
    return 'chore';
};

const RepositoryList = ({
    username,
    isMockMode,
    setIsMockMode
}: {
    username?: string,
    isMockMode: boolean,
    setIsMockMode: (v: boolean) => void
}) => {
    const { t } = useLanguageStore();
    const [repos, setRepos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const mockRepos = [
        { name: 'Giterra-Core', stars: 120, language: 'TypeScript' },
        { name: 'Giterra-Frontend', stars: 85, language: 'TypeScript' },
        { name: 'AI-Model', stars: 200, language: 'Python' },
        { name: 'Legacy-Server', stars: 12, language: 'JavaScript' },
        { name: 'Docs-Project', stars: 45, language: 'Markdown' },
        { name: 'Design-System', stars: 60, language: 'CSS' },
    ];

    useEffect(() => {
        if (isMockMode) {
            setRepos(mockRepos);
        } else if (username) {
            fetchRealRepos();
        }
    }, [isMockMode, username]);

    const fetchRealRepos = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/repos/${username}`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setRepos(data);
        } catch (e) {
            console.error("Repo fetch failed, switching to mock", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, repoName: string) => {
        e.dataTransfer.setData("repoName", repoName);
        e.dataTransfer.setData("mode", isMockMode ? "mock" : "real");
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="absolute right-0 top-0 z-50 h-full w-[500px] bg-black/60 pt-24 backdrop-blur-2xl border-l border-white/10"
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
                        {repos.map((repo, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, repo.name)}
                                className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all"
                            >
                                <div>
                                    <div className="text-sm font-semibold text-white">{repo.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">{repo.language || 'Unknown'} • ⭐ {repo.stars || 0}</div>
                                </div>
                                <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const PlanetBorders = () => {
    const radius = 100.2;
    const thickness = 0.3;
    const color = "#ffffff";
    const opacity = 0.15;

    return (
        <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, thickness, 16, 100]} /><meshBasicMaterial color={color} transparent opacity={opacity} /></mesh>
            <mesh rotation={[0, 0, 0]}><torusGeometry args={[radius, thickness, 16, 100]} /><meshBasicMaterial color={color} transparent opacity={opacity} /></mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[radius, thickness, 16, 100]} /><meshBasicMaterial color={color} transparent opacity={opacity} /></mesh>
        </group>
    );
};

const DropDetector = ({ isDragging, mousePosRef, segmentsGroupRef, hoveredRef, setHoveredSegmentState }: any) => {
    const { camera, raycaster } = useThree();
    useFrame(() => {
        if (!isDragging || !segmentsGroupRef.current) return;
        const pointer = new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y);
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(segmentsGroupRef.current.children, true);
        if (intersects.length > 0) {
            const index = intersects[0].object.userData.index;
            if (hoveredRef.current !== index) {
                hoveredRef.current = index;
                setHoveredSegmentState(index);
            }
        } else {
            if (hoveredRef.current !== null) {
                hoveredRef.current = null;
                setHoveredSegmentState(null);
            }
        }
    });
    return null;
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

const InteractionSegments = ({ segmentsGroupRef, onClick }: any) => {
    const radius = 100;
    return (
        <group ref={segmentsGroupRef}>
            {Array.from({ length: 8 }).map((_, i) => {
                const isTop = i < 4;
                const quadrant = i % 4;
                const phiStart = isTop ? 0 : Math.PI / 2;
                const thetaStart = quadrant * (Math.PI / 2);
                return (
                    <mesh key={i} userData={{ index: i }} onClick={(e) => { e.stopPropagation(); onClick(i); }}>
                        <sphereGeometry args={[radius, 32, 32, thetaStart, Math.PI / 2, phiStart, Math.PI / 2]} />
                        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
                    </mesh>
                );
            })}
        </group>
    );
};

const SegmentHighlight = ({ segmentIndex }: { segmentIndex: number | null }) => {
    if (segmentIndex === null) return null;
    const isTop = segmentIndex < 4;
    const quadrant = segmentIndex % 4;
    const phiStart = isTop ? 0 : Math.PI / 2;
    const thetaStart = quadrant * (Math.PI / 2);
    return (
        <mesh>
            <sphereGeometry args={[100.1, 32, 32, thetaStart, Math.PI / 2, phiStart, Math.PI / 2]} />
            <meshBasicMaterial color="#6366f1" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
    );
};

// [Camera Controller] 타입 수정됨: OrbitControlsImpl | null
const CameraController = ({
    targetSegment,
    controlsRef
}: {
    targetSegment: number | null,
    controlsRef: React.RefObject<OrbitControlsImpl | null>
}) => {
    const { camera } = useThree();

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
        if (!controlsRef.current) return;
        const controls = controlsRef.current;
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

        if (targetSegment !== null) {
            const isTop = targetSegment < 4;
            const quadrant = targetSegment % 4;

            const phi = isTop ? Math.PI / 4 : (Math.PI * 3) / 4;
            const theta = (quadrant * Math.PI) / 2 + Math.PI / 4;

            const rSurface = 100;
            const lookX = -rSurface * Math.cos(theta) * Math.sin(phi);
            const lookY = rSurface * Math.cos(phi);
            const lookZ = rSurface * Math.sin(theta) * Math.sin(phi);

            const rCamera = 280;
            const camX = -rCamera * Math.cos(theta) * Math.sin(phi);
            const camY = rCamera * Math.cos(phi);
            const camZ = rCamera * Math.sin(theta) * Math.sin(phi);

            gsap.to(controls.target, {
                x: lookX, y: lookY, z: lookZ,
                duration: 1.5,
                ease: "power3.inOut",
                onUpdate: () => controls.update()
            });

            gsap.to(camera.position, {
                x: camX, y: camY, z: camZ,
                duration: 1.5,
                ease: "power3.inOut"
            });

        } else {
            gsap.to(controls.target, {
                x: 0, y: 0, z: 0,
                duration: 1.2,
                ease: "power2.out",
                onUpdate: () => controls.update()
            });

            gsap.to(camera.position, {
                x: 0, y: 0, z: 280,
                duration: 1.2,
                ease: "power2.out"
            });
        }
    }, [targetSegment, camera, controlsRef]);

    return null;
};

const PlanetPage = () => {
    const location = useLocation();
    const username = location.state?.username || "Guest";

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMockMode, setIsMockMode] = useState(true);
    const [isLoadingSegment, setIsLoadingSegment] = useState<number | null>(null);

    const [segmentConfigs, setSegmentConfigs] = useState<Record<number, PlanetConfig>>({});
    const [repoNames, setRepoNames] = useState<Record<number, string>>({}); // 여기서 사용됨

    const [focusedSegment, setFocusedSegment] = useState<number | null>(null);
    const [hoveredSegmentState, setHoveredSegmentState] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<PlanetAsset | null>(null);

    const hoveredSegmentRef = useRef<number | null>(null);
    const segmentsGroupRef = useRef<THREE.Group>(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const controlsRef = useRef<OrbitControlsImpl>(null);

    const createMockCommits = (seedName: string) => {
        const count = 20 + Math.floor(Math.random() * 30);
        return Array.from({ length: count }, (_, i) => ({
            id: `mock-${seedName}-${i}`,
            message: `feat: Mock implementation for ${seedName} #${i}`,
            type: ['feat', 'fix', 'refactor', 'docs', 'chore', 'style'][Math.floor(Math.random() * 6)] as any,
            date: new Date().toISOString()
        }));
    };

    const fetchRealCommits = async (repoName: string) => {
        const res = await fetch(`${API_BASE_URL}/repos/${username}/${repoName}/commits`);
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();

        return data.map((item: any) => ({
            id: item.sha,
            message: item.commit.message,
            type: parseCommitType(item.commit.message),
            date: item.commit.author.date
        }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        mousePosRef.current = { x, y };
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const repoName = e.dataTransfer.getData("repoName");
        const dropMode = e.dataTransfer.getData("mode");
        const targetSegment = hoveredSegmentRef.current;

        if (repoName && targetSegment !== null) {
            setIsLoadingSegment(targetSegment);

            try {
                let commits: CommitData[] = [];
                if (dropMode === 'real' && username !== "Guest") {
                    commits = await fetchRealCommits(repoName);
                } else {
                    await new Promise(r => setTimeout(r, 500));
                    commits = createMockCommits(repoName);
                }

                const config = generatePlanetFromCommits(commits, targetSegment);

                setSegmentConfigs(prev => ({ ...prev, [targetSegment]: config }));
                setRepoNames(prev => ({ ...prev, [targetSegment]: repoName }));
                setFocusedSegment(targetSegment);

            } catch (error) {
                console.error("Drop Error:", error);
                alert("Failed to load repo data.");
            } finally {
                setIsLoadingSegment(null);
            }
        }

        hoveredSegmentRef.current = null;
        setHoveredSegmentState(null);
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

            <main
                className="relative h-full w-full"
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <Canvas camera={{ position: [0, 0, 280], fov: 45 }}>
                    <color attach="background" args={['#050505']} />
                    <ambientLight intensity={0.2} />
                    <pointLight position={[100, 100, 100]} intensity={2} />
                    <pointLight position={[-100, -50, -50]} intensity={1} color="#4f46e5" />

                    <mesh onClick={(e) => { e.stopPropagation(); setFocusedSegment(null); setSelectedAsset(null); }}>
                        <sphereGeometry args={[99, 64, 64]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
                    </mesh>

                    <PlanetBorders />

                    {Object.values(segmentConfigs).map((config) => (
                        <group key={config.assets[0]?.id || Math.random()}>
                            {config.assets.map(asset => (
                                <group key={asset.id} onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }}>
                                    <PlanetAssetRenderer asset={asset} />
                                </group>
                            ))}
                        </group>
                    ))}

                    {isLoadingSegment !== null && (
                        <Html position={[0, 0, 0]} center>
                            <div className="flex flex-col items-center justify-center pointer-events-none">
                                <Loader2 className="animate-spin text-indigo-400 w-12 h-12" />
                                <span className="text-indigo-200 text-sm font-bold mt-2 bg-black/50 px-2 rounded">Generating...</span>
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
                        </Html>
                    )}

                    <DropDetector
                        isDragging={isDragging}
                        mousePosRef={mousePosRef}
                        segmentsGroupRef={segmentsGroupRef}
                        hoveredRef={hoveredSegmentRef}
                        setHoveredSegmentState={setHoveredSegmentState}
                    />

                    <InteractionSegments
                        segmentsGroupRef={segmentsGroupRef}
                        onClick={(idx: number) => {
                            if (focusedSegment !== idx) {
                                setFocusedSegment(idx);
                                setSelectedAsset(null);
                            }
                        }}
                    />

                    {isDragging && <SegmentHighlight segmentIndex={hoveredSegmentState} />}

                    <CameraController targetSegment={focusedSegment} controlsRef={controlsRef} />

                    <OrbitControls
                        ref={controlsRef}
                        makeDefault
                        minDistance={120}
                        maxDistance={500}
                        enablePan={false}
                        enableRotate={focusedSegment === null}
                        enableZoom={focusedSegment === null}
                    />

                    <Stars radius={300} count={5000} factor={4} fade />
                    <Environment preset="city" />
                </Canvas>

                {/* --- UI Overlays --- */}

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
                    {focusedSegment !== null && (
                        <>
                            {/* [수정됨] 상단 구역 정보 패널: 우측 상단으로 이동 */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }} // 오른쪽에서 스윽 나타나게 변경
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="absolute top-24 right-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-right z-40 shadow-2xl"
                            >
                                <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center justify-end gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    SECTOR {focusedSegment + 1}
                                </div>
                                <h1 className="text-3xl font-black text-white flex items-center justify-end gap-3">
                                    {repoNames[focusedSegment] || "Unknown Repository"}
                                    <Database size={24} className="text-gray-400" />
                                </h1>
                                {/* 추가 정보: 테마 표시 */}
                                <div className="text-gray-400 text-sm mt-1 font-mono">
                                    {segmentConfigs[focusedSegment]?.theme?.replace('_', ' ') || 'ANALYZING...'}
                                </div>
                            </motion.div>

                            {/* 하단 뒤로가기 버튼 (그대로 유지) */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                onClick={() => { setFocusedSegment(null); setSelectedAsset(null); }}
                                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full backdrop-blur-md border border-white/20 font-bold shadow-2xl transition-all z-50"
                            >
                                <ArrowLeft size={20} />
                                <span>Return to Orbit</span>
                            </motion.button>
                        </>
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
                    {selectedAsset && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="absolute right-10 top-1/2 -translate-y-1/2 w-80 bg-black/80 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl p-6 z-50 shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                    <GitCommit className="text-indigo-400" size={24} />
                                </div>
                                <button onClick={() => setSelectedAsset(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <h3 className="text-white font-bold text-sm mb-1 break-all">{selectedAsset.sourceCommitId}</h3>
                            <div className="text-indigo-400 text-xs font-mono mb-4 uppercase tracking-wider">{selectedAsset.type.replace('_', ' ')}</div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <p className="text-gray-300 text-sm italic">{selectedAsset.type.includes('feat') ? "Implemented new feature" : "Update committed"}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute bottom-8 right-8 flex gap-4 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 font-bold"
                    >
                        {isSidebarOpen ? "Hide Repos" : "Show Repos"}
                    </button>
                </div>
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
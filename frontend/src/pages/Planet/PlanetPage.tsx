import { useState, useEffect, useRef, useMemo } from 'react';
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
import InsightCard from '../../components/analysis/InsightCard';
import InsightModal from '../../components/analysis/InsightModal';
import { getHeadline, getPreview, splitMarkdownSections, stripMarkdown } from '../../lib/analysis';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { PlanetData, RepoDetail } from '../../types/store';
import Header from '../../components/layout/Header';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

    useEffect(() => {
        if (!controlsRef.current) return;
        const controls = controlsRef.current;

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
    const { t } = useLanguageStore();
    const { user } = useAuthStore();
    const location = useLocation();
    const username = location.state?.username ?? user?.login ?? "Guest";

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMockMode, setIsMockMode] = useState(true);
    const [isLoadingSegment, setIsLoadingSegment] = useState<number | null>(null);

    const [segmentConfigs, setSegmentConfigs] = useState<Record<number, PlanetConfig>>({});
    const [repoNames, setRepoNames] = useState<Record<number, string>>({});

    const [planetData, setPlanetData] = useState<PlanetData | null>(null);
    const [isLoadingPlanet, setIsLoadingPlanet] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeInsight, setActiveInsight] = useState<{ title: string; content: string } | null>(null);

    const [focusedSegment, setFocusedSegment] = useState<number | null>(null);
    const [hoveredSegmentState, setHoveredSegmentState] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<PlanetAsset | null>(null);

    const hoveredSegmentRef = useRef<number | null>(null);
    const segmentsGroupRef = useRef<THREE.Group>(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const controlsRef = useRef<OrbitControlsImpl>(null);

    const assignedRepos = useMemo(
        () => Array.from(new Set(Object.values(repoNames))).filter((name) => Boolean(name)),
        [repoNames],
    );

    const focusedRepo: RepoDetail | null = useMemo(() => {
        if (focusedSegment === null) return null;
        const repoName = repoNames[focusedSegment];
        if (!repoName || !planetData) return null;
        return planetData.repositories.find((repo) => repo.name === repoName) ?? null;
    }, [focusedSegment, planetData, repoNames]);

    const overallCards = useMemo(() => {
        const sections = splitMarkdownSections(planetData?.overall_analysis);
        const preferred = sections.filter((section) => /(강점|약점|종합|페르소나)/.test(section.title));
        const selected = (preferred.length > 0 ? preferred : sections).slice(0, 4);

        return selected.map((section) => ({
            label: section.title,
            title: getHeadline(section.content) || section.title,
            preview: getPreview(section.content, 120),
            content: section.content,
        }));
    }, [planetData?.overall_analysis]);

    const fetchPlanetData = async () => {
        if (!username || username === "Guest") {
            setPlanetData(null);
            return;
        }

        setIsLoadingPlanet(true);
        try {
            const res = await fetch(`${API_BASE_URL}/planet/${username}`);
            if (!res.ok) {
                setPlanetData(null);
                return;
            }

            const data: PlanetData = await res.json();
            setPlanetData(data);
        } catch (error) {
            console.error('Planet fetch error:', error);
            setPlanetData(null);
        } finally {
            setIsLoadingPlanet(false);
        }
    };

    useEffect(() => {
        void fetchPlanetData();
    }, [username]);

    const handleAnalyze = async () => {
        if (!username || username === "Guest") {
            alert(t('로그인 후 분석을 생성할 수 있습니다.', 'Please log in to generate analysis.'));
            return;
        }

        if (isMockMode) {
            alert(t('REAL API 모드에서만 분석을 생성할 수 있습니다.', 'Analysis is only available in REAL API mode.'));
            return;
        }

        if (assignedRepos.length === 0) {
            alert(t('먼저 레포지토리를 구역에 배치해주세요.', 'Drop repositories onto sectors first.'));
            return;
        }

        if (isAnalyzing) return;

        setIsAnalyzing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/analyze/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    github_username: username,
                    selected_repos: assignedRepos,
                }),
            });

            if (!res.ok) {
                let errorMessage = 'Failed to analyze repositories';
                const errorText = await res.text();

                if (errorText) {
                    try {
                        const errorJson = JSON.parse(errorText) as { detail?: string };
                        errorMessage = errorJson.detail ?? errorMessage;
                    } catch {
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

                <AnimatePresence>
                    {username !== "Guest" && (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className={`absolute top-24 ${isSidebarOpen ? 'left-[370px]' : 'left-10'} z-40 w-[360px] bg-black/60 backdrop-blur-2xl border border-indigo-500/30 rounded-3xl p-6 shadow-[0_0_50px_-10px_rgba(79,70,229,0.3)]`}
                        >
                            {isLoadingPlanet ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin text-indigo-400" size={16} />
                                    <span className="text-indigo-200 text-sm">Loading Planet Data...</span>
                                </div>
                            ) : planetData ? (
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
                                            <div className="space-y-3">
                                                {overallCards.map((card) => (
                                                    <InsightCard
                                                        key={card.label}
                                                        label={card.label}
                                                        title={card.title}
                                                        preview={card.preview}
                                                        onClick={() => setActiveInsight({ title: card.label, content: card.content })}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-white/60 leading-relaxed">
                                                {t('아직 전체 분석이 없습니다. 우측 하단에서 분석 생성을 눌러주세요.', 'No overall analysis yet. Click ANALYZE to generate it.')}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-white/60 leading-relaxed">
                                    {t('아직 분석 데이터가 없습니다. 레포를 배치한 뒤 분석 생성을 눌러주세요.', 'No analysis data yet. Drop repos then click ANALYZE.')}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- UI Overlays --- */}

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

                                <div className="mt-4">
                                    {focusedRepo ? (
                                        <InsightCard
                                            label={t('커뮤니케이션·컨벤션', 'Communication & Convention')}
                                            title={
                                                getHeadline(focusedRepo.analysis_sub3 ? stripMarkdown(focusedRepo.analysis_sub3) : '') ||
                                                t('분석 데이터가 없습니다.', 'No analysis data.')
                                            }
                                            preview={getPreview(
                                                focusedRepo.analysis_sub3 ? stripMarkdown(focusedRepo.analysis_sub3) : t('분석 데이터가 없습니다.', 'No analysis data.'),
                                                110,
                                            )}
                                            onClick={() =>
                                                setActiveInsight({
                                                    title: t('커뮤니케이션·컨벤션', 'Communication & Convention'),
                                                    content: focusedRepo.analysis_sub3
                                                        ? stripMarkdown(focusedRepo.analysis_sub3)
                                                        : t('분석 데이터가 없습니다.', 'No analysis data.'),
                                                })
                                            }
                                        />
                                    ) : (
                                        <div className="text-sm text-white/50 leading-relaxed">
                                            {t('이 레포의 분석 데이터가 없습니다.', 'No analysis for this repo yet.')}
                                        </div>
                                    )}
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
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || isMockMode || username === "Guest" || assignedRepos.length === 0}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 font-bold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                {t('분석 중...', 'Analyzing...')}
                            </span>
                        ) : (
                            t('분석 생성', 'ANALYZE')
                        )}
                    </button>

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
        </div>
    );
};

export default PlanetPage;
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ChevronRight, ArrowLeft, GitCommit, X, ToggleLeft, ToggleRight, Loader2, Database, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
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
import { API_BASE_URL } from '../../lib/apiBase';

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
    setIsMockMode,
    assignedCount,
    accessToken,
    onUnauthorized,
}: {
    username?: string,
    isMockMode: boolean,
    setIsMockMode: (v: boolean) => void,
    assignedCount: number,
    accessToken: string | null,
    onUnauthorized: () => void,
}) => {
    const { t } = useLanguageStore();
    const [repos, setRepos] = useState<Array<{ name: string; stars: number; language?: string }>>([]);
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
    }, [isMockMode, username, accessToken]);

    const fetchRealRepos = async () => {
        if (!accessToken) {
            onUnauthorized();
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/repos/${username}`, {
                headers: {
                    Authorization: `token ${accessToken}`,
                },
            });

            if (res.status === 401) {
                onUnauthorized();
                return;
            }

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
            className="absolute left-0 top-0 z-50 h-full w-[84vw] max-w-[380px] border-r border-white/10 bg-black/65 pt-24 backdrop-blur-xl md:w-[360px]"
        >
            <div className="flex h-full flex-col px-4 md:px-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">{t('Repositories', 'Repositories')}</h2>
                        <p className="mt-1 text-xs text-white/50">
                            {t('배치 완료', 'Assigned')}: <span className="font-semibold text-teal-300">{assignedCount}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setIsMockMode(!isMockMode)}
                        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-teal-200 transition-colors hover:bg-white/20"
                    >
                        {isMockMode ? "MOCK DATA" : "REAL API"}
                        {isMockMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-teal-200" /></div>
                ) : (
                    <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar pb-10">
                        {repos.map((repo, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, repo.name)}
                                className="group flex cursor-grab items-center justify-between rounded-xl border border-white/10 bg-black/45 p-3 transition-all hover:border-teal-300/45 hover:bg-black/25 active:cursor-grabbing"
                            >
                                <div>
                                    <div className="text-sm font-semibold text-white">{repo.name}</div>
                                    <div className="mt-1 text-xs text-white/55">{repo.language || 'Unknown'} • ⭐ {repo.stars || 0}</div>
                                </div>
                                <ChevronRight size={16} className="text-white/35 group-hover:text-teal-200" />
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
    const color = "#c9d6e3";
    const opacity = 0.12;

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
            <meshBasicMaterial color="#14b8a6" transparent opacity={0.28} side={THREE.DoubleSide} />
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
    const { user, accessToken, clearAuth } = useAuthStore();
    const username = user?.login ?? "Guest";

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
    const [isCompactLayout, setIsCompactLayout] = useState(false);

    const hoveredSegmentRef = useRef<number | null>(null);
    const segmentsGroupRef = useRef<THREE.Group>(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const controlsRef = useRef<OrbitControlsImpl>(null);
    const authHeaders = useMemo(
        () => (accessToken ? { Authorization: `token ${accessToken}` } : null),
        [accessToken],
    );

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

    const handleUnauthorized = () => {
        clearAuth();
    };

    const fetchPlanetData = async () => {
        if (!username || username === "Guest") {
            setPlanetData(null);
            return;
        }

        if (!authHeaders) {
            handleUnauthorized();
            return;
        }

        setIsLoadingPlanet(true);
        try {
            const res = await fetch(`${API_BASE_URL}/planet/${username}`, {
                headers: authHeaders,
            });

            if (res.status === 401) {
                handleUnauthorized();
                return;
            }

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

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const media = window.matchMedia('(max-width: 1024px)');
        const syncLayout = (matches: boolean) => {
            setIsCompactLayout(matches);
            setIsSidebarOpen(!matches);
        };

        syncLayout(media.matches);

        const onChange = (event: MediaQueryListEvent) => syncLayout(event.matches);
        media.addEventListener('change', onChange);

        return () => {
            media.removeEventListener('change', onChange);
        };
    }, []);

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
        if (!authHeaders) {
            handleUnauthorized();
            return;
        }

        setIsAnalyzing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/analyze/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    github_username: username,
                    selected_repos: assignedRepos,
                }),
            });

            if (res.status === 401) {
                handleUnauthorized();
                return;
            }

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
        if (!authHeaders) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        }

        const res = await fetch(`${API_BASE_URL}/repos/${username}/${repoName}/commits`, {
            headers: authHeaders,
        });

        if (res.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        }

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

    const isGuest = username === "Guest";
    const summaryPanelLeft = isSidebarOpen && !isCompactLayout ? 'left-[380px]' : 'left-3';

    return (
        <div className="relative h-screen w-screen overflow-hidden app-gradient-bg">
            <Header showSearch={true} searchTarget="/planet" />

            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {isCompactLayout && (
                            <motion.button
                                type="button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSidebarOpen(false)}
                                className="absolute inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
                                aria-label="Close sidebar overlay"
                            />
                        )}
                        <RepositoryList
                            key="sidebar"
                            username={username}
                            isMockMode={isMockMode}
                            setIsMockMode={setIsMockMode}
                            assignedCount={assignedRepos.length}
                            accessToken={accessToken}
                            onUnauthorized={handleUnauthorized}
                        />
                    </>
                )}
            </AnimatePresence>

            <main
                className="relative h-full w-full"
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <Canvas camera={{ position: [0, 0, 280], fov: 45 }}>
                    <color attach="background" args={['#060f15']} />
                    <ambientLight intensity={0.25} />
                    <pointLight position={[100, 100, 100]} intensity={2} />
                    <pointLight position={[-100, -50, -50]} intensity={1} color="#14b8a6" />

                    <mesh onClick={(e) => { e.stopPropagation(); setFocusedSegment(null); setSelectedAsset(null); }}>
                        <sphereGeometry args={[99, 64, 64]} />
                        <meshStandardMaterial color="#112231" roughness={0.8} metalness={0.2} />
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
                                <Loader2 className="h-12 w-12 animate-spin text-teal-300" />
                                <span className="mt-2 rounded bg-black/55 px-2 text-sm font-bold text-teal-100">Generating...</span>
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

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70rem_35rem_at_10%_100%,rgba(20,184,166,0.14),transparent_60%),radial-gradient(60rem_35rem_at_100%_0%,rgba(245,158,11,0.12),transparent_55%)]" />

                <AnimatePresence>
                    {!isGuest && (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className={`absolute top-24 ${summaryPanelLeft} z-40 w-[min(92vw,370px)] rounded-3xl border border-white/15 bg-black/62 p-4 shadow-2xl backdrop-blur-2xl md:p-5`}
                        >
                            {isLoadingPlanet ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin text-teal-300" size={16} />
                                    <span className="text-sm text-teal-100">Loading Planet Data...</span>
                                </div>
                            ) : planetData ? (
                                <>
                                    <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-300">PLANET PERSONA</h2>
                                    <h1 className="mb-2 text-2xl font-black leading-tight text-white md:text-3xl">{planetData.persona.split('(')[0]}</h1>
                                    {planetData.persona.includes('(') && (
                                        <span className="mb-4 block text-sm font-mono text-white/50">{planetData.persona.match(/\((.*?)\)/)?.[1]}</span>
                                    )}

                                    <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                                        <div>
                                            <div className="text-[11px] uppercase text-white/50">Contribution</div>
                                            <div className="text-xl font-bold text-white">{planetData.total_score}</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] uppercase text-white/50">Repos</div>
                                            <div className="text-xl font-bold text-white">{planetData.repositories.length}</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] uppercase text-white/50">Theme</div>
                                            <div className="text-xl font-bold capitalize text-amber-300">{planetData.theme.replace('_', ' ')}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <div className="mb-2 text-xs uppercase text-white/55">{t('전체 분석', 'Overall Analysis')}</div>
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
                            <motion.div
                                initial={{ opacity: 0, x: 50 }} // 오른쪽에서 스윽 나타나게 변경
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="absolute right-3 top-24 z-40 w-[min(92vw,420px)] rounded-2xl border border-white/15 bg-black/62 p-4 text-right shadow-2xl backdrop-blur-xl md:right-8 md:p-6"
                            >
                                <div className="mb-2 flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-widest text-teal-300">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />
                                    SECTOR {focusedSegment + 1}
                                </div>
                                <h1 className="flex items-center justify-end gap-3 text-2xl font-black text-white md:text-3xl">
                                    {repoNames[focusedSegment] || "Unknown Repository"}
                                    <Database size={22} className="text-white/50" />
                                </h1>
                                <div className="mt-1 text-sm font-mono text-white/50">
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

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                onClick={() => { setFocusedSegment(null); setSelectedAsset(null); }}
                                className="absolute bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/55 px-6 py-2.5 font-bold text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black/70 md:px-8 md:py-3"
                            >
                                <ArrowLeft size={20} />
                                <span>{t('궤도로 돌아가기', 'Return to Orbit')}</span>
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
                            className="absolute bottom-22 left-3 right-3 z-50 rounded-3xl border border-white/15 bg-black/82 p-4 shadow-2xl backdrop-blur-2xl md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:w-80 md:-translate-y-1/2 md:p-6"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="rounded-2xl bg-teal-400/20 p-3">
                                    <GitCommit className="text-teal-300" size={24} />
                                </div>
                                <button onClick={() => setSelectedAsset(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
                            </div>
                            <h3 className="mb-1 break-all text-sm font-bold text-white">{selectedAsset.sourceCommitId}</h3>
                            <div className="mb-4 text-xs font-mono uppercase tracking-wider text-teal-300">{selectedAsset.type.replace('_', ' ')}</div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-sm italic text-white/75">{selectedAsset.type.includes('feat') ? "Implemented new feature" : "Update committed"}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute bottom-4 left-1/2 z-30 flex w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 flex-col gap-2 sm:flex-row">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || isMockMode || isGuest || assignedRepos.length === 0}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-300/35 bg-amber-400 px-5 py-3 font-bold text-slate-900 backdrop-blur-md transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                {t('분석 중...', 'Analyzing...')}
                            </span>
                        ) : (
                            <>
                                <Sparkles size={17} />
                                {t('분석 생성', 'ANALYZE')}
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/55 px-5 py-3 font-bold text-white transition-colors hover:bg-black/70 sm:min-w-[210px]"
                    >
                        {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
                        {isSidebarOpen ? t('레포 숨기기', 'Hide Repos') : t('레포 보기', 'Show Repos')}
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

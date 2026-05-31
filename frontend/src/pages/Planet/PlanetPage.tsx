import { useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, Home, Loader2, Search, Sparkles, X } from 'lucide-react';
import Header from '../../components/layout/Header';
import GalaxyOrbitPreview from '../../components/galaxy/GalaxyOrbitPreview';
import { PLANET_ASSETS } from '../../components/galaxy/planetAssets';
import type { GalaxyRepoPlanet } from '../../components/galaxy/GalaxyOrbitPreview';
import { API_BASE_URL } from '../../services/apiConfig';
import { ORBIT_PLANET_TYPES, PLANET_TYPE_LABELS } from '../../types';
import type { AnalyzePlanetTypesResult, PlanetType, UserRepoListItem } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';


interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

interface UserProfilePlanet {
  repoId: number;
  slot: number;
}

interface UserProfileData {
  planets: UserProfilePlanet[];
}

type OrbitPlanetType = Exclude<PlanetType, 'SUN'>;
type SlotPlacement = Record<number, number | null>;
type SidebarTool = 'home' | 'analysis';

const ORBIT_SLOT_NUMBERS = Array.from({ length: 8 }, (_, index) => index + 1);
const SIDEBAR_TOOLS: Array<{
  id: SidebarTool;
  label: string;
  description: string;
}> = [
  {
    id: 'home',
    label: '홈',
    description: '분석 패널을 닫고 은하계를 봅니다.',
  },
  {
    id: 'analysis',
    label: '분석',
    description: '레포지토리를 행성 타입으로 분석합니다.',
  },
];

const isOrbitPlanetType = (planetType: PlanetType | null): planetType is OrbitPlanetType => planetType !== null && planetType !== 'SUN';

const PlanetPage = () => {
  const { accessToken, isAuthenticated, login } = useAuthStore();
  const [repos, setRepos] = useState<UserRepoListItem[]>([]);
  const [placements, setPlacements] = useState<SlotPlacement>({});
  const [savedPlacements, setSavedPlacements] = useState<SlotPlacement>({});
  const [analyzingRepoIds, setAnalyzingRepoIds] = useState<Set<number>>(new Set());
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggingRepoId, setDraggingRepoId] = useState<number | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [repoSearchKeyword, setRepoSearchKeyword] = useState('');
  const [activeSidebarTool, setActiveSidebarTool] = useState<SidebarTool>('home');
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);

  const repoById = useMemo(() => new Map(repos.map((repo) => [repo.repoId, repo])), [repos]);

  const placedRepoIds = useMemo(
    () => new Set(Object.values(placements).filter((repoId): repoId is number => typeof repoId === 'number')),
    [placements],
  );

  const filteredRepos = useMemo(() => {
    const keyword = repoSearchKeyword.trim().toLowerCase();
    if (!keyword) return repos;

    return repos.filter((repo) => {
      const planetLabel = repo.planetType ? PLANET_TYPE_LABELS[repo.planetType] : '';
      return [repo.repoName, repo.description ?? '', planetLabel].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [repoSearchKeyword, repos]);

  const galaxyPlanets = useMemo<Array<GalaxyRepoPlanet | null>>(
    () =>
      ORBIT_SLOT_NUMBERS.map((slotNumber) => {
        const repoId = placements[slotNumber];
        const repo = repoId ? repoById.get(repoId) : null;
        if (!repo || !isOrbitPlanetType(repo.planetType)) return null;

        return {
          repoId: repo.repoId,
          repoName: repo.repoName,
          planetType: repo.planetType,
        };
      }),
    [placements, repoById],
  );

  const placedPlanets = useMemo(
    () => galaxyPlanets.filter((planet): planet is GalaxyRepoPlanet => Boolean(planet)),
    [galaxyPlanets],
  );

  const hasPlacementChanges = useMemo(
    () => ORBIT_SLOT_NUMBERS.some((slotNumber) => (placements[slotNumber] ?? null) !== (savedPlacements[slotNumber] ?? null)),
    [placements, savedPlacements],
  );

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken ?? ''}`,
    }),
    [accessToken],
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const fetchRepos = async () => {
      setIsLoadingRepos(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`${API_BASE_URL}/user/repos`, {
          headers: authHeaders,
        });

        if (!response.ok) {
          throw new Error(response.status === 401 ? '로그인이 필요합니다.' : '레포지토리 목록을 가져오지 못했습니다.');
        }

        const payload = (await response.json()) as ApiResponse<{ repos: UserRepoListItem[] }>;
        const fetchedRepos = payload.data?.repos ?? [];
        setRepos(fetchedRepos);

        const profileResponse = await fetch(`${API_BASE_URL}/user/profile`, {
          headers: authHeaders,
        });

        if (!profileResponse.ok) {
          throw new Error(profileResponse.status === 401 ? '로그인이 필요합니다.' : '저장된 은하계 배치를 가져오지 못했습니다.');
        }

        const profilePayload = (await profileResponse.json()) as ApiResponse<UserProfileData>;
        const fetchedRepoIds = new Set(fetchedRepos.map((repo) => repo.repoId));
        const savedPlacements: SlotPlacement = {};

        for (const planet of profilePayload.data?.planets ?? []) {
          const slotNumber = planet.slot + 1;
          if (slotNumber >= 1 && slotNumber <= 8 && fetchedRepoIds.has(planet.repoId)) {
            savedPlacements[slotNumber] = planet.repoId;
          }
        }

        setPlacements(savedPlacements);
        setSavedPlacements(savedPlacements);
        setIsPlacementMode(false);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '레포지토리 목록 조회 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingRepos(false);
      }
    };

    void fetchRepos();
  }, [accessToken, authHeaders, isAuthenticated]);

  const analyzeRepo = async (repoId: number) => {
    if (!accessToken) {
      login();
      return;
    }

    setAnalyzingRepoIds((current) => new Set(current).add(repoId));
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze/planet-types`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ repo_ids: [repoId] }),
      });

      if (!response.ok) {
        throw new Error(response.status === 401 ? '로그인이 필요합니다.' : '행성 타입 분석에 실패했습니다.');
      }

      const payload = (await response.json()) as ApiResponse<AnalyzePlanetTypesResult>;
      const analyzed = payload.data?.planets?.[0];
      if (!analyzed) throw new Error('분석 결과가 비어 있습니다.');

      setRepos((current) =>
        current.map((repo) =>
          repo.repoId === repoId
            ? {
                ...repo,
                planetType: analyzed.planetType,
                isAnalyzed: true,
              }
            : repo,
        ),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '행성 타입 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzingRepoIds((current) => {
        const next = new Set(current);
        next.delete(repoId);
        return next;
      });
    }
  };

  const placeRepoInSlot = (repoId: number, slotNumber: number) => {
    const repo = repoById.get(repoId);
    if (!repo || !isOrbitPlanetType(repo.planetType)) {
      setErrorMessage('분석이 완료된 레포지토리만 궤도에 배치할 수 있습니다.');
      return;
    }

    setIsPlacementMode(true);
    setPlacements((current) => {
      const next = { ...current };

      for (const [slot, placedRepoId] of Object.entries(next)) {
        if (placedRepoId === repoId) {
          next[Number(slot)] = null;
        }
      }

      next[slotNumber] = repoId;
      return next;
    });
    setErrorMessage(null);
  };

  const removeSlotPlacement = (slotNumber: number) => {
    setIsPlacementMode(true);
    setPlacements((current) => ({ ...current, [slotNumber]: null }));
    setErrorMessage(null);
  };

  const swapSlots = (sourceSlot: number, targetSlot: number) => {
    if (sourceSlot === targetSlot) return;

    setIsPlacementMode(true);
    setPlacements((current) => ({
      ...current,
      [sourceSlot]: current[targetSlot] ?? null,
      [targetSlot]: current[sourceSlot] ?? null,
    }));
    setErrorMessage(null);
  };

  const handleRepoDragStart = (event: DragEvent<HTMLElement>, repo: UserRepoListItem) => {
    if (!isOrbitPlanetType(repo.planetType) || analyzingRepoIds.has(repo.repoId)) return;

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-giterra-repo-id', String(repo.repoId));
    event.dataTransfer.setData('text/plain', repo.repoName);

    const dragImage = event.currentTarget.querySelector('[data-planet-drag-image]');
    if (dragImage instanceof HTMLElement) {
      event.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
    }

    setDraggingRepoId(repo.repoId);
    setDraggingSlot(null);
    setDragOverSlot(null);
  };

  const handleSlotDragStart = (event: DragEvent<HTMLDivElement>, slotNumber: number, repoId: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-giterra-repo-id', String(repoId));
    event.dataTransfer.setData('application/x-giterra-slot', String(slotNumber));
    setDraggingRepoId(repoId);
    setDraggingSlot(slotNumber);
    setDragOverSlot(null);
  };

  const clearDraggingState = () => {
    setDraggingRepoId(null);
    setDraggingSlot(null);
    setDragOverSlot(null);
  };

  const handleSlotDragOver = (event: DragEvent<HTMLDivElement>, targetSlot: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (draggingRepoId !== null && draggingSlot !== targetSlot) {
      setDragOverSlot(targetSlot);
    }
  };

  const handleSlotDragLeave = (event: DragEvent<HTMLDivElement>, targetSlot: number) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setDragOverSlot((current) => (current === targetSlot ? null : current));
  };

  const handleSlotDrop = (event: DragEvent<HTMLDivElement>, targetSlot: number) => {
    event.preventDefault();
    const sourceSlot = Number(event.dataTransfer.getData('application/x-giterra-slot') || draggingSlot);
    const repoId = Number(event.dataTransfer.getData('application/x-giterra-repo-id') || draggingRepoId);

    if (sourceSlot) {
      swapSlots(sourceSlot, targetSlot);
      clearDraggingState();
      return;
    }

    if (repoId) placeRepoInSlot(repoId, targetSlot);
    clearDraggingState();
  };

  const saveGalaxyPlacement = async () => {
    if (placedPlanets.length === 0) {
      setErrorMessage('저장할 행성을 먼저 슬롯에 배치해 주세요.');
      return;
    }

    if (!hasPlacementChanges) {
      setIsPlacementMode(false);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/user/planets`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          planets: ORBIT_SLOT_NUMBERS.flatMap((slotNumber) => {
            const repoId = placements[slotNumber];
            return repoId ? [{ repo_id: repoId, slot_index: slotNumber - 1 }] : [];
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('은하계 배치 저장에 실패했습니다.');
      }

      setSavedPlacements(placements);
      setIsPlacementMode(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '은하계 배치 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Header showSearch={true} />
      <main className="relative h-full w-full">
        <GalaxyOrbitPreview planets={galaxyPlanets} paused={isPlacementMode} showDefaultBodies={false} />

        <motion.nav
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
          className="absolute left-4 top-24 z-50 flex max-h-[calc(100vh-8rem)] w-16 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-2 text-white shadow-2xl shadow-black/30 backdrop-blur-xl"
          aria-label="은하계 도구 사이드바"
        >
          {SIDEBAR_TOOLS.map((tool) => {
            const isActive = activeSidebarTool === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveSidebarTool(tool.id);
                  setIsAnalysisPanelOpen(tool.id === 'analysis');
                }}
                aria-pressed={isActive}
                aria-label={`${tool.label}: ${tool.description}`}
                title={tool.description}
                className={`group relative grid h-11 w-11 place-items-center rounded-2xl border transition ${
                  isActive
                    ? 'border-indigo-200/70 bg-indigo-400/25 text-white shadow-lg shadow-indigo-500/25'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-indigo-200/50 hover:bg-indigo-400/15 hover:text-white'
                }`}
              >
                {tool.id === 'home' ? <Home className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                <span className="pointer-events-none absolute left-[3.35rem] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/95 px-3 py-1.5 text-xs font-black text-white shadow-xl group-hover:block">
                  {tool.label}
                </span>
              </button>
            );
          })}
        </motion.nav>

        <AnimatePresence>
          {isAnalysisPanelOpen && activeSidebarTool === 'analysis' && (
            <motion.aside
              key="analysis-panel"
              initial={{ opacity: 0, x: -32, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -32, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-24 top-24 z-40 flex max-h-[calc(100vh-8rem)] w-[38rem] gap-4 overflow-visible rounded-3xl border border-white/10 bg-slate-950/55 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarTool('home');
                  setIsAnalysisPanelOpen(false);
                }}
                className="absolute -right-8 top-1/2 z-10 grid h-14 w-8 -translate-y-1/2 place-items-center rounded-r-2xl border border-l-0 border-white/15 bg-slate-950/85 text-indigo-100 shadow-xl shadow-black/30 transition hover:bg-indigo-500 hover:text-white"
                aria-label="레포지토리 분석 패널 닫기"
                title="닫기"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-200/70">Repository Galaxy</p>
                <h2 className="mt-1 text-xl font-black">레포지토리 분석</h2>
                <p className="mt-1 text-xs text-slate-300">카드별로 분석한 뒤 행성 이미지를 오른쪽 슬롯으로 드래그하세요.</p>
              </div>
              <span className="rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1 text-xs font-black text-indigo-100">
                {placedPlanets.length}/8
              </span>
            </div>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={login}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-indigo-100"
              >
                GitHub 로그인 후 레포 분석하기
              </button>
            ) : (
              <>
                <label className="mb-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-slate-200 focus-within:border-indigo-300/60 focus-within:bg-indigo-400/10">
                  <Search className="h-4 w-4 shrink-0 text-indigo-100/70" aria-hidden="true" />
                  <input
                    value={repoSearchKeyword}
                    onChange={(event) => setRepoSearchKeyword(event.target.value)}
                    placeholder="레포지토리 제목, 설명, 행성 타입 검색"
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  {repoSearchKeyword && (
                    <button
                      type="button"
                      onClick={() => setRepoSearchKeyword('')}
                      className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20"
                      aria-label="검색어 지우기"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </label>

                {errorMessage && (
                  <div className="mb-3 rounded-2xl border border-rose-300/20 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-100">
                    {errorMessage}
                  </div>
                )}

                <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto pr-1">
                  {isLoadingRepos ? (
                    <div className="flex h-40 items-center justify-center gap-2 text-sm font-bold text-slate-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      레포지토리 불러오는 중
                    </div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-center">
                      <Search className="mb-2 h-5 w-5 text-indigo-100/70" />
                      <p className="text-sm font-black text-white">검색 결과가 없습니다</p>
                      <p className="mt-1 text-xs text-slate-400">다른 키워드로 레포지토리를 찾아보세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredRepos.map((repo) => {
                        const isAnalyzing = analyzingRepoIds.has(repo.repoId);
                        const canDrag = isOrbitPlanetType(repo.planetType) && !isAnalyzing;
                        const isPlaced = placedRepoIds.has(repo.repoId);
                        const planetLabel = repo.planetType ? PLANET_TYPE_LABELS[repo.planetType] : '미분석';

                        return (
                          <div
                            key={repo.repoId}
                            draggable={canDrag}
                            onDragStart={(event) => handleRepoDragStart(event, repo)}
                            onDragEnd={clearDraggingState}
                            className={`w-full rounded-2xl border p-3 text-left transition ${
                              canDrag
                                ? `cursor-grab border-indigo-300/50 bg-indigo-400/20 active:cursor-grabbing ${
                                    draggingRepoId === repo.repoId ? 'opacity-45 ring-2 ring-indigo-200/70' : ''
                                  }`
                                : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20">
                                {isAnalyzing ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-indigo-100" />
                                ) : repo.planetType ? (
                                  <button
                                    type="button"
                                    draggable={canDrag}
                                    onDragStart={(event) => handleRepoDragStart(event, repo)}
                                    onClick={(event) => event.stopPropagation()}
                                    onDragEnd={clearDraggingState}
                                    className={`grid h-11 w-11 place-items-center rounded-full transition ${
                                      canDrag
                                        ? 'cursor-grab hover:scale-110 hover:drop-shadow-[0_0_18px_rgba(129,140,248,0.65)] active:cursor-grabbing'
                                        : 'cursor-default'
                                    }`}
                                    aria-label={`${repo.repoName} 행성 드래그`}
                                    title="행성을 슬롯으로 드래그하세요"
                                  >
                                    <img
                                      data-planet-drag-image
                                      className="h-10 w-10 object-contain"
                                      src={PLANET_ASSETS[repo.planetType]}
                                      alt={planetLabel}
                                      draggable={false}
                                    />
                                  </button>
                                ) : (
                                  <Sparkles className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <strong className="truncate text-sm font-black text-white">{repo.repoName}</strong>
                                  <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[0.68rem] font-black text-indigo-100">
                                    {isPlaced ? '배치됨' : planetLabel}
                                  </span>
                                </div>
                                {repo.description && <p className="mt-1 line-clamp-2 text-xs text-slate-300">{repo.description}</p>}
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (!isAnalyzing) void analyzeRepo(repo.repoId);
                                }}
                                onKeyDown={(event) => {
                                  if ((event.key === 'Enter' || event.key === ' ') && !isAnalyzing) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void analyzeRepo(repo.repoId);
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                                  isAnalyzing
                                    ? 'cursor-not-allowed bg-white/10 text-slate-300'
                                    : 'cursor-pointer bg-indigo-500 text-white hover:bg-indigo-400'
                                }`}
                              >
                                {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                {isAnalyzing ? '분석 중' : repo.isAnalyzed ? '재분석' : '분석'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
              </section>

              <section className="flex w-32 shrink-0 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-indigo-200/70">Slots</p>
                <h3 className="text-sm font-black">배치</h3>
              </div>
              <button
                type="button"
                onClick={saveGalaxyPlacement}
                disabled={isSaving || placedPlanets.length === 0 || !hasPlacementChanges}
                className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label={hasPlacementChanges ? '은하계 배치 저장' : '저장할 배치 변경 없음'}
                title={hasPlacementChanges ? '배치 저장' : '변경된 배치가 없습니다'}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
            </div>

            <div className="scrollbar-none space-y-2 overflow-y-auto pr-1">
              <div className="grid aspect-square place-items-center rounded-2xl border border-amber-200/30 bg-amber-300/10 p-2">
                <img className="h-12 w-12 object-contain" src={PLANET_ASSETS.SUN} alt="태양" draggable={false} />
                <span className="text-[0.62rem] font-black text-amber-100">0 태양</span>
              </div>

              {ORBIT_SLOT_NUMBERS.map((slotNumber) => {
                const repoId = placements[slotNumber];
                const repo = repoId ? repoById.get(repoId) : null;
                const slotPlanetType = ORBIT_PLANET_TYPES[slotNumber - 1];
                const placedPlanetType = repo && isOrbitPlanetType(repo.planetType) ? repo.planetType : null;
                const planetType: OrbitPlanetType = placedPlanetType ?? slotPlanetType;
                const isDropCandidate = draggingRepoId !== null && draggingSlot !== slotNumber;
                const isDropHovered = isDropCandidate && dragOverSlot === slotNumber;

                return (
                  <div
                    key={slotNumber}
                    draggable={Boolean(repoId)}
                    onDragStart={(event) => repoId && handleSlotDragStart(event, slotNumber, repoId)}
                    onDragOver={(event) => handleSlotDragOver(event, slotNumber)}
                    onDragLeave={(event) => handleSlotDragLeave(event, slotNumber)}
                    onDrop={(event) => handleSlotDrop(event, slotNumber)}
                    onDragEnd={clearDraggingState}
                    className={`group relative grid aspect-square place-items-center rounded-2xl border p-2 transition ${
                      isDropHovered
                        ? 'scale-[1.04] border-emerald-200/90 bg-emerald-400/25 shadow-[0_0_26px_rgba(52,211,153,0.34)] ring-2 ring-emerald-200/70'
                        : repo
                          ? `cursor-grab border-indigo-300/50 bg-indigo-400/20 active:cursor-grabbing ${
                              draggingSlot === slotNumber ? 'opacity-45 ring-2 ring-indigo-200/70' : isDropCandidate ? 'border-indigo-200/70 bg-indigo-400/25 ring-1 ring-indigo-200/30' : ''
                            }`
                          : `border-dashed ${
                              isDropCandidate
                                ? 'border-indigo-200/60 bg-indigo-400/12 ring-1 ring-indigo-200/25'
                                : 'border-white/15 bg-white/[0.035] hover:border-indigo-200/50 hover:bg-indigo-400/10'
                            }`
                    }`}
                  >
                    {repo ? (
                      <>
                        <button
                          type="button"
                          onClick={() => removeSlotPlacement(slotNumber)}
                          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100"
                          aria-label={`${slotNumber}번 슬롯 비우기`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <img className="h-11 w-11 object-contain" src={PLANET_ASSETS[planetType]} alt={PLANET_TYPE_LABELS[planetType]} draggable={false} />
                        <span className="line-clamp-1 max-w-full text-center text-[0.58rem] font-black text-indigo-50">{slotNumber} {repo.repoName}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-black text-white/35">{slotNumber}</span>
                        <span className="text-[0.58rem] font-black text-slate-400">Drop</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
              </section>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PlanetPage;

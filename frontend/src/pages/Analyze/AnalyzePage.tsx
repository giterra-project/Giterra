import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    BarChart3,
    CheckSquare,
    Clock3,
    Github,
    Layers3,
    Loader2,
    RefreshCw,
    Sparkles,
    Square,
    Trash2,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../lib/apiBase';

type AnalyzeMode = 'single' | 'multi';

interface RepoInfo {
    name: string;
    description: string | null;
    stars: number;
    language: string | null;
    url: string;
    updated_at: string;
}

interface DirectRepoAnalysis {
    repo_name: string;
    total_commits: number;
    dominant_type: string;
    building_type: string;
    top_languages: string[];
    latest_commit?: string | null;
    analysis_summary: string;
    analysis_sub1: string;
    analysis_sub2: string;
    analysis_sub3: string;
}

interface DirectAnalyzeSummary {
    username: string;
    mode: AnalyzeMode;
    repo_count: number;
    persona: string;
    theme: string;
    main_languages: string[];
    total_score: number;
    commit_stats: Record<string, number>;
    weighted_scores: Record<string, number>;
    overall_analysis: string;
    analysis_source: 'llm' | 'heuristic';
    generated_at: string;
}

interface DirectAnalyzeResponse {
    summary: DirectAnalyzeSummary;
    repositories: DirectRepoAnalysis[];
    failed_repositories: string[];
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString();
}

const AnalyzePage = () => {
    const { t } = useLanguageStore();
    const { accessToken, clearAuth } = useAuthStore();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const initialUsername = useMemo(() => {
        const fromState = (location.state as { username?: string } | null)?.username;
        const fromQuery = searchParams.get('username');
        return (fromState || fromQuery || '').trim();
    }, [location.state, searchParams]);

    const [username, setUsername] = useState(initialUsername);
    const [repos, setRepos] = useState<RepoInfo[]>([]);
    const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
    const [analysis, setAnalysis] = useState<DirectAnalyzeResponse | null>(null);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedSet = useMemo(() => new Set(selectedRepos), [selectedRepos]);
    const hasRepos = repos.length > 0;
    const hasSelection = selectedRepos.length > 0;

    const commitBars = useMemo(() => {
        const stats = analysis?.summary.commit_stats || {};
        const entries = Object.entries(stats).filter(([, value]) => value > 0);
        const maxValue = entries.length > 0 ? Math.max(...entries.map(([, value]) => value)) : 0;

        return entries.map(([key, value]) => ({
            key,
            value,
            width: maxValue === 0 ? 0 : Math.round((value / maxValue) * 100),
        }));
    }, [analysis?.summary.commit_stats]);

    const parseErrorResponse = async (response: Response) => {
        const rawText = await response.text();
        if (!rawText) return 'Request failed';

        try {
            const json = JSON.parse(rawText) as { detail?: string | Record<string, unknown> };
            if (typeof json.detail === 'string') return json.detail;
            if (json.detail) return JSON.stringify(json.detail);
        } catch {
            // plain text response
        }

        return rawText;
    };

    const authHeaders = useMemo(() => {
        if (!accessToken) return null;
        return { Authorization: `token ${accessToken}` };
    }, [accessToken]);

    const handleUnauthorized = () => {
        setErrorMessage(t('세션이 만료되었습니다. 다시 로그인해주세요.', 'Session expired. Please log in again.'));
        clearAuth();
    };

    const loadRepositories = async (inputUsername?: string) => {
        const target = (inputUsername ?? username).trim();
        if (!target) {
            setErrorMessage(t('깃허브 아이디를 입력해주세요.', 'Please enter a GitHub ID.'));
            return;
        }

        setIsLoadingRepos(true);
        setErrorMessage(null);
        setAnalysis(null);
        setRepos([]);
        setSelectedRepos([]);

        try {
            if (!authHeaders) {
                handleUnauthorized();
                return;
            }

            const response = await fetch(`${API_BASE_URL}/repos/${target}`, {
                headers: authHeaders,
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const detail = await parseErrorResponse(response);
                throw new Error(detail);
            }

            const data = (await response.json()) as RepoInfo[];
            setRepos(data);
            setSelectedRepos(data.slice(0, 5).map((repo) => repo.name));
        } catch (error) {
            console.error(error);
            const detail = error instanceof Error ? error.message : '';
            setErrorMessage(
                detail ||
                    t('레포지토리 조회에 실패했습니다.', 'Failed to fetch repositories.'),
            );
        } finally {
            setIsLoadingRepos(false);
        }
    };

    useEffect(() => {
        if (!initialUsername) return;
        setUsername(initialUsername);
        void loadRepositories(initialUsername);
    }, [initialUsername]);

    const toggleRepo = (repoName: string) => {
        setSelectedRepos((prev) => {
            if (prev.includes(repoName)) return prev.filter((name) => name !== repoName);
            return [...prev, repoName];
        });
    };

    const selectTop = (count: number) => {
        setSelectedRepos(repos.slice(0, count).map((repo) => repo.name));
    };

    const selectAll = () => {
        setSelectedRepos(repos.map((repo) => repo.name));
    };

    const clearSelection = () => {
        setSelectedRepos([]);
    };

    const requestAnalysis = async (mode: AnalyzeMode, targetRepos: string[]) => {
        const cleanUsername = username.trim();
        if (!cleanUsername) {
            setErrorMessage(t('깃허브 아이디를 입력해주세요.', 'Please enter a GitHub ID.'));
            return;
        }
        if (targetRepos.length === 0) {
            setErrorMessage(t('분석할 레포지토리를 선택해주세요.', 'Please select repositories.'));
            return;
        }

        setIsAnalyzing(true);
        setErrorMessage(null);

        try {
            if (!authHeaders) {
                handleUnauthorized();
                return;
            }

            const response = await fetch(`${API_BASE_URL}/analyze/direct`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    github_username: cleanUsername,
                    selected_repos: targetRepos,
                    mode,
                }),
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const detail = await parseErrorResponse(response);
                throw new Error(detail);
            }

            const data = (await response.json()) as DirectAnalyzeResponse;
            setAnalysis(data);
        } catch (error) {
            console.error(error);
            const detail = error instanceof Error ? error.message : '';
            setErrorMessage(
                detail ||
                    t('분석 요청에 실패했습니다.', 'Failed to analyze repositories.'),
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    const sourceLabel = analysis?.summary.analysis_source === 'llm'
        ? t('AI 분석', 'AI')
        : t('규칙 기반 분석', 'Heuristic');

    return (
        <div className="h-screen w-screen overflow-hidden app-gradient-bg text-white">
            <Header showSearch={true} searchTarget="/analyze" />

            <main className="h-full overflow-y-auto custom-scrollbar px-4 pb-10 pt-28 md:px-8">
                <div className="mx-auto grid w-full max-w-[1500px] gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
                    <section className="glass-panel rounded-3xl p-4 md:p-5 xl:sticky xl:top-28 xl:h-[calc(100vh-8.5rem)]">
                        <div className="mb-4">
                            <h1 className="text-2xl font-black">{t('아이디 기반 레포 분석', 'Repository Analyzer')}</h1>
                            <p className="mt-1 text-sm text-muted">
                                {t(
                                    '단일 레포 또는 여러 레포를 묶어서 개발 성향을 분석합니다.',
                                    'Run analysis for a single repository or a grouped selection.',
                                )}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <input
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') void loadRepositories();
                                }}
                                placeholder={t('예: torvalds', 'e.g. torvalds')}
                                className="flex-1 rounded-xl border border-white/15 bg-black/35 px-3 py-2.5 text-sm outline-none focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/30"
                            />
                            <button
                                type="button"
                                onClick={() => void loadRepositories()}
                                disabled={isLoadingRepos}
                                className="flex items-center gap-1 rounded-xl bg-teal-400 px-3 py-2.5 text-sm font-bold text-slate-900 hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoadingRepos ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                                {t('조회', 'Load')}
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/45 bg-red-500/10 p-3 text-sm text-red-100">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => selectTop(3)}
                                disabled={!hasRepos}
                                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
                            >
                                {t('상위 3개', 'Top 3')}
                            </button>
                            <button
                                type="button"
                                onClick={() => selectTop(5)}
                                disabled={!hasRepos}
                                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
                            >
                                {t('상위 5개', 'Top 5')}
                            </button>
                            <button
                                type="button"
                                onClick={selectAll}
                                disabled={!hasRepos}
                                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
                            >
                                {t('전체 선택', 'Select all')}
                            </button>
                            <button
                                type="button"
                                onClick={clearSelection}
                                disabled={!hasSelection}
                                className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40"
                            >
                                <Trash2 size={12} />
                                {t('선택 해제', 'Clear')}
                            </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-xs uppercase tracking-wider text-white/60">{t('레포 목록', 'Repositories')}</div>
                            <div className="text-xs text-amber-300">{selectedRepos.length} {t('개 선택됨', 'selected')}</div>
                        </div>

                        <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto pr-1 custom-scrollbar xl:max-h-[calc(100vh-24rem)]">
                            {!hasRepos && !isLoadingRepos && (
                                <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
                                    {t('레포지토리를 불러오면 여기에서 선택할 수 있습니다.', 'Load repositories to start selecting.')}
                                </div>
                            )}

                            {repos.map((repo) => {
                                const selected = selectedSet.has(repo.name);
                                return (
                                    <div key={repo.name} className="rounded-xl border border-white/10 bg-black/30 p-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleRepo(repo.name)}
                                            className="flex w-full items-start gap-2 text-left"
                                        >
                                            {selected ? (
                                                <CheckSquare size={17} className="mt-0.5 shrink-0 text-teal-300" />
                                            ) : (
                                                <Square size={17} className="mt-0.5 shrink-0 text-white/40" />
                                            )}
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold">{repo.name}</div>
                                                <div className="mt-1 text-xs text-white/55">
                                                    {(repo.language || 'Unknown') + ` · ⭐ ${repo.stars} · ${formatDate(repo.updated_at)}`}
                                                </div>
                                                {repo.description && (
                                                    <div className="mt-1 line-clamp-2 text-xs text-white/45">{repo.description}</div>
                                                )}
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => void requestAnalysis('single', [repo.name])}
                                            disabled={isAnalyzing}
                                            className="mt-2 rounded-lg border border-teal-300/35 bg-teal-300/10 px-2.5 py-1 text-xs font-semibold text-teal-100 hover:bg-teal-300/20 disabled:opacity-60"
                                        >
                                            {t('단일 분석', 'Single Analysis')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => void requestAnalysis('multi', selectedRepos)}
                            disabled={!hasSelection || isAnalyzing}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-900 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {t('선택 레포 묶음 분석', 'Analyze Selected Repositories')}
                        </button>
                    </section>

                    <section className="glass-panel-strong rounded-3xl p-4 md:p-6">
                        {!analysis && !isAnalyzing && (
                            <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-white/15">
                                <div className="text-center">
                                    <Github size={34} className="mx-auto text-white/35" />
                                    <p className="mt-4 text-sm text-white/60">
                                        {t('좌측에서 레포를 선택하고 분석을 실행하세요.', 'Select repositories and run analysis from the left panel.')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="flex min-h-[520px] items-center justify-center">
                                <div className="text-center">
                                    <Loader2 size={32} className="mx-auto animate-spin text-teal-300" />
                                    <p className="mt-3 text-sm text-white/65">{t('분석 중...', 'Analyzing...')}</p>
                                </div>
                            </div>
                        )}

                        {analysis && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-5"
                            >
                                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                                    <div className="rounded-xl border border-white/10 bg-black/35 p-4">
                                        <div className="text-xs uppercase text-white/50">Persona</div>
                                        <div className="mt-1 text-lg font-bold">{analysis.summary.persona}</div>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/35 p-4">
                                        <div className="text-xs uppercase text-white/50">Theme</div>
                                        <div className="mt-1 text-lg font-bold capitalize">{analysis.summary.theme}</div>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/35 p-4">
                                        <div className="text-xs uppercase text-white/50">{t('레포 수', 'Repos')}</div>
                                        <div className="mt-1 text-lg font-bold">{analysis.summary.repo_count}</div>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/35 p-4">
                                        <div className="text-xs uppercase text-white/50">{t('총 점수', 'Total Score')}</div>
                                        <div className="mt-1 text-lg font-bold">{analysis.summary.total_score}</div>
                                    </div>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
                                    <article className="rounded-2xl border border-white/10 bg-black/35 p-5">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="text-sm font-bold uppercase tracking-wider text-teal-300">
                                                {t('전체 분석', 'Overall Analysis')}
                                            </div>
                                            <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{sourceLabel}</div>
                                        </div>
                                        <p className="whitespace-pre-line text-sm leading-7 text-white/80">{analysis.summary.overall_analysis}</p>
                                    </article>

                                    <article className="rounded-2xl border border-white/10 bg-black/35 p-4">
                                        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300">
                                            <BarChart3 size={16} />
                                            {t('커밋 분포', 'Commit Distribution')}
                                        </div>
                                        {commitBars.length === 0 && (
                                            <div className="text-sm text-white/50">{t('분포 데이터가 없습니다.', 'No distribution data.')}</div>
                                        )}
                                        <div className="space-y-2">
                                            {commitBars.map((item) => (
                                                <div key={item.key}>
                                                    <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                                                        <span className="uppercase">{item.key}</span>
                                                        <span>{item.value}</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-white/10">
                                                        <div
                                                            className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-amber-300"
                                                            style={{ width: `${item.width}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                </div>

                                {analysis.failed_repositories.length > 0 && (
                                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                                        {t('분석 실패 레포', 'Failed repositories')}: {analysis.failed_repositories.join(', ')}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {analysis.repositories.map((repo) => (
                                        <article key={repo.repo_name} className="rounded-2xl border border-white/10 bg-black/35 p-5">
                                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-lg font-bold">{repo.repo_name}</h3>
                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="rounded-full bg-teal-400/20 px-2.5 py-1 text-teal-200">{repo.dominant_type}</span>
                                                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/75">{repo.total_commits} commits</span>
                                                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/70">{repo.building_type}</span>
                                                </div>
                                            </div>

                                            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
                                                <span className="inline-flex items-center gap-1">
                                                    <Layers3 size={13} />
                                                    {repo.top_languages.length > 0 ? repo.top_languages.join(', ') : 'Unknown'}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock3 size={13} />
                                                    {formatDate(repo.latest_commit)}
                                                </span>
                                            </div>

                                            <p className="text-sm leading-7 text-white/80">{repo.analysis_summary}</p>

                                            <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                                    <div className="text-xs font-bold uppercase tracking-wider text-teal-300">Tech</div>
                                                    <p className="mt-2 whitespace-pre-line text-sm text-white/75">{repo.analysis_sub1}</p>
                                                </div>
                                                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                                    <div className="text-xs font-bold uppercase tracking-wider text-teal-300">Stability</div>
                                                    <p className="mt-2 whitespace-pre-line text-sm text-white/75">{repo.analysis_sub2}</p>
                                                </div>
                                                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                                                    <div className="text-xs font-bold uppercase tracking-wider text-teal-300">Convention</div>
                                                    <p className="mt-2 whitespace-pre-line text-sm text-white/75">{repo.analysis_sub3}</p>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AnalyzePage;

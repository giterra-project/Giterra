import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DatabaseZap, Search, ShieldCheck, Sparkles } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import HologramPlanet from '../../components/hero/HologramPlanet';

const MainPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguageStore();
    const { user, isAuthenticated, login } = useAuthStore();

    const [githubId, setGithubId] = useState('');

    useEffect(() => {
        if (user?.login) {
            setGithubId(user.login);
        }
    }, [user]);

    const handleSearch = () => {
        if (!githubId.trim()) return;
        if (!isAuthenticated) {
            login();
            return;
        }
        navigate('/analyze', { state: { username: githubId.trim() } });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="relative h-screen w-screen overflow-x-hidden overflow-y-auto app-holo-bg"
        >
            <Header />
            <main className="relative mx-auto flex min-h-full w-full max-w-[1440px] flex-col items-center px-4 pb-8 pt-24 sm:pt-28 md:px-8 md:pb-10 md:pt-30">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl text-center"
                >
                    <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1.5 text-xs font-semibold tracking-[0.15em] text-cyan-200 uppercase">
                        <Sparkles size={14} />
                        {t('홀로그래픽 개발 프로파일러', 'Holographic Developer Profiler')}
                    </p>
                    <h1 className="text-4xl font-black text-white md:text-6xl">
                        {t('당신의 GitHub를', 'Turn Your GitHub into a')}
                        <br />
                        <span className="holo-gradient-text">{t('행성으로 시각화합니다', 'Living Hologram Planet')}</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cyan-50/80 md:text-lg">
                        {t(
                            '단일 레포와 레포 묶음을 분석해 커밋 성향, 기술 무게중심, 협업 패턴을 한눈에 보여줍니다.',
                            'Analyze single repositories and multi-repo groups to reveal commit traits, tech gravity, and collaboration patterns.',
                        )}
                    </p>
                </motion.div>

                <section className="relative mt-5 flex w-full items-center justify-center sm:mt-6 sm:min-h-[360px] md:min-h-[560px]">
                    <div className="pointer-events-none absolute -left-12 top-8 hidden w-56 rounded-2xl border border-cyan-200/25 bg-slate-900/50 p-4 text-left backdrop-blur-md lg:block">
                        <div className="mb-2 inline-flex items-center gap-2 text-cyan-200">
                            <DatabaseZap size={14} />
                            <span className="text-xs font-bold tracking-[0.14em] uppercase">Data Pulse</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200/80">
                            {t(
                                '최근 커밋 흐름과 언어 비중을 행성의 오브젝트로 변환합니다.',
                                'Recent commit flow and language weight are translated into planetary objects.',
                            )}
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.9, delay: 0.15 }}
                        className="holo-planet-shell relative h-[clamp(220px,68vw,520px)] w-[clamp(220px,68vw,520px)] overflow-hidden rounded-full"
                    >
                        <div className="holo-scanline absolute inset-0 z-10" />
                        <HologramPlanet />
                    </motion.div>

                    <div className="pointer-events-none absolute -right-12 bottom-10 hidden w-56 rounded-2xl border border-teal-200/25 bg-slate-900/50 p-4 text-left backdrop-blur-md lg:block">
                        <div className="mb-2 inline-flex items-center gap-2 text-teal-200">
                            <ShieldCheck size={14} />
                            <span className="text-xs font-bold tracking-[0.14em] uppercase">Insight Layer</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200/80">
                            {t(
                                'AI 분석이 실패해도 규칙 기반 리포트를 즉시 제공해 공백을 막습니다.',
                                'Even if AI analysis fails, heuristic insights fill the gap immediately.',
                            )}
                        </p>
                    </div>
                </section>

                <div className="mt-4 grid w-full max-w-[720px] grid-cols-1 gap-2 sm:grid-cols-2 lg:hidden">
                    <div className="holo-metric-card rounded-2xl p-3">
                        <div className="mb-2 inline-flex items-center gap-2 text-cyan-200">
                            <DatabaseZap size={14} />
                            <span className="text-[11px] font-bold tracking-[0.12em] uppercase">Data Pulse</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200/80">
                            {t(
                                '최근 커밋 흐름과 언어 비중을 행성의 오브젝트로 변환합니다.',
                                'Recent commit flow and language weight are translated into planetary objects.',
                            )}
                        </p>
                    </div>

                    <div className="holo-metric-card rounded-2xl p-3">
                        <div className="mb-2 inline-flex items-center gap-2 text-teal-200">
                            <ShieldCheck size={14} />
                            <span className="text-[11px] font-bold tracking-[0.12em] uppercase">Insight Layer</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200/80">
                            {t(
                                'AI 분석이 실패해도 규칙 기반 리포트를 즉시 제공해 공백을 막습니다.',
                                'Even if AI analysis fails, heuristic insights fill the gap immediately.',
                            )}
                        </p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="holo-search-panel mt-4 mb-5 w-full max-w-3xl rounded-3xl p-2 md:mb-6 md:p-3"
                >
                    <div className="flex flex-col gap-2 rounded-2xl border border-cyan-200/20 bg-slate-950/55 p-2 backdrop-blur-xl sm:flex-row sm:items-center">
                        <input
                            type="text"
                            value={githubId}
                            onChange={(e) => setGithubId(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('깃허브 아이디 입력', 'Enter GitHub ID')}
                            className="w-full flex-1 bg-transparent px-3 py-3 text-base text-cyan-50 outline-none placeholder:text-cyan-100/35 md:px-4 md:text-lg"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-teal-300 px-4 text-sm font-bold text-slate-900 transition-transform hover:scale-[1.01] active:scale-95 sm:w-auto sm:px-5 md:h-[3.25rem] md:text-base"
                        >
                            <Search size={18} />
                            <span>{t('분석 시작', 'Analyze')}</span>
                        </button>
                    </div>
                    <p className="mt-3 px-1 text-center text-xs text-cyan-100/65 md:text-sm">
                        {isAuthenticated
                            ? t(
                                '아이디 입력 후 단일/묶음 레포 분석 페이지로 이동합니다.',
                                'Enter an ID to jump into single or grouped repository analysis.',
                            )
                            : t(
                                '로그인하지 않으면 검색 시 GitHub 로그인으로 이동합니다.',
                                'Without login, search will redirect to GitHub sign-in.',
                            )}
                    </p>
                </motion.div>
            </main>
        </motion.div>
    );
};

export default MainPage;

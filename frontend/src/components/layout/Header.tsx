import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Languages, Search, Loader2 } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';

interface HeaderProps {
    showSearch?: boolean;
    searchTarget?: '/planet' | '/analyze';
}

const Header = ({ showSearch = false, searchTarget = '/analyze' }: HeaderProps) => {
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguageStore();
    const { isAuthenticated, login, isLoggingIn, resetLoggingIn } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isAuthenticated && isLoggingIn) {
            const timer = setTimeout(() => {
                resetLoggingIn();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isLoggingIn, resetLoggingIn]);

    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        navigate(searchTarget, { state: { username: searchTerm.trim() } });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <header className="fixed top-0 left-0 z-50 w-full px-4 py-3 md:px-8">
            <div className="header-shell mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 rounded-2xl px-4 py-3 md:flex-nowrap md:px-5">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="shrink-0 text-left"
                >
                    <div className="text-lg font-black tracking-tight text-white md:text-2xl">Giterra</div>
                    <div className="text-[11px] tracking-[0.12em] text-cyan-100/65 uppercase">
                        {t('개발 성향 분석', 'Developer Insight')}
                    </div>
                </button>

                {showSearch && (
                    <div className="order-3 w-full md:order-none md:flex-1">
                        <div className="flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-slate-950/55 p-1.5">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('GitHub 아이디 검색', 'Search GitHub ID')}
                                className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm text-cyan-50 placeholder:text-cyan-100/35 outline-none focus:ring-2 focus:ring-cyan-300/45"
                            />
                            <button
                                type="button"
                                onClick={handleSearch}
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-200/15 text-cyan-100 transition-colors hover:bg-cyan-200/25 hover:text-white"
                                aria-label="Search user"
                            >
                                <Search size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
                    <button
                        type="button"
                        onClick={toggleLanguage}
                        className="flex h-9 items-center justify-center gap-1 rounded-lg border border-cyan-200/20 bg-slate-950/35 px-2.5 text-xs font-bold text-cyan-50 transition-colors hover:bg-slate-900/70 md:px-3"
                    >
                        <Languages size={14} />
                        {language}
                    </button>

                    {isAuthenticated ? (
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => navigate('/mypage')}
                            className="rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-2 text-xs font-semibold text-cyan-50 transition-colors hover:bg-cyan-100/20 md:px-5 md:text-sm"
                        >
                            <span>{t('마이페이지', 'My Page')}</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            type="button"
                            whileHover={!isLoggingIn ? { scale: 1.02 } : {}}
                            whileTap={!isLoggingIn ? { scale: 0.96 } : {}}
                            disabled={isLoggingIn}
                            onClick={login}
                            className={`flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors md:px-4 md:text-sm ${
                                isLoggingIn
                                    ? 'cursor-not-allowed bg-cyan-100/20 text-cyan-50/85'
                                    : 'bg-gradient-to-r from-cyan-200 to-teal-200 text-slate-900 hover:from-cyan-100 hover:to-teal-100'
                            }`}
                        >
                            {isLoggingIn ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Github size={16} />
                            )}
                            <span className="whitespace-nowrap">
                                {isLoggingIn ? t('연결 중...', 'Connecting...') : t('깃허브 로그인', 'Sign in with GitHub')}
                            </span>
                        </motion.button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

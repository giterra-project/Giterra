import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Languages, Search, LogOut, Loader2 } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';

interface HeaderProps {
    showSearch?: boolean;
}

const Header = ({ showSearch = false }: HeaderProps) => {
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguageStore();
    const { isAuthenticated, login, clearAuth, isLoggingIn, resetLoggingIn } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated && isLoggingIn) {
            const timer = setTimeout(() => {
                resetLoggingIn();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isLoggingIn, resetLoggingIn]);

    return (
        <header className="fixed top-0 left-0 z-50 flex h-18 w-full items-center justify-between px-10">
            <div
                className="text-2xl font-bold tracking-tighter cursor-pointer flex-shrink-0"
                onClick={() => navigate('/')}
            >
                Giterra
            </div>

            {showSearch && (
                <div className="flex w-[400px] items-center gap-2 rounded-xl bg-white/5 p-1 backdrop-blur-md border border-white/10 mx-4">
                    <input
                        type="text"
                        placeholder="Github ID"
                        className="flex-1 bg-transparent px-4 py-1.5 text-sm outline-none text-white"
                    />
                    <button className="p-2 text-white/50 hover:text-white">
                        <Search size={18} />
                    </button>
                </div>
            )}

            <div className="flex items-center gap-4 flex-shrink-0">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold border border-white/20 hover:bg-white/10 transition-colors w-16"
                >
                    <Languages size={14} />
                    {language}
                </button>

                {isAuthenticated ? (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearAuth}
                        className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white border border-white/20 hover:bg-white/20 transition-all w-[220px]"
                    >
                        <LogOut size={16} />
                        <span>{t('로그아웃', 'Logout')}</span>
                    </motion.button>
                ) : (
                    <motion.button
                        whileHover={!isLoggingIn ? { scale: 1.02 } : {}}
                        whileTap={!isLoggingIn ? { scale: 0.95 } : {}}
                        disabled={isLoggingIn}
                        onClick={login}
                        className={`flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all w-[220px] ${isLoggingIn
                            ? 'bg-gray-500 cursor-not-allowed opacity-70'
                            : 'bg-white text-black hover:bg-gray-200'
                            }`}
                    >
                        {isLoggingIn ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Github size={16} />
                        )}
                        <span className="whitespace-nowrap">
                            {isLoggingIn ? t('연결 중...', 'Connecting...') : t('깃허브 로그인', 'Sign up with GitHub')}
                        </span>
                    </motion.button>
                )}
            </div>
        </header>
    );
};

export default Header;
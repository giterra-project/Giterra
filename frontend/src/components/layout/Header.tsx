import { useNavigate } from 'react-router-dom';
import { Github, Languages, Search } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';

interface HeaderProps {
    showSearch?: boolean;
}

const Header = ({ showSearch = false }: HeaderProps) => {
    const navigate = useNavigate();
    const { language, toggleLanguage, t } = useLanguageStore();

    return (
        <header className="fixed top-0 left-0 z-50 flex h-18 w-full items-center justify-between px-10">
            <div
                className="text-2xl font-bold tracking-tighter cursor-pointer"
                onClick={() => navigate('/')}
            >
                Giterra
            </div>

            {showSearch && (
                <div className="flex w-[400px] items-center gap-2 rounded-xl bg-white/5 p-1 backdrop-blur-md border border-white/10">
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

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold border border-white/20 hover:bg-white/10 transition-colors"
                >
                    <Languages size={14} />
                    {language}
                </button>

                <button className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-gray-200">
                    <Github size={16} />
                    <span>{t('깃허브 로그인', 'Sign up with GitHub')}</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
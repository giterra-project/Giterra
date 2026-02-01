import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Github, ExternalLink, User as UserIcon } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';

const MyPage = () => {
    const navigate = useNavigate();
    const { user, accessToken, clearAuth } = useAuthStore();
    const { t } = useLanguageStore();

    const handleWithdraw = async () => {
        if (!confirm(t('정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.', 'Are you sure you want to withdraw? All data will be deleted.'))) {
            return;
        }

        try {
            const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const response = await fetch(`${BASE_URL}/auth/user`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${accessToken}`
                }
            });

            if (response.ok) {
                alert(t('회원 탈퇴가 완료되었습니다.', 'Withdrawal completed.'));
                clearAuth();
                navigate('/');
            } else {
                throw new Error('Withdrawal failed');
            }
        } catch (error) {
            console.error(error);
            alert(t('탈퇴 처리 중 오류가 발생했습니다.', 'An error occurred during withdrawal.'));
        }
    };

    if (!user) {
        return (
            <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
                <p>{t('로그인이 필요합니다.', 'Login required.')}</p>
            </div>
        );
    }

    const handleLogout = () => {
        clearAuth();
        navigate('/');
    };

    return (
        <div className="min-h-screen w-full bg-black text-white selection:bg-indigo-500/30">
            <Header showSearch={true} />

            <main className="container mx-auto px-6 pt-32 pb-20 max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-8"
                >
                    {/* Profile Section */}
                    <div className="w-full relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                        <div className="relative p-8 bg-black border border-white/10 rounded-3xl flex flex-col items-center text-center">
                            <div className="relative w-32 h-32 mb-6 rounded-full overflow-hidden border-4 border-black ring-2 ring-white/20 shadow-2xl">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.login} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                        <UserIcon size={48} className="text-white/40" />
                                    </div>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold mb-1">{user.login}</h1>
                            <a
                                href={user.html_url || `https://github.com/${user.login}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                <Github size={14} />
                                <span>View on GitHub</span>
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={handleLogout}
                            className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors"
                        >
                            {t('로그아웃', 'Logout')}
                        </button>

                        <button
                            onClick={handleWithdraw}
                            className="text-gray-500 hover:text-red-500 transition-colors text-sm underline decoration-1 underline-offset-4"
                        >
                            {t('회원 탈퇴', 'Delete Account')}
                        </button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default MyPage;

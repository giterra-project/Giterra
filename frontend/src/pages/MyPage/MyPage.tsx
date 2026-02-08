import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Github, ExternalLink, User as UserIcon } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { API_BASE_URL } from '../../lib/apiBase';

const MyPage = () => {
    const navigate = useNavigate();
    const { user, accessToken, clearAuth } = useAuthStore();
    const { t } = useLanguageStore();

    const handleWithdraw = async () => {
        if (!confirm(t('정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.', 'Are you sure you want to withdraw? All data will be deleted.'))) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/user`, {
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
            <div className="h-screen w-screen app-gradient-bg text-white flex items-center justify-center">
                <p>{t('로그인이 필요합니다.', 'Login required.')}</p>
            </div>
        );
    }

    const handleLogout = () => {
        clearAuth();
        navigate('/');
    };

    return (
        <div className="min-h-screen w-full app-gradient-bg text-white">
            <Header showSearch={true} />

            <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-30 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-6"
                >
                    <section className="glass-panel rounded-3xl p-6 md:p-8">
                        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
                            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-white/15 shadow-xl md:h-32 md:w-32">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.login} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                        <UserIcon size={48} className="text-white/40" />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0">
                                <h1 className="truncate text-2xl font-black md:text-3xl">{user.login}</h1>
                                <p className="mt-1 text-sm text-white/60">{t('연결된 GitHub 계정', 'Connected GitHub account')}</p>
                                <a
                                    href={user.html_url || `https://github.com/${user.login}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-300 hover:text-teal-200 transition-colors"
                                >
                                    <Github size={14} />
                                    <span>View on GitHub</span>
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </section>

                    <section className="glass-panel rounded-3xl p-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">{t('계정 작업', 'Account Actions')}</h2>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                                onClick={handleLogout}
                                className="rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-teal-300"
                            >
                                {t('로그아웃', 'Logout')}
                            </button>

                            <button
                                onClick={handleWithdraw}
                                className="rounded-xl border border-red-400/35 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                            >
                                {t('회원 탈퇴', 'Delete Account')}
                            </button>
                        </div>
                    </section>
                </motion.div>
            </main>
        </div>
    );
};

export default MyPage;

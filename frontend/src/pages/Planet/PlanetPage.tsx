import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useLanguageStore } from '../../store/useLanguageStore';

const RepositoryList = () => {
    const { t } = useLanguageStore();

    return (
        <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="absolute left-0 top-0 z-40 h-full w-[400px] bg-white/5 pt-24 backdrop-blur-xl border-r border-white/10"
        >
            <div className="px-8">
                <h2 className="text-2xl font-bold mb-6">{t('레포지토리 목록', 'Repository List')}</h2>

                <div className="flex items-center gap-2 rounded-xl bg-white/5 p-1 border border-white/10 mb-8">
                    <input
                        type="text"
                        placeholder={t('에셋 검색', 'search asset')}
                        className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-white placeholder:text-gray-500"
                    />
                    <button className="p-2 text-white bg-white/10 rounded-lg">
                        <Search size={16} />
                    </button>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 custom-scrollbar">
                    {[1, 2, 3, 4, 5].map((item: number) => (
                        <div
                            key={item}
                            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                        >
                            <div>
                                <div className="text-sm font-semibold">Giterra-Project-{item}</div>
                                <div className="text-xs text-gray-500 mt-1">Updated 2 days ago</div>
                            </div>
                            <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const PlanetPage = () => {
    const { t } = useLanguageStore();
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative h-screen w-screen bg-black overflow-hidden"
        >
            <Header showSearch={true} />

            <AnimatePresence mode="wait">
                {isExpanded && <RepositoryList />}
            </AnimatePresence>

            <main className="relative flex h-full w-full items-center justify-center">
                <motion.div
                    layoutId="shared-planet-sphere"
                    animate={{
                        scale: isExpanded ? 1.2 : 1,
                        x: isExpanded ? 250 : 0
                    }}
                    transition={{
                        layout: { type: 'spring', stiffness: 80, damping: 20 },
                        default: { type: 'spring', stiffness: 80, damping: 20 }
                    }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="relative group cursor-pointer z-30 flex items-center justify-center"
                >
                    <div className="relative w-[500px] h-[500px]">
                        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-[80px] animate-pulse" />

                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-900 border border-white/10 shadow-[inset_-20px_-20px_50px_rgba(0,0,0,0.5),0_0_50px_rgba(79,70,229,0.3)] overflow-hidden">
                            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.2)_0%,_transparent_50%)]" />
                        </div>

                        {!isExpanded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <p className="text-white/40 text-sm tracking-widest uppercase animate-pulse font-medium">
                                    {t('행성을 클릭하여 상세 보기', 'Click Planet to Expand')}
                                </p>
                            </motion.div>
                        )}
                    </div>

                    <motion.div
                        animate={{ opacity: isExpanded ? 0 : 1 }}
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center w-full pointer-events-none"
                    >
                        <h2 className="text-3xl font-bold tracking-tight">Player's Planet</h2>
                        <p className="text-gray-500 mt-2 font-medium">{t('커밋 데이터를 분석 중입니다...', 'Analyzing commit data...')}</p>
                    </motion.div>
                </motion.div>

                <button className="absolute top-24 right-10 z-50 rounded-lg border border-white/20 px-6 py-2 text-sm font-medium hover:bg-white/10 transition-colors">
                    {t('편집', 'Edit')}
                </button>
            </main>
        </motion.div>
    );
};

export default PlanetPage;
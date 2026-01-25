import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Search, HandMetal } from 'lucide-react';
import Header from '../../components/layout/Header';
import { useLanguageStore } from '../../store/useLanguageStore';

const RADIUS = 600;

const DragVisualGuide = () => {
    const { t } = useLanguageStore();

    return (
        <div className="pointer-events-none absolute bottom-32 left-1/2 z-50 -translate-x-1/2 flex flex-col items-center gap-2">
            <motion.div
                animate={{
                    x: [-40, 40, -40],
                    rotate: [-10, 10, -10]
                }}
                transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut"
                }}
                className="text-white/40"
            >
                <HandMetal size={32} />
            </motion.div>
            <span className="text-xs font-medium tracking-widest text-white/30 uppercase">
                {t('드래그하여 회전', 'Drag to Rotate')}
            </span>
        </div>
    );
};

const BackgroundSphere = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none preserve-3d">
        <motion.div
            layoutId="shared-planet-sphere"
            transition={{ duration: 0.8, type: "spring" }}
            className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-purple-600/20 via-blue-600/10 to-transparent blur-2xl [transform:translateZ(-200px)]"
        />
        <div className="absolute w-[620px] h-[620px] rounded-full border border-white/20 bg-white/[0.03] backdrop-blur-[2px] [transform:translateZ(-150px)] shadow-[0_0_50px_rgba(255,255,255,0.05)]" />
        <div className="absolute w-[620px] h-[620px] rounded-full border border-white/5 [transform:rotateX(75deg)_translateZ(-150px)]" />
    </div>
);

const MainPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguageStore();
    const [currentPage, setCurrentPage] = useState<number>(0);
    const dragX = useMotionValue(0);

    const rotateY = useTransform(dragX, (x: number) => {
        const currentBase = currentPage * -180;
        const rotationSensitivity = 0.2;
        return currentBase + (x * rotationSensitivity);
    });

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const velocityThreshold = 500;
        const distanceThreshold = 150;

        if (info.velocity.x < -velocityThreshold || info.offset.x < -distanceThreshold) {
            setCurrentPage(1);
        } else if (info.velocity.x > velocityThreshold || info.offset.x > distanceThreshold) {
            setCurrentPage(0);
        }

        dragX.set(0);
    };

    const handleSearch = () => {
        navigate('/planet');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="relative h-screen w-screen overflow-hidden perspective-container bg-black"
        >
            <Header />

            <DragVisualGuide />

            <div className="relative flex h-full w-full items-center justify-center preserve-3d">
                <BackgroundSphere />

                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0}
                    style={{ rotateY, x: 0 }}
                    animate={{ rotateY: currentPage === 0 ? 0 : -180 }}
                    onDragEnd={handleDragEnd}
                    transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 30,
                        restDelta: 0.001
                    }}
                    className="relative h-full w-full preserve-3d z-10 cursor-grab active:cursor-grabbing"
                >
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center backface-hidden"
                        style={{ transform: `rotateY(0deg) translateZ(${RADIUS}px)` }}
                    >
                        <div className="text-center select-none">
                            <h1 className="text-7xl font-extrabold pt-18 drop-shadow-2xl">Giterra</h1>
                            <p className="mt-6 text-xl text-gray-400">
                                {t('당신의 개발 역사를 하나의 행성으로 시각화하세요', 'Visualize your development history as a planet')}
                            </p>

                            <div className="mt-14 flex w-[480px] items-center gap-2 rounded-2xl bg-white/5 p-1.5 backdrop-blur-xl border border-white/10 shadow-2xl mx-auto">
                                <input
                                    type="text"
                                    placeholder={t('깃허브 아이디 입력', 'Enter GitHub ID')}
                                    className="flex-1 bg-transparent px-5 py-3 text-lg outline-none text-white placeholder:text-gray-500"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="flex items-center justify-center w-14 h-14 rounded-xl bg-white text-black transition-transform hover:scale-105 active:scale-95"
                                >
                                    <Search size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className="absolute inset-0 flex items-center justify-center backface-hidden"
                        style={{ transform: `rotateY(180deg) translateZ(${RADIUS}px)` }}
                    >
                        <div className="flex w-full max-w-6xl items-center justify-between px-20 select-none">
                            <div className="h-96 w-[45%] rounded-[40px] bg-gradient-to-br from-indigo-600/40 to-purple-700/40 border border-white/10 shadow-3xl shadow-indigo-500/10 backdrop-blur-md" />
                            <div className="w-[45%] text-left">
                                <h2 className="text-5xl font-bold leading-tight">
                                    {t('커밋 데이터 기반', 'Based on Commit Data')}
                                    <br />
                                    {t('3D 오브젝트 생성', 'Create 3D Objects')}
                                </h2>
                                <p className="mt-8 text-xl leading-relaxed text-gray-400">
                                    {t(
                                        'Feat과 Fix 비율에 따라 변화하는 지형지물을 확인하고 나만의 개발 행성을 가꾸어보세요.',
                                        'Check out features that change according to Feat and Fix ratios and cultivate your own development planet.'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-4 z-50">
                {[0, 1].map((idx: number) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentPage(idx)}
                        className={`h-2 rounded-full transition-all duration-500 ${currentPage === idx ? 'w-10 bg-white' : 'w-2 bg-white/20'
                            }`}
                    />
                ))}
            </div>
        </motion.div>
    );
};

export default MainPage;
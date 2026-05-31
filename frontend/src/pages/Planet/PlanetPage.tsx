import { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import GalaxyOrbitPreview from '../../components/galaxy/GalaxyOrbitPreview';

const LegacyPlanetPage = lazy(() => import('./LegacyPlanetPage'));

const PlanetPage = () => {
  const [viewMode, setViewMode] = useState<'galaxy' | 'legacy'>('galaxy');

  if (viewMode === 'legacy') {
    return (
      <Suspense
        fallback={
          <div className="grid h-screen w-screen place-items-center bg-black text-indigo-100">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-md">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-bold">Loading legacy 3D planet...</span>
            </div>
          </div>
        }
      >
        <LegacyPlanetPage />
      </Suspense>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Header showSearch={true} />
      <main className="relative h-full w-full">
        <GalaxyOrbitPreview />

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={() => setViewMode('legacy')}
          className="absolute bottom-8 right-8 z-40 rounded-xl border border-indigo-300/20 bg-indigo-500/20 px-6 py-3 font-bold text-indigo-100 backdrop-blur-md hover:bg-indigo-500/30"
        >
          Legacy 3D
        </motion.button>
      </main>
    </div>
  );
};

export default PlanetPage;

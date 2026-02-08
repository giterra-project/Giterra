import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import MainPage from './pages/Main/MainPage';
import PlanetPage from './pages/Planet/PlanetPage';
import LoginCallback from './pages/Login/LoginCallback';
import AnalyzePage from './pages/Analyze/AnalyzePage';
import { useAuthStore } from './store/useAuthStore';

import MyPage from './pages/MyPage/MyPage';

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MainPage />} />
        <Route path="/analyze" element={<RequireAuth><AnalyzePage /></RequireAuth>} />
        <Route path="/login/callback" element={<LoginCallback />} />
        <Route path="/planet" element={<RequireAuth><PlanetPage /></RequireAuth>} />
        <Route path="/mypage" element={<RequireAuth><MyPage /></RequireAuth>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

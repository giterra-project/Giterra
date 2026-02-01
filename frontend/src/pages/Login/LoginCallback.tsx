import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const LoginCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setAuth, resetLoggingIn } = useAuthStore();
    const hasCalled = useRef(false);

    useEffect(() => {
        if (hasCalled.current) return;

        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error || !code) {
            resetLoggingIn();
            navigate('/');
            return;
        }

        hasCalled.current = true;
        handleLogin(code);
    }, [searchParams, navigate, setAuth, resetLoggingIn]);

    const handleLogin = async (code: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/github`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) throw new Error('인증 실패');

            const data = await response.json();
            setAuth(data.user, data.token);
            navigate('/');
        } catch (error) {
            resetLoggingIn();
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
            navigate('/');
        }
    };

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
            <Loader2 className="h-12 w-12 animate-spin text-white/40" />
            <p className="mt-6 text-xl font-medium tracking-tight text-white/60">
                Giterra 연결 중...
            </p>
        </div>
    );
};

export default LoginCallback;
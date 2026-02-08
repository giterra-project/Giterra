import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../lib/apiBase';

const LoginCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setAuth, resetLoggingIn } = useAuthStore();
    const hasCalled = useRef(false);

    useEffect(() => {
        if (hasCalled.current) return;

        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            resetLoggingIn();
            navigate('/');
            return;
        }

        if (token) {
            hasCalled.current = true;
            handleTokenLogin(token);
        }
    }, [searchParams, navigate, resetLoggingIn]);

    const handleTokenLogin = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`, // GitHub API requires 'token' prefix usually, but check middleware. Auth router expects raw string in header? 
                    // auth.py: authorization: str = Header(None). Calls github with it.
                    // auth.py: headers={"Authorization": authorization}
                    // github expects "token OAUTH-TOKEN" or "Bearer OAUTH-TOKEN".
                    // The token we receive is raw access token.
                    // So we should send "token {token}" or just "{token}" depending on how backend uses it.
                    // Backend: headers={"Authorization": authorization}. So we should send full string "token {token}" if backend passes it directly.
                },
            });

            if (!response.ok) throw new Error('유저 정보 조회 실패');

            const userData = await response.json();
            // Map GitHub user data to store format if needed, or just use it.
            // Store expects 'user' object. user.login is used.
            setAuth(userData, token);
            navigate('/');
        } catch (error) {
            console.error(error);
            resetLoggingIn();
            alert('로그인 처리 중 오류가 발생했습니다.');
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

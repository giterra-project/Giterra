import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import type { User } from '../../types/store';

const LoginCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            api.get<User>('/api/v1/user/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((res) => {
                    setAuth(res.data, token);
                    navigate('/planet');
                })
                .catch(() => {
                    navigate('/');
                });
        } else {
            navigate('/');
        }
    }, [searchParams, setAuth, navigate]);

    return (
        <div className="h-screen w-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );
};

export default LoginCallback;
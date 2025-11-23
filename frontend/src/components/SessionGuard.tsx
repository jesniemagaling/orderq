import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/lib/axios';

export default function SessionGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const tokenFromState = location.state?.token;
    const tokenFromStorage = localStorage.getItem('sessionToken');
    const token = tokenFromState || tokenFromStorage;

    console.log('SessionGuard token:', token);

    if (!token) {
      navigate('/session-expired', { replace: true });
      return;
    }

    localStorage.setItem('sessionToken', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const verify = async () => {
      try {
        await api.get(`/sessions/verify/${token}`);
        setChecking(false);
      } catch (error) {
        localStorage.removeItem('sessionToken');
        navigate('/session-expired', { replace: true });
      }
    };

    verify();
  }, [navigate, location.state]);

  if (checking) return null;
  return <>{children}</>;
}

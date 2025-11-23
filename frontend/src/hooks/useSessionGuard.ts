import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@/lib/axios';
import { socket } from '@/lib/socket';

export function useSessionGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionUpdate = (data: any) => {
      const sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) return;

      if (data.status !== 'expired') return;
      if (!data.token || data.token !== sessionToken) return;

      toast.error('Your session has expired. Redirecting...');
      localStorage.removeItem('sessionToken');
      delete api.defaults.headers.common['Authorization'];

      setTimeout(() => {
        navigate('/session-expired', { replace: true });
      }, 1000);
    };

    socket.on('sessionUpdate', handleSessionUpdate);

    return () => {
      socket.off('sessionUpdate', handleSessionUpdate);
    };
  }, [navigate]);
}

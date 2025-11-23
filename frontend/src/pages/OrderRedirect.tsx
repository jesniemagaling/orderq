import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OrderRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const table = searchParams.get('table');
    const token = searchParams.get('token');

    if (table && token) {
      localStorage.setItem('sessionToken', token);
      console.log('Token saved:', localStorage.getItem('sessionToken'));
      navigate(`/menu?table=${table}`, { replace: true, state: { token } });
    } else {
      navigate('/session-expired', { replace: true });
    }
  }, [location, navigate]);

  if (redirecting) {
    return <p style={{ padding: 20 }}>Redirecting you now...</p>;
  }

  return null;
}

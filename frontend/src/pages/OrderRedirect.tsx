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
      navigate(`/menu?table=${table}&token=${token}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  if (redirecting) {
    return <p style={{ padding: 20 }}>Redirecting you now...</p>;
  }

  return null;
}

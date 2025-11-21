import { useEffect, useState } from 'react';
import { MenuItem } from '@/types/menu';
import api from '@/lib/axios';

export function useMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get<MenuItem[]>('/menu');

        const data = res.data.map((item) => ({
          ...item,
          image_url: item.image_url
            ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${
                item.image_url
              }?t=${Date.now()}`
            : '/images/placeholder.png',
        }));

        setMenuItems(data);
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return { menuItems, loading, error, setMenuItems };
}

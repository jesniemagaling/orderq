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
        setMenuItems(res.data);
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return { menuItems, loading, error };
}

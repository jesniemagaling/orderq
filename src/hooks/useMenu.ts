// src/hooks/useMenu.ts
import { useEffect, useState } from 'react';
import { MenuItem } from '@/types/menu';

export function useMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menus');
        if (!res.ok) throw new Error('Failed to fetch menu');
        const data: MenuItem[] = await res.json();
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

  return { menuItems, loading, error };
}

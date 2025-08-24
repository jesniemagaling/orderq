// src/components/MenuList.tsx
import { MenuItem } from '@/types/menu';
import PopularMenuCard from './HomeMenuCard';
import MenuCardSimple from './MenuCard';

interface MenuListProps {
  items: MenuItem[];
  variant?: 'popular' | 'simple';
  onAdd?: (item: MenuItem) => void;
}

export default function MenuList({
  items,
  variant = 'popular',
  onAdd,
}: MenuListProps) {
  return (
    <div
      className={
        variant === 'popular'
          ? 'flex flex-wrap gap-6 justify-center'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
      }
    >
      {items.map((item) =>
        variant === 'popular' ? (
          <PopularMenuCard key={item.id} item={item} onAdd={onAdd} />
        ) : (
          <MenuCardSimple key={item.id} item={item} onAdd={onAdd} />
        )
      )}
    </div>
  );
}

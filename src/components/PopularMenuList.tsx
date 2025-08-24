import popularMenu from '@/data/popular-menu.json';
import { MenuItem } from '@/types/menu';
import PopularMenuCard from './PopularMenuCard';

export default function PopularMenuList() {
  return (
    <div className="py-6">
      <h2 className="mb-6 heading-2">Popular</h2>
      <div className="flex flex-wrap gap-8">
        {popularMenu.map((item: MenuItem) => (
          <PopularMenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

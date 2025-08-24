import recommendedMenu from '@/data/recommended-menu.json';
import { MenuItem } from '@/types/menu';
import RecMenuCard from './RecMenuCard';

export default function RecMenuList() {
  return (
    <div className="py-6">
      <h2 className="mb-6 heading-2">Recommended</h2>
      <div className="flex flex-wrap gap-8">
        {recommendedMenu.map((item: MenuItem) => (
          <RecMenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

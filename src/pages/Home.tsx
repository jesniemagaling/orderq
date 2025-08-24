import Logo from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import menuData from '@/data/menu.json';
import PromotionCard from '@/components/PromotionCard';
import promotions from '@/data/promotions.json';
import HomeMenuCard from '@/components/HomeMenuCard';

export default function Home() {
  const [query1, setQuery1] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menuData);

  const popularMenu = menuItems.filter((item) => item.isPopular);
  const recommendedMenu = menuItems.filter((item) => item.isRecommended);

  const filteredMenu = menuItems.filter((item) =>
    item.name.toLowerCase().includes(query1.toLowerCase())
  );

  return (
    <>
      <header>
        <Logo />
        <div className="flex items-center justify-center w-full py-1.5 my-6 sm:my-8 heading-3 font-bold text-white rounded-lg bg-primary-500">
          START YOUR ORDER
        </div>
        <SearchInput
          value={query1}
          onChange={setQuery1}
          placeholder="What do you need?"
        />
      </header>

      <section>
        <h2 className="my-6 heading-2">Promotions</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {promotions.map((promo) => (
            <PromotionCard
              key={promo.id}
              title={promo.title}
              highlight={promo.highlight}
              subtitle={promo.subtitle}
              image={promo.image}
            />
          ))}
        </div>
      </section>

      <section className="gap-10 mt-6 md:grid md:grid-cols-2">
        <div className="py-6">
          <h2 className="mb-6 heading-2">Popular</h2>
          <div className="flex flex-wrap gap-8">
            {popularMenu.map((item) => (
              <HomeMenuCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="py-6">
          <h2 className="mb-6 heading-2">Recommended</h2>
          <div className="flex flex-wrap gap-8">
            {recommendedMenu.map((item) => (
              <HomeMenuCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

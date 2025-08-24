import Logo from '@/components/Logo';
import SearchInput from '@/components/SearchInput';
import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import menuData from '@/data/menu.json';
import PopularMenuList from '@/components/PopularMenuList';

export default function Home() {
  const [query1, setQuery1] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menuData);

  const filteredMenu = menuItems.filter((item) =>
    item.name.toLowerCase().includes(query1.toLowerCase())
  );

  return (
    <div className="px-4 md:px-8">
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

      <section className="mt-6">
        <PopularMenuList />
      </section>
    </div>
  );
}

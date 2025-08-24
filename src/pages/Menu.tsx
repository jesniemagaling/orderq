import Nav from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import menuData from '@/data/menu.json';
import MenuCard from '@/components/MenuCard';
import categoriesData from '@/data/categories.json';
import { Category } from '@/types/category';
import CategoryList from '@/components/CategoryList';

export default function Menu() {
  const [query1, setQuery1] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(menuData);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(query1.toLowerCase())
  );

  return (
    <>
      <Nav title="Menu" />
      <SearchInput
        value={query1}
        onChange={setQuery1}
        placeholder="What do you need?"
      />

      <div className="p-4">
        <CategoryList
          categories={categoriesData as Category[]}
          activeCategory={activeCategory}
          onSelect={(categoryId) => setActiveCategory(categoryId)}
        />

        <p className="mt-4 text-sm text-gray-600">
          Selected Category: {activeCategory}
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,_minmax(240px,_1fr))] gap-4 p-4 overflow-hidden">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onAdd={(menuItem) => console.log('Added:', menuItem)}
            />
          ))
        ) : (
          <p className="text-center text-gray-500">No items found</p>
        )}
      </div>
    </>
  );
}

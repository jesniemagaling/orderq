import Nav from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import menuData from '@/data/menu.json';
import MenuCard from '@/components/MenuCard';
import { useCartContext } from '@/context/CartContext';

export default function Search() {
  const [query1, setQuery1] = useState('');
  const { addToCart } = useCartContext();
  const items = menuData.menus as MenuItem[];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(query1.toLowerCase())
  );

  const displayItems =
    query1.trim() === '' ? filteredItems.slice(0, 3) : filteredItems;

  return (
    <>
      <Nav title="Search" />

      <div className="p-4">
        <SearchInput
          value={query1}
          onChange={setQuery1}
          placeholder="What do you need?"
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] gap-4 p-4">
        {displayItems.length > 0 ? (
          displayItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onAdd={(menuItem) => addToCart(menuItem)}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No items found
          </p>
        )}
      </div>
    </>
  );
}

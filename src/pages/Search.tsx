import Nav from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import menuData from '@/data/menu.json';
import MenuCard from '@/components/MenuCard';
import { useCart } from '@/context/CartContext';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const items = menuData.menus as MenuItem[];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayItems =
    searchTerm.trim() === '' ? filteredItems.slice(0, 3) : filteredItems;

  return (
    <>
      <Nav title="Search" />

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="What do you need?"
      />

      <div className="grid grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] gap-4 place-items-center sm:place-items-start">
        {displayItems.length > 0 ? (
          displayItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onAdd={(menuItem) => addToCart(menuItem, 1)}
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

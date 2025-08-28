import Nav from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import MenuCard from '@/components/MenuCard';
import categoriesData from '@/data/categories.json';
import { Category } from '@/types/category';
import CategoryList from '@/components/CategoryList';
import { useMenu } from '@/hooks/useMenu';
import { useCartContext } from '@/context/CartContext';

export default function Menu() {
  const [query1, setQuery1] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { menuItems, loading, error } = useMenu();
  const { addToCart } = useCartContext();

  const filteredItems = menuItems.filter((item: MenuItem) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(query1.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
      </div>

      {loading && <p className="text-center">Loading menu...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      <div className="grid grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] gap-4 p-4 overflow-hidden">
        {!loading && !error && filteredItems.length > 0
          ? filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onAdd={(menuItem) => addToCart(menuItem)}
              />
            ))
          : !loading &&
            !error && (
              <p className="text-center text-gray-500 col-span-full">
                No items found
              </p>
            )}
      </div>
    </>
  );
}

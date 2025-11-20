import Nav from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MenuCard from '@/components/MenuCard';
import CategoryList from '@/components/CategoryList';
import { useMenu } from '@/hooks/useMenu';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/context/CartContext';

export default function Menu() {
  const location = useLocation();
  const query = location.search;
  const searchParams = new URLSearchParams(location.search);
  const table = searchParams.get('table');
  const searchQuery = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { menuItems, loading: menuLoading, error: menuError } = useMenu();
  const { categories, loading: catLoading, error: catError } = useCategories();

  const { addToCart } = useCart();

  // Sync search input with URL
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  // Map DB categories to "slug" IDs from backend
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const categorySlug =
      item.category?.toLowerCase().replace(/\s+/g, '-') || '';

    const matchesCategory =
      activeCategory === 'all' || categorySlug === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Nav
        title={table ? `Table ${table}` : 'Menu'}
        backLink={`/menu${query}`}
      />

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="What do you need?"
      />

      <div className="p-4">
        <CategoryList
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          loading={catLoading}
          error={catError}
        />
      </div>

      {menuLoading && <p className="text-center">Loading menu...</p>}
      {menuError && <p className="text-center text-red-500">{menuError}</p>}

      <div className="grid grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] gap-4 p-4 overflow-hidden place-items-center sm:place-items-start">
        {!menuLoading && !menuError && filteredItems.length > 0
          ? filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onAdd={(menuItem) => addToCart(menuItem, 1)}
              />
            ))
          : !menuLoading &&
            !menuError && (
              <p className="text-center text-gray-500 col-span-full">
                No items found
              </p>
            )}
      </div>
    </>
  );
}

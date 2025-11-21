import Nav from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useState, useEffect } from 'react';
import { MenuItem } from '@/types/menu';
import MenuCard from '@/components/MenuCard';
import { useCart } from '@/context/CartContext';
import api from '@/lib/axios';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const { addToCart } = useCart();

  const baseUrl = import.meta.env.VITE_API_URL || '';
  const baseImageUrl = baseUrl.replace('/api', '');

  // Fetch menu items
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await api.get('/menu');

        const mappedItems: MenuItem[] = data.map((item: any) => {
          const rawPath = item.image_url || '';
          const cleanPath = rawPath.replace('/api', '').trim();

          const fixedImage = cleanPath.startsWith('http')
            ? cleanPath.includes('?')
              ? `${cleanPath}&t=${Date.now()}`
              : `${cleanPath}?t=${Date.now()}`
            : `${baseImageUrl}${cleanPath}${
                cleanPath.includes('?') ? '&t=' : '?t='
              }${Date.now()}`;

          return {
            id: String(item.id),
            name: item.name,
            price: Number(item.price),
            image_url: fixedImage,
            status: item.status === 'in_stock' ? 'in_stock' : 'out_of_stock',
            category: item.category,
            description: item.description,
            homeImage: item.image_url || '',
            isPopular: Boolean(item.isPopular),
            isRecommended: Boolean(item.isRecommended),
          };
        });

        setItems(mappedItems);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
      }
    };

    fetchMenu();
  }, [baseImageUrl]);

  // Filter by search term
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

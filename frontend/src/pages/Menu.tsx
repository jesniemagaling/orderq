import Nav from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MenuCard from '@/components/MenuCard';
import CategoryList from '@/components/CategoryList';
import { useMenu } from '@/hooks/useMenu';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/context/CartContext';
import { socket } from '@/lib/socket';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@/lib/axios';

export default function Menu() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const table = searchParams.get('table');
  const tokenFromURL = searchParams.get('token');
  const searchQuery = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const { menuItems, loading: menuLoading, error: menuError } = useMenu();
  const { categories, loading: catLoading, error: catError } = useCategories();

  const { addToCart } = useCart();

  // Save token from URL to state/localStorage and axios
  useEffect(() => {
    if (tokenFromURL) {
      setSessionToken(tokenFromURL);
      localStorage.setItem('sessionToken', tokenFromURL);
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenFromURL}`;
    } else {
      // If no token in URL, check localStorage
      const storedToken = localStorage.getItem('sessionToken');
      if (storedToken) {
        setSessionToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    }
  }, [tokenFromURL]);

  // Sync search input with URL
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!sessionToken) return; // Wait until token is known

    const handleSessionUpdate = (data: any) => {
      // Only process expiration events
      if (data.status !== 'expired') return;

      // Must match THIS user's session token
      if (!data.token || data.token !== sessionToken) return;

      toast.error('Your session has expired. Redirecting...');

      // Clear session token
      localStorage.removeItem('sessionToken');
      delete api.defaults.headers.common['Authorization'];

      // Redirect after delay
      setTimeout(() => {
        navigate('/session-expired', { replace: true });
      }, 1600);
    };

    socket.on('sessionUpdate', handleSessionUpdate);

    return () => {
      socket.off('sessionUpdate', handleSessionUpdate);
    };
  }, [sessionToken, navigate]);

  // Filter menu items by search term & category
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
        title={'Menu'}
        backLink={`/menu?table=${table}${
          sessionToken ? `&token=${sessionToken}` : ''
        }`}
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

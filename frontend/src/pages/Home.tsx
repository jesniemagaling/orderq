import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import PromotionCard from '@/components/PromotionCard';
import HomeMenuCard from '@/components/HomeMenuCard';
import promotions from '@/data/promotions.json';
import { useMenu } from '@/hooks/useMenu';
import api from '@/lib/axios';
import { toast } from 'react-toastify';
import { MenuItem } from '@/types/menu';

interface TopItemResponse {
  name: string;
  total_sold: string;
  total_revenue: string;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const { menuItems, loading, error } = useMenu();
  const [topItems, setTopItems] = useState<MenuItem[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const table = searchParams.get('table');
  if (!table) console.error('Table number missing in URL!');

  // Fetch top-selling items from backend
  useEffect(() => {
    const fetchTopItems = async () => {
      try {
        const res = await api.get<TopItemResponse[]>('/sales/items');
        const top2 = res.data.slice(0, 2);

        const matched: MenuItem[] = top2
          .map((top) => menuItems.find((m) => m.name === top.name))
          .filter((m): m is MenuItem => Boolean(m));

        setTopItems(matched);
      } catch (err) {
        console.error('Failed to fetch top items', err);
        toast.error('Failed to load top-selling items');
      }
    };

    if (menuItems.length > 0) fetchTopItems();
  }, [menuItems]);

  const handleSearch = () => {
    if (!table) return;
    const query = searchTerm.trim()
      ? `?table=${table}&search=${encodeURIComponent(searchTerm.trim())}`
      : `?table=${table}`;
    navigate(`/menu${query}`);
  };

  return (
    <>
      <header>
        <Logo />
        <div className="flex items-center justify-center w-full py-1.5 my-6 sm:my-8 heading-3 font-bold text-white rounded-lg bg-primary-500">
          START YOUR ORDER
        </div>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="What do you need?"
          onEnter={handleSearch}
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

      {loading && <p className="mt-6 text-center">Loading menu...</p>}
      {error && <p className="mt-6 text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <section className="gap-10 mt-6 md:grid md:grid-cols-2">
          <div className="py-6">
            <h2 className="mb-6 heading-2">Popular</h2>
            <div className="flex flex-wrap gap-8">
              {topItems.length > 0 ? (
                topItems.map((item) => (
                  <HomeMenuCard
                    key={item.id}
                    item={item}
                    onClick={() => {
                      if (!table) return;
                      navigate(`/menu/${item.id}?table=${table}`);
                    }}
                  />
                ))
              ) : (
                <p>No popular menu items available.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

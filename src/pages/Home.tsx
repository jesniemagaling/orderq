import { useState } from 'react';
import Logo from '@/components/Nav';
import SearchInput from '@/components/SearchInput';
import PromotionCard from '@/components/PromotionCard';
import HomeMenuCard from '@/components/HomeMenuCard';
import promotions from '@/data/promotions.json';
import { useMenu } from '@/hooks/useMenu';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const { menuItems, loading, error } = useMenu();
  const navigate = useNavigate();

  const popularMenu = menuItems.filter((item) => item.isPopular);
  const recommendedMenu = menuItems.filter((item) => item.isRecommended);
  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/Menu?search=${encodeURIComponent(searchTerm.trim())}`);
    }
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
              {popularMenu.length > 0 ? (
                popularMenu.map((item) => (
                  <HomeMenuCard key={item.id} item={item} />
                ))
              ) : (
                <p>No popular menu items available.</p>
              )}
            </div>
          </div>

          <div className="py-6">
            <h2 className="mb-6 heading-2">Recommended</h2>
            <div className="flex flex-wrap gap-8">
              {recommendedMenu.length > 0 ? (
                recommendedMenu.map((item) => (
                  <HomeMenuCard key={item.id} item={item} />
                ))
              ) : (
                <p>No recommended menu items available.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

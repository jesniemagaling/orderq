import { Category } from '@/types/category';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

interface CategoryListProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
  loading?: boolean;
  error?: string | null;
}

export default function CategoryList({
  categories,
  activeCategory,
  onSelect,
  loading = false,
  error = null,
}: CategoryListProps) {
  if (loading) {
    return (
      <div className="flex gap-4 py-4 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
            <div className="w-10 h-3 mt-2 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="py-2 text-center text-red-500">{error}</p>;
  }

  return (
    <Swiper
      spaceBetween={20}
      slidesPerView="auto"
      className="pb-2"
      centeredSlides={false}
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;

        return (
          <SwiperSlide key={cat.id} style={{ width: 'auto' }}>
            <button
              onClick={() => onSelect(cat.id)}
              className="flex flex-col items-center p-1 focus:outline-none"
            >
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-200 
                ${isActive ? 'bg-primary-500 scale-105' : 'bg-gray-100'}`}
              >
                <img
                  src={cat.icon || '/images/default-icon.png'}
                  alt={cat.name}
                  className="object-contain w-10 h-10"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/images/default-icon.png';
                  }}
                />
              </div>

              <span
                className={`mt-2 text-sm font-medium transition-colors 
                ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
              >
                {cat.name}
              </span>
            </button>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}

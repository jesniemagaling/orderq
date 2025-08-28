import { Category } from '@/types/category';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

interface CategoryListProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
}

export default function CategoryList({
  categories,
  activeCategory,
  onSelect,
}: CategoryListProps) {
  return (
    <Swiper spaceBetween={20} slidesPerView="auto" className="pb-2">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <SwiperSlide key={cat.id} style={{ width: 'auto' }}>
            <button
              onClick={() => onSelect(cat.id)}
              className="flex flex-col items-center focus:outline-none"
            >
              <div
                className={`flex items-center justify-center w-16 h-16 rounded-2xl transition 
                ${isActive ? 'bg-primary-500' : 'bg-transparent'}`}
              >
                <img
                  src={cat.icon}
                  alt={cat.name}
                  className="object-contain w-10 h-10"
                />
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  isActive ? 'text-primary-500' : 'text-gray-500'
                }`}
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

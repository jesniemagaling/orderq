import { Category } from '@/types/category';

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
    <div className="flex gap-6 pb-2 overflow-x-auto">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center focus:outline-none"
          >
            {/* Image Container */}
            <div
              className={`flex items-center justify-center w-16 h-16 rounded-2xl transition 
              ${isActive ? 'bg-red-700' : 'bg-transparent'}`}
            >
              <img
                src={cat.icon}
                alt={cat.name}
                className="object-contain w-10 h-10"
              />
            </div>

            {/* Category Name */}
            <span
              className={`mt-2 text-sm font-medium ${
                isActive ? 'text-red-700' : 'text-gray-500'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import { MenuItem } from '@/types/menu';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '@/context/CartContext';

interface MenuListCardProps {
  item: MenuItem;
  onAdd?: (item: MenuItem) => void;
}

export default function MenuCard({ item, onAdd }: MenuListCardProps) {
  const { id, name, price, image_url, status } = item;
  const { addToCart } = useCart();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const table = searchParams.get('table');
  const token = searchParams.get('token');

  // Build link with table & token if available
  const buildLink = () => {
    const params = new URLSearchParams();
    if (table) params.set('table', table);
    if (token) params.set('token', token);
    const query = params.toString();
    return query ? `/menu/${id}?${query}` : `/menu/${id}`;
  };

  // Handle adding to cart
  const handleAddToCart = () => {
    if (onAdd) {
      onAdd(item);
    } else {
      addToCart(item, 1);
    }
    toast.success(`${item.name} added to cart!`);
  };

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  const displayImage = image_url
    ? image_url.startsWith('http')
      ? `${image_url}?t=${Date.now()}`
      : `${baseUrl}/${image_url.replace(/^\/+/, '')}?t=${Date.now()}`
    : '/images/placeholder.png';

  return (
    <div className="flex items-center justify-between w-full p-3 bg-white rounded-2xl shadow-dual max-w-[310px]">
      <Link to={buildLink()} className="flex items-center flex-grow">
        <div className="flex-shrink-0 w-[58px] h-[48px] rounded-[10px] overflow-hidden">
          <img
            src={displayImage}
            alt={name}
            className="object-cover w-full h-full rounded-[10px]"
          />
        </div>

        <div className="flex flex-col flex-grow px-3">
          <h3 className="truncate heading-3">{name}</h3>
          <p className="font-bold text-yellow-500 heading-3">
            ₱{' '}
            {Number(price) % 1 === 0 ? Number(price) : Number(price).toFixed(2)}
          </p>
        </div>
      </Link>

      {status === 'in_stock' ? (
        <button
          onClick={handleAddToCart}
          className="flex items-center justify-center transition-transform rounded-full hover:scale-110"
          aria-label={`Add ${name} to cart`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM12 8.8H8.8V12H7.2V8.8H4V7.2H7.2V4H8.8V7.2H12V8.8Z"
              fill="#0E803C"
            />
          </svg>
        </button>
      ) : (
        <span className="text-xs text-gray-400">Unavailable</span>
      )}
    </div>
  );
}

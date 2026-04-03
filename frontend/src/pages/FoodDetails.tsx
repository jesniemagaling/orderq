import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MenuItem } from '@/types/menu';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useCart } from '@/context/CartContext';
import { Plus, Minus, ShoppingCart, Star, Clock, Flame } from 'lucide-react';
import api from '@/lib/axios';
import { useSessionGuard } from '@/hooks/useSessionGuard';

export default function FoodDetails() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table');
  const sessionToken = searchParams.get('token');
  const { id } = useParams<{ id: string }>();
  const [food, setFood] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageSrc, setImageSrc] = useState('');
  const { addToCart, cartCount } = useCart();
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const navigate = useNavigate();

  const clampQuantity = (value: number) => Math.max(1, Math.min(99, value));
  const handleIncrease = () => setQuantity((q) => Math.min(q + 1, 99));
  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleQuantityChange = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric) {
      setQuantity(1);
      return;
    }
    setQuantity(clampQuantity(Number.parseInt(numeric, 10)));
  };

  const baseUrl = import.meta.env.VITE_API_URL || '';

  useSessionGuard();

  // Fetch food details
  useEffect(() => {
    if (!id) return;

    const fetchFood = async () => {
      try {
        const { data } = await api.get<MenuItem>(`/menu/${id}`);

        const mappedFood: MenuItem = {
          id: Number(data.id),
          name: data.name,
          category: data.category,
          description: data.description,
          price: Number(data.price),
          image_url: data.image_url || '',
          homeImage: data.image_url || '',
          status: data.status,
          isPopular: Boolean(data.isPopular),
          isRecommended: Boolean(data.isRecommended),
        };

        setFood(mappedFood);

        const baseImageUrl = baseUrl.endsWith('/api')
          ? baseUrl.replace(/\/api$/, '')
          : baseUrl;
        let cleanPath = (mappedFood.image_url || '').replace('/api', '').trim();
        const displayImage = cleanPath.startsWith('http')
          ? `${cleanPath}?t=${Date.now()}`
          : `${baseImageUrl}${cleanPath}?t=${Date.now()}`;

        setImageSrc(displayImage);
      } catch (err) {
        console.error('Error fetching food:', err);
        setFood(null);
        setImageSrc('/images/placeholder.png');
      }
    };

    fetchFood();
  }, [id, baseUrl]);

  const handleAddToCart = () => {
    if (!food) return;
    addToCart(food, quantity);
    toast.success(`${quantity} ${food.name} added to cart!`, {
      autoClose: 1200,
    });
    setQuantity(1);
  };

  if (!food) return <p className="p-6 text-gray-500">Food item not found.</p>;

  return (
    <>
      <div className="grid justify-center gap-6 pb-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton size={36} />
            <Link
              to={`/cart${query}`}
              className="flex items-center gap-1 px-2 py-2 bg-white rounded-full hover:opacity-80"
            >
              <div className="relative">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.43164 3.25H3.9328C4.48495 3.25 4.96813 3.62121 5.1104 4.15472L5.52553 5.71143M8.11914 15.4375C6.32422 15.4375 4.86914 16.8926 4.86914 18.6875H21.9316M8.11914 15.4375H20.2723C21.4868 12.9451 22.5467 10.3635 23.4393 7.70521C18.2809 6.38783 12.8755 5.6875 7.30664 5.6875C6.71103 5.6875 6.11729 5.69551 5.52553 5.71143M8.11914 15.4375L5.52553 5.71143M6.49414 21.9375C6.49414 22.3862 6.13037 22.75 5.68164 22.75C5.23291 22.75 4.86914 22.3862 4.86914 21.9375C4.86914 21.4888 5.23291 21.125 5.68164 21.125C6.13037 21.125 6.49414 21.4888 6.49414 21.9375ZM20.3066 21.9375C20.3066 22.3862 19.9429 22.75 19.4941 22.75C19.0454 22.75 18.6816 22.3862 18.6816 21.9375C18.6816 21.4888 19.0454 21.125 19.4941 21.125C19.9429 21.125 20.3066 21.4888 20.3066 21.9375Z"
                    stroke="#1A1A1A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute sm:-top-1 sm:-right-1 -top-2 -right-2 bg-primary-500 text-white sm:text-xs text-[10px] rounded-full px-1.5 py-0.5">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Hero Image */}
          <div className="relative overflow-hidden bg-white shadow-xl rounded-3xl">
            {/* SOFTER gradient */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            <img
              src={imageSrc}
              alt={food.name}
              className="object-cover w-full h-80"
            />

            {/* Badges */}
            <div className="absolute z-20 flex gap-2 top-4 left-4">
              {food.isPopular && (
                <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-yellow-500 rounded-full shadow">
                  <Flame className="w-3 h-3" />
                  Popular
                </span>
              )}
              {food.isRecommended && (
                <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-green-500 rounded-full shadow">
                  <Star className="w-3 h-3" />
                  Recommended
                </span>
              )}
            </div>

            {/* Category */}
            <div className="absolute z-20 bottom-4 left-4">
              <span className="px-4 py-2 text-sm font-semibold bg-white rounded-full shadow">
                {food.category}
              </span>
            </div>
          </div>

          {/* Details Card */}
          <div className="p-6 space-y-4 bg-white border shadow-lg rounded-3xl">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{food.name}</h1>
              <p className="mt-1 text-2xl font-bold text-yellow-500">
                ₱{Math.floor(food.price)}
              </p>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Description */}
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                About this dish
              </p>
              <p className="leading-relaxed text-gray-600">
                {food.description}
              </p>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Quantity */}
            <div>
              <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Quantity
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  className="flex items-center justify-center bg-gray-100 w-11 h-11 rounded-xl hover:bg-gray-200 active:scale-95 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>

                {/* Quantity input */}
                <div className="flex-1 bg-gray-50 rounded-xl">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onBlur={(e) => handleQuantityChange(e.target.value)}
                    className="w-full py-3 text-xl font-bold text-center bg-transparent rounded-xl border border-transparent focus:border-red-400 focus:ring-2 focus:ring-red-200 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleIncrease}
                  disabled={quantity >= 99}
                  className="flex items-center justify-center bg-gray-100 w-11 h-11 rounded-xl hover:bg-gray-200 active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between max-w-2xl gap-2 px-4 py-4 mx-auto">
          {food.status === 'in_stock' ? (
            <>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold">
                  ₱{(Math.floor(food.price) * quantity).toLocaleString()}
                </p>
              </div>

              <Button onClick={handleAddToCart} className="h-12">
                <ShoppingCart className="w-6 h-6 mr-2" />
                Add to Cart
              </Button>
            </>
          ) : (
            <p className="w-full py-3 font-semibold text-center text-red-500">
              Currently Unavailable
            </p>
          )}
        </div>
      </div>
    </>
  );
}

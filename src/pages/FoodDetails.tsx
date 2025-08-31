import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MenuItem } from '@/types/menu';
import menuData from '@/data/menu.json';
import BackButton from '@/components/BackButton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useCart } from '@/context/CartContext';
import { Plus, Minus } from 'lucide-react';

export default function FoodDetails() {
  const { id } = useParams<{ id: string }>();
  const [food, setFood] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const { addToCart, cartCount } = useCart();
  const navigate = useNavigate();

  const handleIncrease = () => {
    setQuantity((q) => Math.min(q + 1, 99));
  };

  const handleDecrease = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  useEffect(() => {
    if (id) {
      const foundFood = menuData.menus.find((item) => String(item.id) === id);
      setFood(foundFood || null);
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!food) return;
    addToCart(food, quantity);
    toast.success(`${quantity} ${food.name} added to cart!`, {
      autoClose: 1200,
    });
    setQuantity(1);
  };

  if (!food) {
    return <p className="p-6 text-gray-500">Food item not found.</p>;
  }

  return (
    <div className="grid items-center justify-center gap-4">
      <div className="flex items-center justify-between">
        <BackButton size={36} />
        <Link
          to="/cart"
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
      <div className="w-full max-w-xl pb-4 space-y-5 sm:pb-8">
        <img
          src={food.image}
          alt={food.name}
          className="w-full max-w-xl shadow-lg max-h-lg rounded-2xl"
        />
        <h1 className="mb-2 text-3xl font-medium sm:text-4xl">{food.name}</h1>
        <p className="grid gap-2 text-gray-500 ">
          <span className="text-2xl text-black">Description</span>
          {food.description}
        </p>
        <div className="flex items-center gap-3">
          <span className="sm:text-lg">Quantity:</span>
          <button
            onClick={handleDecrease}
            className="text-lg text-primary-500 hover:opacity-70"
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="w-2 text-sm font-medium text-center sm:text-base">
            {quantity}
          </span>
          <button
            onClick={handleIncrease}
            className="text-lg text-primary-500 hover:opacity-70"
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-base font-bold text-yellow-500 sm:text-lg">
          <span className="text-lg font-medium text-black sm:text-xl">
            Price:{' '}
          </span>
          ₱{food.price}
        </p>
        {food.available ? (
          <Button onClick={handleAddToCart} variant="default" className="py-6">
            Add to Cart
          </Button>
        ) : (
          <span className="block mt-4 text-red-500">Unavailable</span>
        )}
      </div>
    </div>
  );
}

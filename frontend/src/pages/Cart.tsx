import { useSessionGuard } from '@/hooks/useSessionGuard';
import CartItem from '@/components/CartItem';
import Nav from '@/components/Nav';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-toastify';
import { MenuItem } from '@/types/menu';
import { Separator } from '@/components/ui/separator';

export default function Cart() {
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table');
  // fallback to localStorage if token is missing in URL
  const sessionToken =
    searchParams.get('token') || localStorage.getItem('sessionToken');

  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    totalPrice,
  } = useCart();

  const navigate = useNavigate();
  useSessionGuard();

  const handleIncrease = (item: MenuItem) => {
    increaseQuantity(item);
    toast.success(`Increased quantity of ${item.name}`, { autoClose: 1200 });
  };

  const handleDecrease = (item: MenuItem) => {
    decreaseQuantity(item);
    toast.info(`Decreased quantity of ${item.name}`, { autoClose: 1200 });
  };

  const handleRemove = (item: MenuItem) => {
    removeFromCart(item);
    toast.error(`${item.name} removed from cart`, { autoClose: 1500 });
  };

  return (
    <>
      <Nav title="Your Cart" />
      <div className="max-w-xl p-2 pt-2 mx-auto bg-white sm:p-4 rounded-xl">
        {cart.length === 0 ? (
          <p className="mt-6 text-center text-gray-500">Your cart is empty.</p>
        ) : (
          <>
            {cart.map((item, index) => {
              const baseImageUrl = import.meta.env.VITE_API_URL.replace(
                '/api',
                ''
              );
              const cleanPath = (item.image_url || '')
                .replace('/api', '')
                .trim();

              const fixedImageUrl = cleanPath.startsWith('http')
                ? cleanPath
                : `${baseImageUrl}${cleanPath}`;

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="cursor-pointer"
                  onClick={() => navigate(`/menu/${item.id}`)}
                >
                  <CartItem
                    item={{ ...item, image_url: fixedImageUrl }}
                    quantity={item.quantity}
                    onIncrease={() => handleIncrease(item)}
                    onDecrease={() => handleDecrease(item)}
                    onRemove={() => handleRemove(item)}
                  />
                </div>
              );
            })}

            <Separator />

            <div className="flex items-center justify-between m-6">
              <p className="text-lg font-medium">Total:</p>
              <p className="text-xl font-bold text-yellow-500">
                ₱{' '}
                {totalPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>

            <div className="flex justify-center w-full">
              <Button
                variant="default"
                className="w-full py-6"
                onClick={() => {
                  if (cart.length === 0) {
                    toast.error('Cart is empty!');
                    return;
                  }

                  if (!sessionToken) {
                    toast.error(
                      'Session expired. Please scan the QR code again.'
                    );
                    navigate('/session-expired');
                    return;
                  }

                  // Save token to localStorage for future use
                  localStorage.setItem('sessionToken', sessionToken);

                  navigate(
                    `/payment-method?table=${table}&token=${sessionToken}`
                  );
                }}
              >
                Proceed to Payment
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

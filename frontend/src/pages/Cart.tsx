import CartItem from '@/components/CartItem';
import Nav from '@/components/Nav';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-toastify';
import { MenuItem } from '@/types/menu';
import { Separator } from '@/components/ui/separator';

export default function Cart() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    totalPrice,
  } = useCart();

  const navigate = useNavigate();

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
            {cart.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer"
                onClick={() => navigate(`/menu/${item.id}`)}
              >
                <CartItem
                  key={item.id}
                  item={item}
                  quantity={item.quantity}
                  onIncrease={() => handleIncrease(item)}
                  onDecrease={() => handleDecrease(item)}
                  onRemove={() => handleRemove(item)}
                />
              </div>
            ))}

            <Separator />

            <div className="flex items-center justify-between m-6 ">
              <p className="text-lg font-medium">Total:</p>
              <p className="text-xl font-bold text-yellow-500">
                ₱ {totalPrice.toLocaleString()}
              </p>
            </div>
            <Link to="/payment-method" className="flex justify-center w-full">
              <Button variant="default" className="py-6">
                Proceed to Pay
              </Button>
            </Link>
          </>
        )}
      </div>
    </>
  );
}

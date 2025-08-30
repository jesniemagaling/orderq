import CartItem from '@/components/CartItem';
import Nav from '@/components/Nav';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useCartContext } from '@/context/CartContext';
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
  } = useCartContext();

  const handleIncrease = (item: MenuItem, name: string) => {
    increaseQuantity(item);
    toast.success(`Increased quantity of ${name}`, { autoClose: 1200 });
  };

  const handleDecrease = (item: MenuItem, name: string) => {
    decreaseQuantity(item);
    toast.info(`Decreased quantity of ${name}`, { autoClose: 1200 });
  };

  const handleRemove = (item: MenuItem, name: string) => {
    removeFromCart(item);
    toast.error(`${name} removed from cart`, { autoClose: 1500 });
  };

  return (
    <div className="max-w-xl mx-auto">
      <Nav title="Your Cart" />
      <div className="p-2 pt-2 bg-white sm:p-4 rounded-xl">
        {cart.length === 0 ? (
          <p className="mt-6 text-center text-gray-500">Your cart is empty.</p>
        ) : (
          <>
            {cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                quantity={item.quantity}
                onIncrease={() => handleIncrease(item, item.name)}
                onDecrease={() => handleDecrease(item, item.name)}
                onRemove={() => handleRemove(item, item.name)}
              />
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
    </div>
  );
}

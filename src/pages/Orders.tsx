import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Nav from '@/components/Nav';
import { useCart } from '@/context/CartContext';

export default function Orders() {
  const { cart, totalPrice } = useCart();

  const tax = totalPrice * 0.1;
  const total =
    cart.reduce((sum, item, quantity) => sum + item.price * item.quantity, 0) +
    tax;

  return (
    <>
      <Nav title="Order History"></Nav>
      {cart.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">Your cart is empty.</p>
      ) : (
        <div className="flex flex-col mt-6 space-y-6">
          <p className="text-sm text-right text-primary-500">
            Table#: <span className="text-black">13</span>
          </p>

          <div className="flex-1 max-w-[560px]">
            <div className="grid grid-cols-[2fr_1fr_1fr] items-center mb-2 text-sm ">
              <span className="text-lg sm:text-3xl">Ordered items</span>
              <span className="text-center">Qty.</span>
              <span className="text-right">Price</span>
            </div>

            {cart.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[2fr_1fr_1fr] py-1 text-sm border-b border-gray-100 text-gray-600"
              >
                <span>{item.name}</span>
                <span className="text-center">{item.quantity}</span>
                <span className="text-right">₱{item.price}</span>
              </div>
            ))}

            <div className="grid grid-cols-[2fr_1fr_1fr] py-1 text-sm border-b border-gray-100 text-gray-600">
              <span>Tax 10 %</span>
              <span className="text-center">-</span>
              <span className="text-right">₱{tax}</span>
            </div>

            <div className="grid grid-cols-[2fr_1fr_1fr] mt-2 font-medium text-sm sm:text-base">
              <span>Total Amount</span>
              <span></span>
              <span className="text-right">₱{total}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 py-6">
            <Link to="/payment-method" className="flex justify-center w-full">
              <Button variant="default" className="py-6">
                Proceed to Pay
              </Button>
            </Link>
            <Link to="/order-status" className="flex justify-center w-full">
              <Button variant="ghost" className="py-6">
                Track Order
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

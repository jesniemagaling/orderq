import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import Nav from '@/components/Nav';
import { useCart } from '@/context/CartContext';

export default function Orders() {
  const { orders } = useCart();

  return (
    <>
      <Nav title="Order History" />
      {orders.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">No recent orders.</p>
      ) : (
        <div className="flex flex-col mt-6 mb-6 space-y-10">
          {orders.map((order, orderIndex) => {
            const tax = order.total * 0.1;
            const total = order.total + tax;

            const orderDate = new Date(order.createdAt).toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
              }
            );

            return (
              <div key={orderIndex} className="space-y-4">
                <p className="px-2 text-sm text-right text-primary-500">
                  {orderDate}{' '}
                  <span className="text-black">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                  Table#: <span className="text-black">13</span>
                </p>

                <div className="px-2 flex-1 max-w-[560px]">
                  <div className="grid grid-cols-[2fr_1fr_1fr] items-center mb-2 text-sm">
                    <span className="text-lg sm:text-2xl">Ordered items</span>
                    <span className="text-center">Qty.</span>
                    <span className="text-right">Price</span>
                  </div>

                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[2fr_1fr_1fr] py-1 text-sm sm:text-base border-b border-gray-100 text-gray-600"
                    >
                      <span>{item.name}</span>
                      <span className="text-center">{item.quantity}</span>
                      <span className="text-right">₱{item.price}</span>
                    </div>
                  ))}

                  <div className="grid grid-cols-[2fr_1fr_1fr] py-1 text-sm sm:text-base border-b border-gray-100 text-gray-600">
                    <span>Tax 10%</span>
                    <span className="text-center">-</span>
                    <span className="text-right">₱{tax}</span>
                  </div>

                  <div className="grid grid-cols-[2fr_1fr_1fr] mt-2 font-medium text-sm sm:text-lg">
                    <span>Total Amount</span>
                    <span></span>
                    <span className="text-right">₱{total}</span>
                  </div>
                </div>

                <Separator />

                <Link
                  to={`/order-status/${order.id}`}
                  className="flex justify-center w-full"
                >
                  <Button variant="default" className="py-6">
                    Track Order
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

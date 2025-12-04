import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import Nav from '@/components/Nav';
import { useCart } from '@/context/CartContext';
import api from '@/lib/axios';
import { useSessionGuard } from '@/hooks/useSessionGuard';
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  table_number: string;
  items: OrderItem[];
}

export default function Orders() {
  const { sessionToken } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useSessionGuard();

  useEffect(() => {
    if (!sessionToken) return;

    const fetchOrders = async () => {
      try {
        const res = await api.get<Order[]>(
          `/orders/by-session?token=${sessionToken}`
        );
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sessionToken]);

  if (loading) return <p className="mt-8 text-center">Loading orders...</p>;

  if (!orders.length)
    return <p className="mt-8 text-center text-gray-500">No recent orders.</p>;

  return (
    <>
      <Nav title="Order History" />
      <div className="flex flex-col mt-6 mb-6 space-y-10">
        {orders.map((order, idx) => {
          const totalAmount = Number(order.total_amount);
          const tax = totalAmount * 0.1;
          const total = totalAmount + tax;

          const orderDate = new Date(order.created_at).toLocaleDateString(
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
            <div key={idx} className="space-y-4">
              <p className="px-2 text-sm text-right text-primary-500">
                {orderDate}{' '}
                <span className="text-black">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                Table#: <span className="text-black">{order.table_number}</span>
              </p>

              <div className="px-2 flex-1 max-w-[560px]">
                <div className="grid grid-cols-[2fr_1fr_1fr] items-center mb-2 text-sm">
                  <span className="text-lg sm:text-2xl">Ordered items</span>
                  <span className="text-center">Qty.</span>
                  <span className="text-right">Price</span>
                </div>

                {order.items.map((item: OrderItem, i) => (
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
                  <span className="text-right">₱{tax.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-[2fr_1fr_1fr] mt-2 font-medium text-sm sm:text-lg">
                  <span>Total Amount</span>
                  <span></span>
                  <span className="text-right">₱{total.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {order.status === 'canceled' ? (
                <div className="flex justify-center w-full">
                  <Button variant="default" disabled className="py-6">
                    Order Canceled
                  </Button>
                </div>
              ) : (
                <Link
                  to={`/order-status/${order.id}?table=${order.table_number}&token=${sessionToken}`}
                  className="flex justify-center w-full"
                >
                  <Button variant="default" className="py-6">
                    Track Order
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

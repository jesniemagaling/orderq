import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import BackButton from '@/components/BackButton';
import api from '@/lib/axios';
import { io, Socket } from 'socket.io-client';

// WebSocket connection
const socket: Socket = io('http://localhost:5000', {
  transports: ['websocket'], // ensures stable connection
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

const statusSteps = [
  { title: 'Order Confirmed', desc: 'Your order has been received' },
  { title: 'Order is being prepared', desc: 'Your food is getting prepared' },
  { title: 'Order Prepared', desc: 'Your order has been prepared' },
  { title: 'Delivery in process', desc: 'Hang on, your food is on the way' },
  { title: 'Delivery successfully done', desc: 'Enjoy your food!' },
];

type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
};

type Order = {
  id: number;
  table_id: number;
  table_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  items: OrderItem[];
};

export default function TrackOrder() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('token');

  // Fetch order initially
  useEffect(() => {
    if (!orderId || !sessionToken) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get<Order[]>(
          `/orders/by-session?token=${sessionToken}`
        );
        const foundOrder = res.data.find((o) => o.id.toString() === orderId);

        if (!foundOrder) {
          setError('Order not found.');
        } else {
          // Convert amounts to numbers
          foundOrder.total_amount = Number(foundOrder.total_amount);
          foundOrder.items = foundOrder.items.map((item) => ({
            ...item,
            price: Number(item.price),
          }));
          setOrder(foundOrder);
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError('Failed to fetch order.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, sessionToken]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!orderId) return;

    const handleOrderUpdate = (data: {
      orderId: number;
      status: string;
      total_amount?: number;
      items?: OrderItem[];
    }) => {
      if (data.orderId.toString() === orderId && order) {
        setOrder((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            status: data.status,
            total_amount:
              data.total_amount !== undefined
                ? Number(data.total_amount)
                : prev.total_amount,
            items: data.items
              ? data.items.map((i) => ({ ...i, price: Number(i.price) }))
              : prev.items,
          };
        });
      }
    };

    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [orderId, order]);

  if (loading) return <p className="mt-6 text-center">Loading order...</p>;
  if (error) return <p className="mt-6 text-center text-red-500">{error}</p>;
  if (!order) return <p className="mt-6 text-center">Order not found.</p>;

  const currentStep = (() => {
    switch (order.status) {
      case 'pending':
        return 0;
      case 'unserved':
        return 1;
      case 'served':
        return 2;
      case 'delivery_in_process':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  })();

  return (
    <div className="space-y-12">
      <BackButton size={36} />
      <div className="flex flex-col items-center space-y-6 bg-white">
        <h1 className="heading-2">TRACK YOUR ORDER</h1>

        <div className="flex flex-col">
          {statusSteps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-8 h-8 border-2 border-gray-500 rounded-full">
                  {index <= currentStep && (
                    <div className="w-4 h-4 bg-gray-500 rounded-full" />
                  )}
                </div>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`w-[2px] h-10 ${
                      index < currentStep ? 'bg-gray-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
              <div className="space-y-2">
                <p className="font-normal heading-3">{step.title}</p>
                <p className="font-normal text-gray-600 heading-4">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid w-full gap-4 place-items-center">
        <Link
          to={`/receipt/${order.id}`}
          className="flex justify-center w-full"
        >
          <Button variant="default" className="py-6">
            View Receipt
          </Button>
        </Link>
        <Link to="/menu">
          <Button variant="link">Back to Menu</Button>
        </Link>
      </div>
    </div>
  );
}

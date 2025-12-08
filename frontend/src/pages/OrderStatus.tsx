import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import BackButton from '@/components/BackButton';
import api from '@/lib/axios';
import { socket } from '@/lib/socket';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { toast } from 'react-toastify';

const statusSteps = [
  { title: 'Order Pending', desc: 'Your order has been placed' },
  { title: 'Order Confirmed', desc: 'Your order has been confirmed' },
  { title: 'Order Served', desc: 'Your order has been delivered' },
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
  const [isCancelling, setIsCancelling] = useState(false);

  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('token');
  const table = searchParams.get('table');

  useSessionGuard();

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
          foundOrder.total_amount = Number(foundOrder.total_amount);
          foundOrder.items = foundOrder.items.map((item) => ({
            ...item,
            price: Number(item.price),
          }));
          setOrder(foundOrder);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to fetch order.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, sessionToken]);

  // SOCKET LISTENER
  useEffect(() => {
    if (!orderId) return;

    const handleTableStatusUpdate = (data: any) => {
      const updates = Array.isArray(data) ? data : [data];

      setOrder((prev) => {
        if (!prev) return prev;

        console.log('Previous order state:', prev);
        console.log('Socket updates:', updates);

        // Match by table number (string) instead of tableId
        const update = updates[0];

        console.log('Matching update found:', update);

        if (!update) return prev;

        if (update.status === 'unserved' && prev.status === 'pending') {
          toast.warning('Your order has been confirmed by the cashier.');
        }

        return {
          ...prev,
          status: update.status || update.new_status,
        };
      });
    };

    socket.on('tableStatusUpdate', handleTableStatusUpdate);

    return () => {
      socket.off('tableStatusUpdate', handleTableStatusUpdate);
    };
  }, [orderId]);

  // COMPUTE STEP dynamically whenever order status changes
  const currentStep = useMemo(() => {
    switch (order?.status) {
      case 'pending':
        return 0;
      case 'unserved':
      case 'in_progress':
        return 1;
      case 'served':
        return 2;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  }, [order?.status]);

  useEffect(() => {
    console.log('Order state changed:', order);
  }, [order]);

  useEffect(() => {
    console.log('Current step recalculated:', currentStep);
  }, [currentStep]);

  const canCancel =
    order && order.payment_method === 'cash' && order.status === 'pending';

  const cancelOrder = async () => {
    if (!order) return;

    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this order?'
    );
    if (!confirmCancel) return;

    try {
      setIsCancelling(true);
      await api.put(`/orders/${order.id}/cancel`);
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));

      setTimeout(() => {
        navigate(`/orders?table=${table}&token=${sessionToken}`);
      }, 1000);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to cancel order.';
      toast.warning(message);
      if (message.includes('cannot be canceled')) {
        setOrder((prev) => (prev ? { ...prev, status: 'unserved' } : prev));
      }
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return <p className="mt-6 text-center">Loading order...</p>;
  if (error) return <p className="mt-6 text-center text-red-500">{error}</p>;
  if (!order) return <p className="mt-6 text-center">Order not found.</p>;

  return (
    <>
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

        {/* Action Buttons */}
        <div className="flex items-center gap-4 p-4">
          {canCancel && (
            <div className="flex justify-end flex-1">
              <Button
                className="w-full py-6 max-w-56"
                disabled={isCancelling}
                onClick={cancelOrder}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            </div>
          )}

          <div
            className={`flex flex-1 ${
              canCancel ? 'justify-between' : 'justify-center'
            }`}
          >
            <Link
              className="w-full max-w-56"
              to={`/receipt/${order.id}?table=${order.table_number}&token=${sessionToken}`}
            >
              <Button className="w-full py-6">View Receipt</Button>
            </Link>
          </div>
        </div>
      </div>

      <Button
        variant="link"
        className="w-full"
        onClick={() =>
          navigate(`/menu?table=${table ?? ''}&token=${sessionToken ?? ''}`)
        }
      >
        Back to Menu
      </Button>
    </>
  );
}

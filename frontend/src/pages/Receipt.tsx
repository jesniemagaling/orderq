import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import api from '@/lib/axios';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import type { Order } from '@/types/order';
import { toast } from 'react-toastify';

export default function Receipt() {
  const storeInfo = {
    store: 'OrderQ',
    address: 'Malolos, Bulacan\n12345 Capitol View',
    hours: '7:00 - 21:00',
    uid: 'CE12345678',
  };

  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('token');
  const table = searchParams.get('table');

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useSessionGuard();

  useEffect(() => {
    if (!orderId || !sessionToken) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get<Order[]>(
          `/orders/by-session?token=${sessionToken}`,
        );
        const foundOrder = res.data.find(
          (o: any) => o.id.toString() === orderId,
        );

        if (!foundOrder) {
          setError('Receipt not found.');
        } else {
          // Ensure numbers
          foundOrder.total_amount = Number(foundOrder.total_amount);
          foundOrder.items = foundOrder.items.map((i: any) => ({
            ...i,
            price: Number(i.price),
          }));
          setOrder(foundOrder);
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError('Failed to fetch receipt.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, sessionToken]);

  if (loading) return <p className="mt-6 text-center">Loading receipt...</p>;
  if (error) return <p className="mt-6 text-center text-red-500">{error}</p>;
  if (!order) return <p className="mt-6 text-center">Receipt not found.</p>;

  const subtotal = Number(order.subtotal_amount ?? order.total_amount ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const tax = Number(order.tax_amount ?? 0);
  const totalWithTax = Number(order.total_amount ?? 0);

  const submitFeedback = async () => {
    try {
      setSendingFeedback(true);
      await api.post('/feedback', {
        session_token: sessionToken,
        order_id: Number(orderId),
        rating,
        comment,
      });
      setComment('');
      setFeedbackSent(true);
      toast.success('Thanks for your feedback!');
    } catch (err) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const menuQuery = new URLSearchParams();
  if (table) menuQuery.set('table', table);
  if (sessionToken) menuQuery.set('token', sessionToken);
  const backToMenuPath = `/menu${menuQuery.toString() ? `?${menuQuery.toString()}` : ''}`;

  return (
    <>
      <BackButton size={36} />
      <div className="flex flex-col items-center gap-8 py-8">
        <div className="w-[300px] border border-black p-4 text-center font-mono bg-white">
          <h1 className="text-lg font-bold">{storeInfo.store}</h1>
          <p className="whitespace-pre-line">{storeInfo.address}</p>
          <p className="mt-2">Opening Hours {storeInfo.hours}</p>
          <p>UID Nr. : {storeInfo.uid}</p>

          <div className="mt-4 text-left">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>{item.name}</span>
                <span>&#8369;{item.price}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mb-1">
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between mb-1">
            <span>Discount</span>
            <span>-₱{discount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between mb-4">
            <span>Tax</span>
            <span>₱{tax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-2 font-bold border-t border-black">
            <span>TOTAL</span>
            <span>₱{totalWithTax.toFixed(2)}</span>
          </div>

          <p className="mt-2">
            Order Date: {new Date(order.created_at).toLocaleString()}
          </p>

          <div className="mt-4 text-xs leading-tight">
            <p>Nr. ########3941 0000</p>
            <p>VU - Nr . 15584121</p>
            <p>Genehmigungs - Nr 808191</p>
            <p>Terminal ID 68259456</p>
          </div>

          <div className="pt-2 mt-4 text-xs border-t border-black">
            <p>Don't have a PAYBACK card yet?</p>
            <p>You would have received</p>
            <p>3 points for this purchase</p>
          </div>
        </div>

        <div className="w-[320px] rounded-2xl border border-gray-100 p-5 bg-white shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">
            Rate your experience
          </h2>
          <p className="mt-1 mb-4 text-xs text-gray-500">
            Your feedback helps us improve your next order.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
              Rating
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>
                  {v} Star{v > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us how we can improve (optional)"
            className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
          />

          {feedbackSent && (
            <p className="mt-3 text-xs font-medium text-green-600">
              Feedback submitted successfully.
            </p>
          )}

          <Button
            onClick={submitFeedback}
            disabled={sendingFeedback || feedbackSent}
            className="w-full mt-3"
          >
            {sendingFeedback
              ? 'Submitting...'
              : feedbackSent
                ? 'Feedback Sent'
                : 'Submit Feedback'}
          </Button>
        </div>

        <Link to={backToMenuPath}>
          <Button variant="link">Back to Menu</Button>
        </Link>
      </div>
    </>
  );
}

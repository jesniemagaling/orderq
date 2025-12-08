import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Nav from '@/components/Nav';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-toastify';
import { MenuItem } from '@/types/menu';
import api from '@/lib/axios';
import { useSessionGuard } from '@/hooks/useSessionGuard';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'paypal',
    name: 'PayPal',
    description: '',
    icon: <img src="/icons/paypal.png" alt="Paypal" className="h-8 sm:h-10" />,
  },
  {
    id: 'gcash',
    name: 'GCASH',
    description: '',
    icon: <img src="/icons/visa.png" alt="Visa" className="h-12 sm:h-14" />,
  },
  {
    id: 'cash',
    name: 'Cash',
    description: '',
    icon: <img src="/icons/cash.png" alt="Cash" className="h-7 sm:h-8" />,
  },
];

declare global {
  interface Window {
    paypal: any;
  }
}

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    cart,
    totalPrice,
    table,
    sessionToken,
    clearCart,
    setTableWithSession,
  } = useCart();
  const [loadingSession, setLoadingSession] = useState(false);

  const qrTableNumber = Number(searchParams.get('table'));
  useSessionGuard();

  useEffect(() => {
    if (!qrTableNumber) {
      toast.error('Invalid table number.');
      navigate('/');
      return;
    }

    if (table === qrTableNumber && sessionToken) return;

    setLoadingSession(true);
    setTableWithSession(qrTableNumber)
      .catch((error: any) => {
        console.error('BACKEND ERROR:', error?.response?.data);
        toast.error(
          error?.response?.data?.message || 'Failed to create session.'
        );
        navigate('/');
      })
      .finally(() => setLoadingSession(false));
  }, [qrTableNumber, table, sessionToken]);

  const tax = totalPrice * 0.1;
  const total = totalPrice + tax;

  // PayPal integration
  useEffect(() => {
    if (selectedMethod !== 'paypal') return;
    if (!window.paypal) return;

    window.paypal
      .Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 40,
          tagline: false,
          borderRadius: 12,
        },

        onApprove: async (_data: any, actions: any) => {
          const details = await actions.order.capture();
          console.log('PayPal payment approved:', details);

          await api.post('/orders', {
            table_number: table,
            session_token: sessionToken,
            items: cart.map((i: MenuItem & { quantity: number }) => ({
              menu_id: i.id,
              quantity: i.quantity,
              price: i.price,
            })),
            payment_method: 'paypal',
            paypal_order_id: details.id,
            payment_reference: details.id,
          });

          toast.success('Payment completed via PayPal!');
          clearCart();
          navigate(`/orders?table=${table}&token=${sessionToken}`);
        },
        onError: (err: any) => {
          console.error('PayPal payment error:', err);
          toast.error('PayPal payment failed.');
        },
      })
      .render('#paypal-button-container');
  }, [selectedMethod, total, table, sessionToken, cart, clearCart, navigate]);

  const handleConfirm = async () => {
    if (!cart.length) {
      toast.error('Your cart is empty!');
      return;
    }
    if (!table || !sessionToken) {
      toast.error('Session expired. Please go back to menu.');
      navigate('/');
      return;
    }

    if (selectedMethod === 'paypal') return;

    try {
      const payment_status =
        selectedMethod === 'cash' || selectedMethod === 'gcash'
          ? 'unpaid'
          : 'paid';
      await api.post('/orders', {
        table_number: table,
        session_token: sessionToken,
        items: cart.map((i: MenuItem & { quantity: number }) => ({
          menu_id: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
        payment_method: selectedMethod,
        payment_status,
      });

      toast.success('Order created successfully!');
      clearCart();
      navigate(`/orders?table=${table}&token=${sessionToken}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Payment failed.');
      if (error?.response?.status === 400 || error?.response?.status === 401)
        navigate('/');
    }
  };

  if (loadingSession)
    return <div className="mt-20 text-center">Creating session...</div>;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Nav title="Payment Method" />

      <RadioGroup
        value={selectedMethod}
        onValueChange={setSelectedMethod}
        className="px-6 space-y-3 sm:px-4"
      >
        {paymentMethods.map((method) => {
          const rid = `pm-${method.id}`;
          return (
            <label
              key={method.id}
              htmlFor={rid}
              className="block cursor-pointer"
            >
              <Card
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg transition hover:bg-gray-50 border-none shadow-none',
                  selectedMethod === method.id && 'border border-primary-500'
                )}
              >
                <div className="flex">{method.icon}</div>
                <h3 className="text-gray-700">{method.name}</h3>
                <RadioGroupItem
                  id={rid}
                  value={method.id}
                  className="w-5 h-5"
                />
              </Card>
            </label>
          );
        })}
      </RadioGroup>

      <Separator />

      <div className="space-y-3 text-gray-500">
        <h2 className="pb-1 text-xl font-medium text-black border-b-2 max-w-fit border-primary-500">
          Order Details
        </h2>
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-bold">
            ₱
            {totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax 10%</span>
          <span className="font-bold">
            ₱{tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between font-bold text-yellow-500 sm:text-lg">
          <span className="font-medium text-black">Total</span>
          <span>
            ₱{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {selectedMethod !== 'paypal' && (
        <div className="grid gap-4 place-items-center">
          <Button
            onClick={handleConfirm}
            variant="default"
            className="py-6"
            disabled={loadingSession || !sessionToken || !table}
          >
            {loadingSession ? 'Creating session...' : 'Confirm'}
          </Button>
          <Button
            variant="link"
            onClick={() => navigate(`/cart?${searchParams.toString()}`)}
          >
            Back to Cart
          </Button>
        </div>
      )}
      {selectedMethod === 'paypal' && (
        <div className="grid gap-4 mt-4 place-items-center">
          <div id="paypal-button-container" className="w-full max-w-xs" />
          <Button
            variant="link"
            onClick={() => navigate(`/cart?${searchParams.toString()}`)}
          >
            Back to Cart
          </Button>
        </div>
      )}
    </div>
  );
}

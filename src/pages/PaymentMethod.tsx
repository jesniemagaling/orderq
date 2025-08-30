import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Nav from '@/components/Nav';
import { Link } from 'react-router-dom';

import { useCart } from '@/context/CartContext';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'gpay',
    name: 'Google Pay',
    description: '',
    icon: (
      <img
        src="/icons/google-pay.png"
        alt="Google Pay"
        className="h-12 sm:h-14"
      />
    ),
  },
  {
    id: 'applepay',
    name: 'Apple Pay',
    description: '',
    icon: (
      <img
        src="/icons/apple-pay.png"
        alt="Apple Pay"
        className="h-12 sm:h-14"
      />
    ),
  },
  {
    id: 'visa',
    name: 'Credit Card',
    description: '',
    icon: <img src="/icons/visa.png" alt="Visa" className="h-12 sm:h-14" />,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: '',
    icon: <img src="/icons/paypal.png" alt="Paypal" className="h-8 sm:h-10" />,
  },
  {
    id: 'cash',
    name: 'Cash',
    description: '',
    icon: <img src="/icons/cash.png" alt="Cash" className="h-7 sm:h-8" />,
  },
];

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState('applepay');

  const { cart, totalPrice } = useCart();

  const tax = totalPrice * 0.1;
  const total =
    cart.reduce((sum, item, quantity) => sum + item.price * item.quantity, 0) +
    tax;

  const handleConfirm = () => {};

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Nav title="Payment Method" />

      <RadioGroup
        value={selectedMethod}
        onValueChange={setSelectedMethod}
        className="px-4 space-y-3"
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
                  selectedMethod === method.id && ''
                )}
              >
                <div className="flex">{method.icon}</div>
                <h3 className="text-gray-700 ">{method.name}</h3>
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
          <span className="font-bold">₱{totalPrice}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax 10%</span>
          <span className="font-bold">₱{tax.toFixed(0)}</span>
        </div>
        <div className="flex justify-between font-bold text-yellow-500 sm:text-lg">
          <span className="font-medium text-black">Total</span>
          <span>₱{total.toFixed(0)}</span>
        </div>
      </div>

      <div className="grid gap-4 place-items-center">
        <Button onClick={handleConfirm} variant="default" className="py-6">
          Confirm
        </Button>
        <Link to="/cart">
          <Button variant="link">Back to Cart</Button>
        </Link>
      </div>
    </div>
  );
}

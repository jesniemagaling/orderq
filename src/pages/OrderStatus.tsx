import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';

const status = [
  { title: 'Order Confirmed', desc: 'Your order has been received' },
  { title: 'Order is being prepared', desc: 'Your food is getting prepared' },
  { title: 'Order Prepared', desc: 'Your order has been prepared' },
  { title: 'Delivery in process', desc: 'Hang on, your food is on the way' },
  { title: 'Delivery successfully done', desc: 'Enjoy your food!' },
];

export default function TrackOrder() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);

  return (
    <div className="space-y-12">
      <BackButton size={36} />
      <div className="flex flex-col items-center space-y-6 bg-white">
        <h1 className="heading-2">TRACK YOUR ORDER</h1>

        <div className="flex flex-col">
          {status.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              {/* Step Circle and Line */}
              <div className="flex flex-col items-center">
                {/* Outer Circle */}
                <div className="flex items-center justify-center w-8 h-8 border-2 border-gray-500 rounded-full">
                  {/* Inner Dot */}
                  {index <= currentStep && (
                    <div className="w-4 h-4 bg-gray-500 rounded-full" />
                  )}
                </div>

                {/* Vertical Line */}
                {index < status.length - 1 && (
                  <div
                    className={`w-[2px] h-10 ${
                      index < currentStep ? 'bg-gray-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>

              {/* Step Text */}
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
        <Link to="/receipt" className="flex justify-center w-full">
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

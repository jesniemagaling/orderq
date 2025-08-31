import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { useParams } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

export default function Receipt() {
  const storeInfo = {
    store: 'OrderQ',
    address: 'Malolos, Bulacan\n12345 Capitol View',
    hours: '7:00 - 21:00',
    uid: 'CE12345678',
  };

  const { orderId } = useParams();
  const { orders } = useCart();
  const order = orders.find((o) => o.id === orderId);

  if (!order) return <p className="mt-6 text-center">Receipt not found.</p>;

  const tax = order.total * 0.1;
  const totalWithTax = order.total + tax;

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
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.name}</span>
                <span>₱{item.price}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mb-4">
            <span>Tax (10%)</span>
            <span>₱{tax}</span>
          </div>

          <div className="flex justify-between pt-2 font-bold border-t border-black">
            <span>TOTAL</span>
            <span>₱{totalWithTax}</span>
          </div>

          <p className="mt-2">Order Date: {order.createdAt}</p>

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

        <Link to="/menu">
          <Button variant="link">Back to Menu</Button>
        </Link>
      </div>
    </>
  );
}

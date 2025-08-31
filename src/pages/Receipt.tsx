import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';

export default function Receipt() {
  const order = {
    store: 'OrderQ',
    address: 'Malolos, Bulacan\n12345 Capitol View',
    hours: '7:00 - 21:00',
    uid: 'CE12345678',
    items: [
      { name: 'BEEF BURGER', price: 79 },
      { name: 'CAPRESE SALAD', price: 49 },
    ],
    total: 128,
    time: '13:05',
  };

  return (
    <>
      <BackButton size={36} />
      <div className="flex flex-col items-center gap-8 py-8">
        <div className="w-[300px] border border-black p-4 text-center font-mono bg-white">
          <h1 className="text-lg font-bold">{order.store}</h1>
          <p className="whitespace-pre-line">{order.address}</p>
          <p className="mt-2">Opening Hours {order.hours}</p>
          <p>UID Nr. : {order.uid}</p>

          <div className="my-4 text-left">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.name}</span>
                <span>{item.price}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2 font-bold border-t border-black">
            <span>TOTAL</span>
            <span>{order.total} PHP</span>
          </div>

          <p className="mt-2">Estimated time {order.time}</p>

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

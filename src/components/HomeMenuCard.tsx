import { MenuItem } from '@/types/menu';
import { Link } from 'react-router-dom';

interface HomeMenuCardProps {
  item: MenuItem;
  onAdd?: (item: MenuItem) => void;
}

export default function HomeMenuCard({ item, onAdd }: HomeMenuCardProps) {
  const { id, name, price, available } = item;

  return (
    <div className="relative w-[120px] h-[162px] sm:w-[140px] sm:h-[200px] bg-white rounded-3xl shadow-lg overflow-hidden">
      <Link to={`/menu/${id}`}>
        <div className="relative bg-deep-red-gradient h-[76px] sm:h-[90px] flex justify-center items-end">
          <img
            src={item.homeImage}
            alt={item.name}
            className="w-[90px] sm:w-[110px] -mb-4 sm:-mb-6 z-10"
          />
        </div>

        <div className="flex flex-col items-start px-3 pb-4 text-left">
          <h3 className="mt-6 font-normal text-black sm:mt-10 heading-3">
            {name}
          </h3>
          <p className="mt-1 font-bold text-yellow-500 heading-3">₱ {price}</p>
        </div>
      </Link>
      {available ? (
        <button
          className="absolute bottom-0 right-0 flex items-center justify-center h-8 sm:h-10 sm:w-7.5 text-lg text-white transition bg-[#B71E2B] bg-[linear-gradient(90deg,rgba(183,30,43,0.9)_40%,rgba(196,45,58,1)_100%)] shadow-md w-7 rounded-tl-2xl hover:bg-red-500"
          onClick={() => onAdd?.(item)}
        >
          <svg
            className="mr-0.5"
            width="10"
            height="12"
            viewBox="0 0 10 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.16797 1.83936V9.86405"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 5.85156H8.33007"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <span className="absolute text-xs text-gray-400 bottom-3 right-3">
          Unavailable
        </span>
      )}
    </div>
  );
}

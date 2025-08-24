import { MenuItem } from '@/types/menu';

interface MenuListCardProps {
  item: MenuItem;
  onAdd?: (item: MenuItem) => void;
}

export default function MenuCard({ item, onAdd }: MenuListCardProps) {
  const { name, price, image, available } = item;

  return (
    <div className="flex items-center justify-between w-full p-3 bg-white rounded-2xl shadow-dual max-w-[310px]">
      <div className="flex-shrink-0 w-[58px] h-[48px] rounded-[10px] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="object-cover w-full h-full rounded-[10px]"
        />
      </div>

      <div className="flex flex-col flex-grow px-3">
        <h3 className="heading-3">{name}</h3>
        <p className="font-bold text-yellow-500 heading-3">₱ {price}</p>
      </div>

      {available ? (
        <button
          onClick={() => onAdd?.(item)}
          className="flex items-center justify-center"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM12 8.8H8.8V12H7.2V8.8H4V7.2H7.2V4H8.8V7.2H12V8.8Z"
              fill="#0E803C"
            />
          </svg>
        </button>
      ) : (
        <span className="text-xs text-gray-400">Unavailable</span>
      )}
    </div>
  );
}

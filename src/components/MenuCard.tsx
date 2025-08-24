import { MenuItem } from '@/types/menu';

interface MenuCardSimpleProps {
  item: MenuItem;
  onAdd?: (item: MenuItem) => void;
}

export default function MenuCardSimple({ item, onAdd }: MenuCardSimpleProps) {
  const { name, price, image, description, available } = item;

  return (
    <div className="flex flex-col p-4 transition border rounded-lg shadow hover:shadow-md">
      <img
        className="object-cover w-full h-48 rounded-md"
        src={image}
        alt={name}
      />
      <h3 className="mt-2 text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <p className="mt-2 font-bold">₱ {price}</p>
      {available && (
        <button
          className="px-4 py-2 mt-3 text-white transition bg-blue-600 rounded-md hover:bg-blue-500"
          onClick={() => onAdd && onAdd(item)}
        >
          Add to Cart
        </button>
      )}
      {!available && (
        <span className="mt-3 font-semibold text-red-600">Unavailable</span>
      )}
    </div>
  );
}

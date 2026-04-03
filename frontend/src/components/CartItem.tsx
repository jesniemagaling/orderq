import { Minus, Plus } from 'lucide-react';
import { CartItemProps } from '@/types/cart';
export default function CartItem({
  item,
  quantity,
  onIncrease,
  onDecrease,
  onSetQuantity,
  onRemove,
}: CartItemProps) {
  const clampQuantity = (value: number) => Math.max(1, Math.min(99, value));
  const handleInputChange = (rawValue: string) => {
    const numeric = rawValue.replace(/\D/g, '');
    if (!numeric) {
      onSetQuantity(item.id, 1);
      return;
    }
    onSetQuantity(item.id, clampQuantity(Number.parseInt(numeric, 10)));
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-5">
        <img
          src={item.image_url}
          alt={item.name}
          className="object-cover w-20 h-20 rounded-md"
        />
        <div className="grid gap-2">
          <h3 className="text-lg font-medium">{item.name}</h3>
          <p className="font-bold text-yellow-500">
            {' '}
            ₱{' '}
            {Number(item.price).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="text-xs text-gray-500 hover:text-primary-500"
        >
          Remove
        </button>
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-2 py-1 border border-gray-100 shadow-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDecrease(item.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-500 hover:bg-white transition"
          >
            <Minus size={18} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantity}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              handleInputChange(e.target.value);
            }}
            onBlur={(e) => {
              e.stopPropagation();
              handleInputChange(e.target.value);
            }}
            className="w-14 h-8 px-1 text-sm font-semibold text-center rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIncrease(item.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-500 hover:bg-white transition"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

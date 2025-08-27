import { Minus, Plus } from 'lucide-react';
import { CartItemProps } from '@/types/cart';
export default function CartItem({
  item,
  quantity,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <div className="flex items-center gap-5">
        <img
          src={item.image}
          alt={item.name}
          className="object-cover w-20 h-20 rounded-md"
        />
        <div className="grid gap-2">
          <h3 className="text-lg font-medium">{item.name}</h3>
          <p className="font-bold text-yellow-500">₱ {item.price}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-gray-500 hover:text-primary-500"
        >
          Remove
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDecrease(item.id)}
            className="text-lg text-primary-500 hover:opacity-70"
          >
            <Minus size={18} />
          </button>
          <span className="w-4 text-lg font-semibold text-center">
            {quantity}
          </span>
          <button
            onClick={() => onIncrease(item.id)}
            className="text-lg text-primary-500 hover:opacity-70"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

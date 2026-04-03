import { MenuItem } from './menu';

export interface CartItemProps {
  item: MenuItem;
  quantity: number;
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onSetQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

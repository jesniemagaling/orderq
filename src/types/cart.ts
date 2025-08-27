import { MenuItem } from './menu';

export interface CartItemProps {
  item: MenuItem;
  quantity: number;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
}

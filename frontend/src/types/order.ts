export interface OrderItem {
  id: number;
  name: string;
  price: number | string;
  quantity: number;
}

export interface Order {
  id: number;
  total_amount: number | string;
  created_at: string;
  items: OrderItem[];
}

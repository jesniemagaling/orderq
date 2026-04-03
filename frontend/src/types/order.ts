export interface OrderItem {
  id: number;
  name: string;
  price: number | string;
  quantity: number;
}

export interface Order {
  id: number;
  total_amount: number | string;
  subtotal_amount?: number | string;
  discount_amount?: number | string;
  tax_amount?: number | string;
  waiting_minutes?: number;
  estimated_ready_at?: string;
  created_at: string;
  items: OrderItem[];
}

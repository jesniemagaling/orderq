import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem } from '@/types/menu';
import { toast } from 'react-toastify';
import api from '@/lib/axios';

type CartItem = MenuItem & { quantity: number };

type Order = {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: string;
};

type CartContextType = {
  cart: CartItem[];
  orders: Order[];
  cartCount: number;
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (item: MenuItem) => void;
  increaseQuantity: (item: MenuItem) => void;
  decreaseQuantity: (item: MenuItem) => void;
  checkout: () => void;
  totalPrice: number;
  clearCart: () => void;
  table: number | null;
  setTableWithSession: (tableId: number) => Promise<void>;
  sessionToken: string | null;
  setSessionToken: (token: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const storedCart = localStorage.getItem('cart');
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const storedOrders = localStorage.getItem('orders');
    return storedOrders ? (JSON.parse(storedOrders) as Order[]) : [];
  });

  const [table, setTable] = useState<number | null>(() => {
    const t = localStorage.getItem('table');
    return t ? Number(t) : null;
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('sessionToken') || null;
  });
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    if (table !== null) localStorage.setItem('table', table.toString());
    else localStorage.removeItem('table');
  }, [table]);
  useEffect(() => {
    sessionToken
      ? localStorage.setItem('sessionToken', sessionToken)
      : localStorage.removeItem('sessionToken');
  }, [sessionToken]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem, quantity: number = 1) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists)
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart = (item: MenuItem) =>
    setCart((prev) => prev.filter((i) => i.id !== item.id));
  const increaseQuantity = (item: MenuItem) =>
    setCart((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  const decreaseQuantity = (item: MenuItem) =>
    setCart((prev) =>
      prev
        .map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  const clearCart = () => setCart([]);
  const checkout = () => {
    if (!cart.length) return;
    const newOrder: Order = {
      id: crypto.randomUUID(),
      items: cart,
      total: totalPrice,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [...prev, newOrder]);
    setCart([]);
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const setTableWithSession = async (tableId: number) => {
    try {
      const { data } = await api.post('/sessions', { table_number: tableId });
      console.log('SESSION RESPONSE:', data);
      setTable(data.table_number);
      setSessionToken(data.token);
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast.error('Failed to create/reuse session for table.');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        orders,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        totalPrice,
        cartCount,
        checkout,
        clearCart,
        table,
        setTableWithSession,
        sessionToken,
        setSessionToken,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

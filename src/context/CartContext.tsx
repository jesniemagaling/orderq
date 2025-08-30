import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem } from '@/types/menu';

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
  addToCart: (item: MenuItem) => void;
  removeFromCart: (item: MenuItem) => void;
  increaseQuantity: (item: MenuItem) => void;
  decreaseQuantity: (item: MenuItem) => void;
  checkout: () => void;
  totalPrice: number;
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

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart((prevCart) => prevCart.filter((i) => i.id !== item.id));
  };

  const increaseQuantity = (item: MenuItem) => {
    setCart((prevCart) =>
      prevCart.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  };

  const decreaseQuantity = (item: MenuItem) => {
    setCart((prevCart) =>
      prevCart
        .map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const checkout = () => {
    if (cart.length === 0) return;

    const newOrder: Order = {
      id: crypto.randomUUID(),
      items: cart,
      total: totalPrice,
      createdAt: new Date().toISOString(),
    };

    setOrders((prevOrders) => [...prevOrders, newOrder]);
    setCart([]);
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

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

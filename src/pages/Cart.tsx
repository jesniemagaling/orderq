import { useState, useMemo } from 'react';
import CartItem from '@/components/CartItem';
import { MenuItem } from '@/types/menu';
import Nav from '@/components/Nav';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CartEntry {
  item: MenuItem;
  quantity: number;
}

const initialCart: CartEntry[] = [
  {
    item: {
      id: 'burger-1',
      name: 'Beef Burger',
      category: 'Burgers',
      description: 'This is a sample item.',
      price: 129,
      image: '/images/beef-burger.png',
      homeImage: '/path/to/homeImage.jpg',
      available: true,
      isPopular: false,
      isRecommended: false,
    },
    quantity: 2,
  },
  {
    item: {
      id: 'chicken-1',
      name: 'Fried Chicken',
      category: 'Chicken',
      description: 'This is a sample item.',
      price: 129,
      image: '/images/fried-chicken.png',
      homeImage: '/path/to/homeImage.jpg',
      available: true,
      isPopular: false,
      isRecommended: false,
    },
    quantity: 1,
  },
];

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartEntry[]>(initialCart);

  const increaseQty = (id: string) => {
    setCartItems((prevItems) =>
      prevItems.map((cartItem) =>
        cartItem.item.id === id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      )
    );
  };

  const decreaseQty = (id: string) => {
    setCartItems((prevItems) =>
      prevItems
        .map((cartItem) =>
          cartItem.item.id === id && cartItem.quantity > 1
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((cartItem) => cartItem.item.id !== id)
    );
  };

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, c) => sum + c.item.price * c.quantity, 0),
    [cartItems]
  );

  return (
    <div className="max-w-xl mx-auto">
      <Nav title="Your Cart" />
      <div className="p-2 pt-2 bg-white shadow-md sm:p-4 rounded-xl">
        {cartItems.length === 0 ? (
          <p className="mt-6 text-center text-gray-500">Your cart is empty.</p>
        ) : (
          <>
            {cartItems.map(({ item, quantity }) => (
              <CartItem
                key={item.id}
                item={item}
                quantity={quantity}
                onIncrease={increaseQty}
                onDecrease={decreaseQty}
                onRemove={removeItem}
              />
            ))}

            <div className="flex items-center justify-between pt-4 m-6 border-t border-gray-200">
              <p className="text-lg font-medium">Total:</p>
              <p className="text-xl font-bold text-yellow-500">
                ₱ {totalPrice}
              </p>
            </div>
            <Link to="/Orders" className="flex justify-center w-full">
              <Button variant="default" className="py-6 ">
                Order Now
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

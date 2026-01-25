// context/CartContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem } from '../../types';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, instructions?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('restaurant_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('restaurant_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem, quantity = 1, instructions?: string) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.menuItem._id === item._id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.menuItem._id === item._id
            ? { 
                ...cartItem, 
                quantity: cartItem.quantity + quantity,
                specialInstructions: instructions || cartItem.specialInstructions
              }
            : cartItem
        );
      }
      return [...prev, { menuItem: item, quantity, specialInstructions: instructions }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.menuItem._id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.menuItem._id === itemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
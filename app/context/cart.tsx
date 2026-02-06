// context/CartContext.tsx - FINAL VERSION
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem, CartItem } from '@/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, instructions?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  migrateGuestCartToUser: (userId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Get current user storage key
  const getCartStorageKey = () => {
    if (typeof window === 'undefined') return 'epicurean_cart_guest';
    
    // Check if user is logged in
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='));
    
    if (token) {
      // Extract user ID from token (you might need to parse JWT)
      // For now, use a simplified approach
      try {
        // Try to get user ID from localStorage (set during login)
        const userId = localStorage.getItem('current_user_id');
        if (userId) {
          return `epicurean_cart_user_${userId}`;
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    }
    
    // Use guest session ID
    let guestId = localStorage.getItem('guest_session_id');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest_session_id', guestId);
    }
    
    return `epicurean_cart_guest_${guestId}`;
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    const cartKey = getCartStorageKey();
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        const validCart = parsedCart.filter((item: any) => 
          item.menuItem && 
          item.menuItem._id && 
          item.menuItem.name && 
          item.menuItem.price !== undefined
        );
        setCart(validCart);
      } catch (error) {
        console.error('Error loading cart:', error);
        localStorage.removeItem(cartKey);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      const cartKey = getCartStorageKey();
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } else {
      const cartKey = getCartStorageKey();
      localStorage.removeItem(cartKey);
    }
  }, [cart]);

  // Listen for auth changes (login/logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_user_id' || e.key?.startsWith('epicurean_cart')) {
        // User changed or cart data changed in another tab
        const cartKey = getCartStorageKey();
        const savedCart = localStorage.getItem(cartKey);
        
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            setCart(parsedCart);
          } catch (error) {
            setCart([]);
          }
        } else {
          setCart([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addToCart = (item: MenuItem, quantity = 1, instructions?: string) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.menuItem._id === item._id);
      let newCart;
      
      if (existing) {
        newCart = prev.map(cartItem =>
          cartItem.menuItem._id === item._id
            ? { 
                ...cartItem, 
                quantity: cartItem.quantity + quantity,
                specialInstructions: instructions || cartItem.specialInstructions
              }
            : cartItem
        );
      } else {
        newCart = [...prev, { 
          menuItem: item, 
          quantity, 
          specialInstructions: instructions 
        }];
      }
      
      return newCart;
    });
    setIsCartOpen(true);
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
    const cartKey = getCartStorageKey();
    localStorage.removeItem(cartKey);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.menuItem.price.toString());
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const migrateGuestCartToUser = (userId: string) => {
    // Get current guest cart
    const guestCartKey = getCartStorageKey();
    const guestCart = localStorage.getItem(guestCartKey);
    
    if (guestCart) {
      // Save to user cart
      const userCartKey = `epicurean_cart_user_${userId}`;
      localStorage.setItem(userCartKey, guestCart);
      
      // Clear guest cart
      localStorage.removeItem(guestCartKey);
      
      // Clear guest session ID
      localStorage.removeItem('guest_session_id');
      
      // Update current cart state
      setCart(JSON.parse(guestCart));
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
      isCartOpen,
      openCart,
      closeCart,
      migrateGuestCartToUser,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}
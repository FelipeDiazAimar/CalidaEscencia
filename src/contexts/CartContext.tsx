"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from '@/types/database';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    // Debug: Log what data CartContext receives
    console.log('CartContext addItem received:', newItem);
    console.log('Category in CartContext:', newItem.category);
    console.log('Subcategory in CartContext:', newItem.subcategory);
    console.log('Attribute in CartContext:', newItem.attribute);
    
    setItems(currentItems => {
      // Find existing item by product_id AND attribute_id (if present)
      const existingItemIndex = currentItems.findIndex(
        item => item.product_id === newItem.product_id && 
                item.attribute_id === newItem.attribute_id
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
        };
        return updatedItems;
      } else {
        // Add new item
        return [...currentItems, { ...newItem, id: `cart-${Date.now()}` }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => 
      currentItems.filter(item => item.product_id !== productId)
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount
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
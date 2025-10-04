"use client";

import { useEffect } from 'react';

export default function ClearCartOnMount() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('cart');
      window.dispatchEvent(new CustomEvent('cartCleared'));
    } catch (e) {
      // ignore
    }
  }, []);

  return null;
}

import { useEffect } from 'react';
import { financeApi } from '@/lib/api';

interface UseProductViewOptions {
  productId: string;
  enabled?: boolean;
}

export const useProductView = ({ productId, enabled = true }: UseProductViewOptions) => {
  useEffect(() => {
    if (!enabled || !productId) return;

    const trackView = async () => {
      try {
        // Generar un session ID único si no existe
        let sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('session_id', sessionId);
        }

        // Obtener información del navegador
        const userAgent = navigator.userAgent;
        
        // Registrar la vista
        await financeApi.productViews.create({
          product_id: productId,
          session_id: sessionId,
          user_agent: userAgent,
        });

        console.log(`📊 Vista registrada para producto: ${productId}`);
      } catch (error) {
        // Fallar silenciosamente para no afectar la experiencia del usuario
        console.warn('Error registrando vista de producto:', error);
      }
    };

    // Debounce para evitar múltiples llamadas
    const timeoutId = setTimeout(trackView, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [productId, enabled]);
};

export default useProductView;
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getMaxOrderQuantity } from '../utils/cartStock';

const CART_KEY = 'lm_market_cart';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  brand?: string;
  /** Existencia conocida; si es null/undefined no se limita por stock en UI. */
  totalStock?: number | null;
}

export interface CartItem {
  product: CartProduct;
  productId: string;
  quantity: number;
}

export interface AddToCartResult {
  /** Cantidad efectivamente añadida (incremento o línea nueva). */
  added: number;
  /** Cantidad solicitada antes de recortar por stock. */
  requested: number;
}

interface CartContextValue {
  addToCart: (product: CartProduct, quantity?: number) => AddToCartResult;
  cart: CartItem[];
  cartSubtotal: number;
  clearCart: () => void;
  removeFromCart: (productId: string) => void;
  totalItemCount: number;
  updateQuantity: (productId: string, quantity: number) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function clampQuantity(product: CartProduct, quantity: number): number {
  const max = getMaxOrderQuantity(product);
  if (max <= 0) return 0;
  return Math.min(Math.max(1, Math.trunc(quantity)), max);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [cart]
  );

  const totalItemCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  const addToCart = useCallback((product: CartProduct, quantity: number = 1) => {
    const requested = Math.max(1, Math.trunc(quantity));
    let result: AddToCartResult = { added: 0, requested };

    setCart((prev) => {
      const max = getMaxOrderQuantity(product);
      if (max <= 0) {
        result = { added: 0, requested };
        return prev;
      }

      const existing = prev.find((i) => i.productId === product.id);
      const mergedProduct: CartProduct = existing ? { ...existing.product, ...product } : product;

      const cap = getMaxOrderQuantity(mergedProduct);
      if (existing) {
        const nextQty = Math.min(existing.quantity + requested, cap);
        const added = nextQty - existing.quantity;
        result = { added, requested };
        if (added === 0) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, product: mergedProduct, quantity: nextQty } : i
        );
      }

      const firstQty = Math.min(requested, cap);
      result = { added: firstQty, requested };
      if (firstQty <= 0) return prev;
      return [
        ...prev,
        {
          product: mergedProduct,
          productId: product.id,
          quantity: firstQty,
        },
      ];
    });

    return result;
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;

      const next = Math.trunc(quantity);
      if (next <= 0) {
        return prev.filter((i) => i.productId !== productId);
      }

      const capped = clampQuantity(item.product, next);
      if (capped <= 0) {
        return prev.filter((i) => i.productId !== productId);
      }

      return prev.map((i) => (i.productId === productId ? { ...i, quantity: capped } : i));
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      addToCart,
      cart,
      cartSubtotal,
      clearCart,
      removeFromCart,
      totalItemCount,
      updateQuantity,
    }),
    [addToCart, cart, cartSubtotal, clearCart, removeFromCart, totalItemCount, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

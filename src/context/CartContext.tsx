import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { OrderLine } from '../types/order';

import { ensureCart, patchOrderLines } from '../api/orders';
import { getMaxOrderQuantity } from '../utils/cartStock';
import { useAuth } from './AuthContext';

const CART_KEY = 'lm_market_cart';

export interface CartProduct {
  code?: string;
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
  orderId: null | string;
  removeFromCart: (productId: string) => void;
  replaceFromOrderLines: (lines: OrderLine[]) => void;
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

function mapOrderLinesToCart(lines: OrderLine[]): CartItem[] {
  return lines.map((line) => ({
    product: {
      code: line.code,
      id: line.code,
      name: line.name,
      price: line.unitPrice,
    },
    productId: line.code,
    quantity: Math.max(1, Math.trunc(line.quantity)),
  }));
}

function mapCartToOrderPatch(cart: CartItem[]): { code: string; quantity: number }[] {
  return cart
    .map((item) => ({
      code: item.product.code?.trim() || item.productId.trim(),
      quantity: item.quantity,
    }))
    .filter((item) => item.code.length > 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [orderId, setOrderId] = useState<null | string>(null);
  const syncingFromServerRef = useRef(false);
  const syncingRequestRef = useRef(false);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const replaceFromOrderLines = useCallback((lines: OrderLine[]) => {
    syncingFromServerRef.current = true;
    setCart(mapOrderLinesToCart(lines));
    queueMicrotask(() => {
      syncingFromServerRef.current = false;
    });
  }, []);

  useEffect(() => {
    if (user?.type !== 'client') {
      queueMicrotask(() => setOrderId(null));
      return;
    }

    let cancelled = false;
    const hydrate = async () => {
      const result = await ensureCart();
      if (cancelled || !result.ok || !result.data?.order) return;
      setOrderId(result.data.order.id);
      replaceFromOrderLines(result.data.order.products);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [replaceFromOrderLines, user?.id, user?.type]);

  useEffect(() => {
    if (user?.type !== 'client') return;
    if (!orderId) return;
    if (syncingFromServerRef.current) return;
    if (syncingRequestRef.current) return;

    const lines = mapCartToOrderPatch(cart);
    syncingRequestRef.current = true;
    const sync = async () => {
      const result = await patchOrderLines(orderId, lines);
      syncingRequestRef.current = false;
      if (!result.ok) {
        const error = result.data as { code?: string };
        if (error?.code === 'ORDER_NOT_PENDING') {
          const cartResult = await ensureCart();
          if (cartResult.ok && cartResult.data?.order) {
            setOrderId(cartResult.data.order.id);
            replaceFromOrderLines(cartResult.data.order.products);
          }
        }
        return;
      }
      if (!result.data?.order) return;
      setOrderId(result.data.order.id);
      const next = mapOrderLinesToCart(result.data.order.products);
      if (JSON.stringify(next) !== JSON.stringify(cart)) {
        replaceFromOrderLines(result.data.order.products);
      }
    };
    void sync();
  }, [cart, orderId, replaceFromOrderLines, user?.type]);

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

      const productKey = product.code ?? product.id;
      const existing = prev.find((i) => i.productId === productKey);
      const mergedProduct: CartProduct = existing ? { ...existing.product, ...product } : product;

      const cap = getMaxOrderQuantity(mergedProduct);
      if (existing) {
        const nextQty = Math.min(existing.quantity + requested, cap);
        const added = nextQty - existing.quantity;
        result = { added, requested };
        if (added === 0) return prev;
        return prev.map((i) =>
          i.productId === productKey ? { ...i, product: mergedProduct, quantity: nextQty } : i
        );
      }

      const firstQty = Math.min(requested, cap);
      result = { added: firstQty, requested };
      if (firstQty <= 0) return prev;
      return [
        ...prev,
        {
          product: mergedProduct,
          productId: productKey,
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
      orderId,
      removeFromCart,
      replaceFromOrderLines,
      totalItemCount,
      updateQuantity,
    }),
    [
      addToCart,
      cart,
      cartSubtotal,
      clearCart,
      orderId,
      removeFromCart,
      replaceFromOrderLines,
      totalItemCount,
      updateQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

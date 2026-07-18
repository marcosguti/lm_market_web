import { message } from 'antd';
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

import type { InventoryChange, OrderEntity, OrderLine } from '../types/order';

import { ensureCart, patchOrderLines } from '../api/orders';
import { getStores } from '../api/stores';
import { getMaxOrderQuantity } from '../utils/cartStock';
import { useAuth } from './AuthContext';

const CART_KEY = 'lm_market_cart';
const STORE_KEY = 'lm_market_store';
const CART_SYNC_DEBOUNCE_MS = 500;

export interface CartProduct {
  code?: string;
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  brand?: string;
  /** Existencia conocida; si es null/undefined no se limita por stock en UI. */
  stockQuantity?: number | null;
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

export interface FlushCartSyncResult {
  changes?: InventoryChange[];
  error?: string;
  ok: boolean;
  order?: OrderEntity;
}

interface CartContextValue {
  addToCart: (product: CartProduct, quantity?: number) => AddToCartResult;
  cart: CartItem[];
  cartSubtotal: number;
  clearCart: (options?: { afterCheckout?: boolean }) => void;
  flushCartSync: () => Promise<FlushCartSyncResult>;
  orderId: null | string;
  removeFromCart: (productId: string) => void;
  replaceFromOrderLines: (lines: OrderLine[]) => void;
  setStoreId: (storeId: string) => void;
  storeId: string;
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

function loadStoreId(): string {
  try {
    return localStorage.getItem(STORE_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function saveStoreId(storeId: string) {
  if (storeId) localStorage.setItem(STORE_KEY, storeId);
  else localStorage.removeItem(STORE_KEY);
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
      imageUrl: line.imageUrl ?? undefined,
      name: line.name,
      price: line.unitPrice,
    },
    productId: line.code,
    quantity: Math.max(1, Math.trunc(line.quantity)),
  }));
}

function enrichCartFromOrderLines(cart: CartItem[], lines: OrderLine[]): CartItem[] {
  const metaByCode = new Map(
    lines.map((line) => [
      line.code,
      { imageUrl: line.imageUrl ?? undefined, name: line.name, price: line.unitPrice },
    ])
  );
  if (metaByCode.size === 0) return cart;

  let changed = false;
  const next = cart.map((item) => {
    const code = item.product.code?.trim() || item.productId.trim();
    const meta = metaByCode.get(code);
    if (!meta) return item;

    const imageUrl = item.product.imageUrl ?? meta.imageUrl;
    const name = meta.name || item.product.name;
    const price = meta.price ?? item.product.price;
    if (
      imageUrl === item.product.imageUrl &&
      name === item.product.name &&
      price === item.product.price
    ) {
      return item;
    }

    changed = true;
    return {
      ...item,
      product: {
        ...item.product,
        imageUrl,
        name,
        price,
      },
    };
  });

  return changed ? next : cart;
}

function mapCartToOrderPatch(cart: CartItem[]): { code: string; quantity: number }[] {
  return cart
    .map((item) => ({
      code: item.product.code?.trim() || item.productId.trim(),
      quantity: item.quantity,
    }))
    .filter((item) => item.code.length > 0);
}

function serializeCartLines(cart: CartItem[]): string {
  return JSON.stringify(mapCartToOrderPatch(cart));
}

function clearDirtyIfCartMatchesOrder(
  dirtyRef: { current: boolean },
  order: OrderEntity,
  cart: CartItem[]
): void {
  const serverLines = serializeCartLines(mapOrderLinesToCart(order.products));
  const localLines = serializeCartLines(cart);
  if (localLines === serverLines) {
    dirtyRef.current = false;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [orderId, setOrderId] = useState<null | string>(null);
  const [storeId, setStoreIdState] = useState<string>(() => loadStoreId());
  const syncingFromServerRef = useRef(false);
  const userCartDirtyRef = useRef(false);
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef<null | Promise<FlushCartSyncResult>>(null);
  const cartRef = useRef(cart);
  const orderIdRef = useRef(orderId);
  const storeIdRef = useRef(storeId);

  cartRef.current = cart;
  orderIdRef.current = orderId;
  storeIdRef.current = storeId;

  const setStoreId = useCallback((id: string) => {
    const trimmed = id.trim();
    setStoreIdState(trimmed);
    saveStoreId(trimmed);
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    if (user?.type !== 'client') return;

    let cancelled = false;
    void (async () => {
      const stores = await getStores();
      if (cancelled) return;
      const current = loadStoreId();
      if (current && stores.some((store) => store.id === current)) return;
      if (stores.length === 0) {
        setStoreId('');
        return;
      }
      setStoreId(stores[0].id);
    })();

    return () => {
      cancelled = true;
    };
  }, [setStoreId, user?.id, user?.type]);

  const replaceFromOrderLines = useCallback((lines: OrderLine[]) => {
    syncingFromServerRef.current = true;
    setCart(mapOrderLinesToCart(lines));
    queueMicrotask(() => {
      syncingFromServerRef.current = false;
    });
  }, []);

  const syncToServer = useCallback(
    async (showErrorToast: boolean): Promise<FlushCartSyncResult> => {
      if (user?.type !== 'client') {
        return { error: 'Debes iniciar sesión como cliente', ok: false };
      }

      const currentStoreId = storeIdRef.current;
      if (!currentStoreId) {
        return { error: 'Tienda no seleccionada', ok: false };
      }

      let currentOrderId = orderIdRef.current;
      if (!currentOrderId) {
        const cartResult = await ensureCart(currentStoreId);
        if (!cartResult.ok || !cartResult.data?.order) {
          const err =
            (cartResult.data as { error?: string })?.error ??
            'No se pudo obtener la orden pendiente';
          return { error: err, ok: false };
        }
        currentOrderId = cartResult.data.order.id;
        setOrderId(currentOrderId);
      }

      const lines = mapCartToOrderPatch(cartRef.current);
      const result = await patchOrderLines(currentOrderId, lines, currentStoreId);

      if (!result.ok) {
        const payload = result.data as { code?: string; error?: string };
        if (payload?.code === 'ORDER_NOT_PENDING') {
          const cartResult = await ensureCart(currentStoreId);
          if (cartResult.ok && cartResult.data?.order) {
            setOrderId(cartResult.data.order.id);
            replaceFromOrderLines(cartResult.data.order.products);
            return {
              changes: cartResult.data.changes,
              ok: true,
              order: cartResult.data.order,
            };
          }
        }

        const error = payload?.error ?? 'No se pudo guardar el carrito en el servidor';
        if (showErrorToast) {
          message.warning(error);
        }
        console.warn('[CartContext] sync failed', payload);
        return { error, ok: false };
      }

      if (!result.data?.order) {
        return { error: 'No se recibió la orden actualizada', ok: false };
      }

      setOrderId(result.data.order.id);
      const nextLines = serializeCartLines(mapOrderLinesToCart(result.data.order.products));
      const currentLines = serializeCartLines(cartRef.current);
      if (nextLines !== currentLines) {
        replaceFromOrderLines(result.data.order.products);
      } else {
        setCart((prev) => enrichCartFromOrderLines(prev, result.data.order.products));
      }

      return {
        changes: result.data.changes,
        ok: true,
        order: result.data.order,
      };
    },
    [replaceFromOrderLines, user?.type]
  );

  const executeSyncCycle = useCallback(
    async (showErrorToast: boolean): Promise<FlushCartSyncResult> => {
      while (syncInFlightRef.current) {
        await syncInFlightRef.current;
      }

      const promise = (async (): Promise<FlushCartSyncResult> => {
        let lastResult: FlushCartSyncResult = { error: 'Sin sincronizar', ok: false };

        while (!syncingFromServerRef.current) {
          const linesBefore = serializeCartLines(cartRef.current);
          lastResult = await syncToServer(showErrorToast);
          if (!lastResult.ok) return lastResult;

          const linesAfter = serializeCartLines(cartRef.current);
          if (linesAfter === linesBefore) return lastResult;
        }

        return lastResult;
      })();

      syncInFlightRef.current = promise;
      try {
        return await promise;
      } finally {
        if (syncInFlightRef.current === promise) {
          syncInFlightRef.current = null;
        }
      }
    },
    [syncToServer]
  );

  const flushCartSync = useCallback(async (): Promise<FlushCartSyncResult> => {
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = null;
    }

    const result = await executeSyncCycle(false);
    if (result.ok && result.order) {
      clearDirtyIfCartMatchesOrder(userCartDirtyRef, result.order, cartRef.current);
    }
    return result;
  }, [executeSyncCycle]);

  useEffect(() => {
    if (user?.type !== 'client') {
      queueMicrotask(() => setOrderId(null));
      return;
    }
    if (!storeId) return;

    let cancelled = false;
    const hydrate = async () => {
      const result = await ensureCart(storeId);
      if (cancelled || !result.ok || !result.data?.order) return;
      setOrderId(result.data.order.id);
      replaceFromOrderLines(result.data.order.products);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [replaceFromOrderLines, storeId, user?.id, user?.type]);

  useEffect(() => {
    if (user?.type !== 'client') return;
    if (!orderId) return;
    if (!storeId) return;
    if (syncingFromServerRef.current) return;
    if (!userCartDirtyRef.current) return;

    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    syncDebounceRef.current = setTimeout(() => {
      syncDebounceRef.current = null;
      if (!userCartDirtyRef.current) return;
      if (syncingFromServerRef.current) return;

      void executeSyncCycle(true).then((result) => {
        if (result.ok && result.order) {
          clearDirtyIfCartMatchesOrder(userCartDirtyRef, result.order, cartRef.current);
        }
      });
    }, CART_SYNC_DEBOUNCE_MS);

    return () => {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
        syncDebounceRef.current = null;
      }
    };
  }, [cart, executeSyncCycle, orderId, storeId, user?.type]);

  useEffect(() => {
    return () => {
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
    };
  }, []);

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

      const productKey = product.code?.trim() || product.id.trim();
      const normalizedProduct: CartProduct = {
        ...product,
        code: product.code?.trim() || productKey,
        id: productKey,
        imageUrl: product.imageUrl ?? undefined,
      };
      const existing = prev.find((i) => i.productId === productKey);
      const mergedProduct: CartProduct = existing
        ? {
            ...existing.product,
            ...normalizedProduct,
            id: productKey,
            imageUrl: normalizedProduct.imageUrl ?? existing.product.imageUrl,
          }
        : normalizedProduct;

      const cap = getMaxOrderQuantity(mergedProduct);
      if (existing) {
        const nextQty = Math.min(existing.quantity + requested, cap);
        const added = nextQty - existing.quantity;
        result = { added, requested };
        if (added === 0) return prev;
        userCartDirtyRef.current = true;
        return prev.map((i) =>
          i.productId === productKey ? { ...i, product: mergedProduct, quantity: nextQty } : i
        );
      }

      const firstQty = Math.min(requested, cap);
      result = { added: firstQty, requested };
      if (firstQty <= 0) return prev;
      userCartDirtyRef.current = true;
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
    setCart((prev) => {
      if (!prev.some((i) => i.productId === productId)) return prev;
      userCartDirtyRef.current = true;
      return prev.filter((i) => i.productId !== productId);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;

      const next = Math.trunc(quantity);
      if (next <= 0) {
        userCartDirtyRef.current = true;
        return prev.filter((i) => i.productId !== productId);
      }

      const capped = clampQuantity(item.product, next);
      if (capped <= 0) {
        userCartDirtyRef.current = true;
        return prev.filter((i) => i.productId !== productId);
      }

      if (capped === item.quantity) return prev;
      userCartDirtyRef.current = true;
      return prev.map((i) => (i.productId === productId ? { ...i, quantity: capped } : i));
    });
  }, []);

  const clearCart = useCallback((options?: { afterCheckout?: boolean }) => {
    setCart((prev) => {
      if (prev.length === 0) return prev;
      userCartDirtyRef.current = true;
      return [];
    });
    if (options?.afterCheckout) {
      setOrderId(null);
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      addToCart,
      cart,
      cartSubtotal,
      clearCart,
      flushCartSync,
      orderId,
      removeFromCart,
      replaceFromOrderLines,
      setStoreId,
      storeId,
      totalItemCount,
      updateQuantity,
    }),
    [
      addToCart,
      cart,
      cartSubtotal,
      clearCart,
      flushCartSync,
      orderId,
      removeFromCart,
      replaceFromOrderLines,
      setStoreId,
      storeId,
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

import { Modal } from 'antd';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getStores, type Store } from '../api/stores';
import { useCart } from './CartContext';

type HomeCatalogContextValue = {
  filtersReady: boolean;
  search: string;
  setSearch: (value: string) => void;
  stores: Store[];
  selectedStoreId: string;
  handleStoreChange: (storeId: string) => void;
  scrollToCatalog: () => void;
};

const HomeCatalogContext = createContext<HomeCatalogContextValue | null>(null);

export function HomeCatalogProvider({ children }: { children: ReactNode }) {
  const { cart, clearCart, setStoreId, storeId: cartStoreId } = useCart();
  const [search, setSearch] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [filtersReady, setFiltersReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const s = await getStores();
      if (cancelled) return;

      setStores(s);
      if (s.length === 0) {
        setSelectedStoreId('');
        setFiltersReady(true);
        return;
      }
      const persistedStoreId = cartStoreId;
      const initial =
        persistedStoreId && s.some((store) => store.id === persistedStoreId)
          ? persistedStoreId
          : s[0].id;
      setSelectedStoreId(initial);
      if (initial !== persistedStoreId) setStoreId(initial);
      setFiltersReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // Read cartStoreId once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only store bootstrap
  }, [setStoreId]);

  const scrollToCatalog = useCallback(() => {
    document
      .getElementById('products-catalog')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const applyStoreChange = useCallback(
    (storeId: string) => {
      setSelectedStoreId(storeId);
      setStoreId(storeId);
    },
    [setStoreId]
  );

  const handleStoreChange = useCallback(
    (storeId: string) => {
      if (storeId === selectedStoreId) return;
      if (cart.length > 0) {
        Modal.confirm({
          title: '¿Cambiar de tienda?',
          content: 'Esto vaciará tu carrito.',
          okText: 'Sí, cambiar',
          cancelText: 'Cancelar',
          onOk: () => {
            clearCart();
            applyStoreChange(storeId);
          },
        });
      } else {
        applyStoreChange(storeId);
      }
    },
    [applyStoreChange, cart.length, clearCart, selectedStoreId]
  );

  const value = useMemo(
    () => ({
      filtersReady,
      search,
      setSearch,
      stores,
      selectedStoreId,
      handleStoreChange,
      scrollToCatalog,
    }),
    [filtersReady, search, stores, selectedStoreId, handleStoreChange, scrollToCatalog]
  );

  return <HomeCatalogContext.Provider value={value}>{children}</HomeCatalogContext.Provider>;
}

export function useHomeCatalog() {
  return useContext(HomeCatalogContext);
}

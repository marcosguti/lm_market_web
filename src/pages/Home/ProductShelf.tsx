import { Button } from 'antd';
import { motion } from 'framer-motion';

import { formatBs } from '../../constants/pricing';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUsdRate } from '../../context/ExchangeRateContext';
import OfferCarousel from './OfferCarousel';
import ProductNetworkImage from './ProductShelfImage';

export type ShelfProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number | null;
  code: string;
};

type ProductShelfProps = {
  title: string;
  products: ShelfProduct[];
  onSeeAll?: () => void;
};

const ProductShelf = ({ title, products, onSeeAll }: ProductShelfProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const canShop = !user || user.type === 'client';
  const usdRate = useUsdRate();

  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-[16px] py-[16px] sm:px-[24px] lg:px-[32px]">
      <div className="mb-[12px] flex items-end justify-between gap-[12px]">
        <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">{title}</h2>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            Ver todo
          </button>
        ) : null}
      </div>
      <OfferCarousel arrowOnly>
        {products.map((p) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex w-[148px] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white sm:w-[168px]"
          >
            <div className="flex h-[120px] items-center justify-center bg-[#FCFCFC] p-[10px]">
              {p.imageUrl ? (
                <ProductNetworkImage alt={p.name} src={p.imageUrl} />
              ) : (
                <span className="text-xs text-gray-400">Sin imagen</span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-[10px]">
              {p.brand ? (
                <p className="mb-[4px] truncate text-[10px] uppercase tracking-wide text-gray-500">
                  {p.brand}
                </p>
              ) : null}
              <h3 className="mb-[8px] line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900">
                {p.name}
              </h3>
              <p className="mb-[8px] text-base font-bold tabular-nums text-primary">
                Bs {formatBs(p.price, usdRate)}
              </p>
              {canShop ? (
                <Button
                  block
                  size="small"
                  type="primary"
                  onClick={() => {
                    addToCart(
                      {
                        id: p.id,
                        brand: p.brand,
                        code: p.code,
                        imageUrl: p.imageUrl ?? undefined,
                        name: p.name,
                        price: p.price,
                        stockQuantity: p.stockQuantity,
                      },
                      1
                    );
                  }}
                >
                  Agregar
                </Button>
              ) : null}
            </div>
          </motion.article>
        ))}
      </OfferCarousel>
    </section>
  );
};

export default ProductShelf;

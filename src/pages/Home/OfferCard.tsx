import { motion } from 'framer-motion';
import { useState } from 'react';

type OfferCardProps = {
  imageUrl: string;
  onClick: () => void;
};

const OfferCard = ({ imageUrl, onClick }: OfferCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group relative w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-xl sm:w-[260px]"
    >
      <div className="absolute left-3 top-3 z-10 rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-white shadow-md">
        Oferta
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsFavorite((prev) => !prev);
        }}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
        aria-label="Favorito"
      >
        <span className={isFavorite ? 'text-red-500' : 'text-gray-400'}>
          {isFavorite ? '♥' : '♡'}
        </span>
      </button>

      <button type="button" onClick={onClick} className="block w-full">
        <div className="aspect-square w-full overflow-hidden bg-gray-50">
          <img
            src={imageUrl}
            alt="Oferta"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </button>

      <div className="p-3">
        <button
          type="button"
          onClick={onClick}
          className="w-full rounded-full border-2 border-primary py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Ver oferta
        </button>
      </div>
    </motion.article>
  );
};

export default OfferCard;

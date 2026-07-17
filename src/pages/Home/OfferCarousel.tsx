import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { type ReactNode, useRef } from 'react';

type OfferCarouselProps = {
  arrowOnly?: boolean;
  children: ReactNode;
};

const OfferCarousel = ({ arrowOnly = false, children }: OfferCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({
      behavior: 'smooth',
      left: direction === 'left' ? -280 : 280,
    });
  };

  const arrowButtonClass = arrowOnly
    ? 'absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-opacity hover:bg-gray-50'
    : 'absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-opacity hover:bg-gray-50 sm:flex';

  return (
    <div className="group/carousel relative">
      <button
        type="button"
        onClick={() => scroll('left')}
        className={`${arrowButtonClass} ${arrowOnly ? 'left-0' : '-left-3'}`}
        aria-label="Anterior"
      >
        <LeftOutlined style={{ color: '#97BD11' }} />
      </button>

      <div
        ref={scrollContainerRef}
        className={
          arrowOnly
            ? 'flex gap-4 overflow-x-hidden scroll-smooth px-10 py-2'
            : 'flex gap-4 overflow-x-auto scroll-smooth px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        className={`${arrowButtonClass} ${arrowOnly ? 'right-0' : '-right-3'}`}
        aria-label="Siguiente"
      >
        <RightOutlined style={{ color: '#97BD11' }} />
      </button>
    </div>
  );
};

export default OfferCarousel;

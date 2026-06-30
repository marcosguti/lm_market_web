import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useRef, type ReactNode } from 'react';

type OfferCarouselProps = {
  children: ReactNode;
};

const OfferCarousel = ({ children }: OfferCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({
      behavior: 'smooth',
      left: direction === 'left' ? -280 : 280,
    });
  };

  return (
    <div className="group/carousel relative">
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute -left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-opacity hover:bg-gray-50 sm:flex"
        aria-label="Anterior"
      >
        <LeftOutlined style={{ color: '#97BD11' }} />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute -right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-opacity hover:bg-gray-50 sm:flex"
        aria-label="Siguiente"
      >
        <RightOutlined style={{ color: '#97BD11' }} />
      </button>
    </div>
  );
};

export default OfferCarousel;

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import {
  BANNER_IMAGE_DEFAULT_ASPECT_RATIO,
  type ImageDimensions,
} from '../../utils/bannerImageValidation';

export type CarouselSlide = {
  imageUrl: string;
  alt?: string;
};

type CarouselProps = {
  slides: CarouselSlide[];
  loading?: boolean;
};

const Carousel = ({ slides, loading = false }: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dimensionsByUrl, setDimensionsByUrl] = useState<Record<string, ImageDimensions>>({});

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const currentSlide = slides[currentIndex];
  const currentDimensions = currentSlide ? dimensionsByUrl[currentSlide.imageUrl] : undefined;

  const currentAspectRatio = useMemo(() => {
    if (!currentDimensions) return BANNER_IMAGE_DEFAULT_ASPECT_RATIO;
    return `${currentDimensions.width} / ${currentDimensions.height}`;
  }, [currentDimensions]);

  const handleImageLoad = (imageUrl: string, img: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = img;
    if (naturalWidth <= 0 || naturalHeight <= 0) return;

    setDimensionsByUrl((prev) => {
      const existing = prev[imageUrl];
      if (existing?.width === naturalWidth && existing.height === naturalHeight) {
        return prev;
      }
      return {
        ...prev,
        [imageUrl]: { width: naturalWidth, height: naturalHeight },
      };
    });
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div
        className="relative w-full animate-pulse bg-gray-200"
        style={{ aspectRatio: BANNER_IMAGE_DEFAULT_ASPECT_RATIO }}
      />
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-100 transition-[aspect-ratio] duration-300 ease-in-out"
      style={{ aspectRatio: currentAspectRatio }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.imageUrl}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={currentSlide.imageUrl}
            alt={currentSlide.alt ?? `Banner ${currentIndex + 1}`}
            className="block h-full w-full object-cover object-center"
            onLoad={(event) => handleImageLoad(currentSlide.imageUrl, event.currentTarget)}
          />
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4">
          {slides.map((slide, index) => (
            <motion.button
              key={slide.imageUrl}
              onClick={() => goToSlide(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`h-1.5 rounded-full transition-all sm:h-2 ${
                index === currentIndex
                  ? 'w-6 bg-white sm:w-8'
                  : 'w-1.5 bg-white/50 hover:bg-white/75 sm:w-2'
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;

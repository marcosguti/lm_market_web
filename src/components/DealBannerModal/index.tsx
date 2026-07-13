import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

interface DealBannerModalProps {
  images: string[];
  loading?: boolean;
  onClose: () => void;
  onEmpty?: () => void;
}

const DealBannerModal = ({ images, loading = false, onClose, onEmpty }: DealBannerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!loading && images.length === 0) {
      onEmpty?.();
    }
  }, [images.length, loading, onEmpty]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (loading) return null;
  if (images.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative flex w-[min(calc(100%-2rem),calc(85vh*9/16))] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          className="absolute -top-12 right-0 z-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          icon={<CloseOutlined />}
          size="large"
          type="text"
          onClick={onClose}
        />

        <div className="relative w-full overflow-hidden rounded-lg shadow-2xl">
          <div className="relative aspect-[9/16] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <img
                  alt={`Oferta ${currentIndex + 1}`}
                  className="block h-full w-full object-cover object-center"
                  src={images[currentIndex]}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {images.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToSlide(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`h-2 rounded-full transition-all sm:h-3 ${
                    index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Ir a oferta ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DealBannerModal;

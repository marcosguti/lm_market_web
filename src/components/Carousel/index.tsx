import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const Carousel = () => {
  const images = ['/banner_carnes.jpg', '/banner_CARRO.jpg', '/banner_bodegon.jpg']

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [images.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative min-h-[180px] w-full overflow-hidden bg-gray-100 sm:min-h-[450px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 flex w-full items-center justify-center"
        >
          <img
            src={images[currentIndex]}
            alt={`Banner ${currentIndex + 1}`}
            className="h-full max-h-[180px] w-full object-contain object-center sm:h-full sm:max-h-none sm:object-cover"
            style={{ maxWidth: '100%', display: 'block' }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4">
        {images.map((_, index) => (
          <motion.button
            key={index}
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
    </div>
  )
}

export default Carousel


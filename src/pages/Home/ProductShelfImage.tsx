import { useState } from 'react';

type ProductShelfImageProps = {
  alt: string;
  src: string;
};

const ProductShelfImage = ({ alt, src }: ProductShelfImageProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      alt={alt}
      src={src}
      className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  );
};

export default ProductShelfImage;

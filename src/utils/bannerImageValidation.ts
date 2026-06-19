export const BANNER_IMAGE_MIN_WIDTH = 1200;
export const BANNER_IMAGE_MIN_HEIGHT = 500;
export const BANNER_IMAGE_MIN_RATIO = 1.7;
export const BANNER_IMAGE_MAX_RATIO = 3.0;
export const BANNER_IMAGE_DEFAULT_ASPECT_RATIO = `${BANNER_IMAGE_MIN_WIDTH} / ${BANNER_IMAGE_MIN_HEIGHT}`;

export interface ImageDimensions {
  width: number;
  height: number;
}

export const getImageDimensions = (file: File): Promise<ImageDimensions> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };

    img.src = url;
  });

export const validateBannerImage = async (file: File): Promise<ImageDimensions> => {
  const { width, height } = await getImageDimensions(file);

  if (width <= height) {
    throw new Error('La imagen debe ser horizontal (ancho mayor que alto)');
  }

  if (width < BANNER_IMAGE_MIN_WIDTH || height < BANNER_IMAGE_MIN_HEIGHT) {
    throw new Error(
      `La imagen debe medir al menos ${BANNER_IMAGE_MIN_WIDTH}x${BANNER_IMAGE_MIN_HEIGHT}px`
    );
  }

  const ratio = width / height;
  if (ratio < BANNER_IMAGE_MIN_RATIO || ratio > BANNER_IMAGE_MAX_RATIO) {
    throw new Error(
      `La imagen debe tener proporción horizontal entre ${BANNER_IMAGE_MIN_RATIO}:1 y ${BANNER_IMAGE_MAX_RATIO}:1`
    );
  }

  return { width, height };
};

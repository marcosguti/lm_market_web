export const DEAL_IMAGE_MIN_WIDTH = 720;
export const DEAL_IMAGE_MIN_HEIGHT = 1280;
export const DEAL_IMAGE_TARGET_RATIO = 9 / 16;
export const DEAL_IMAGE_RATIO_TOLERANCE = 0.03;

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

export const validateDealImage = async (file: File): Promise<ImageDimensions> => {
  const { width, height } = await getImageDimensions(file);

  if (width < DEAL_IMAGE_MIN_WIDTH || height < DEAL_IMAGE_MIN_HEIGHT) {
    throw new Error(
      `La imagen debe medir al menos ${DEAL_IMAGE_MIN_WIDTH}x${DEAL_IMAGE_MIN_HEIGHT}px`
    );
  }

  const ratio = width / height;
  if (Math.abs(ratio - DEAL_IMAGE_TARGET_RATIO) > DEAL_IMAGE_RATIO_TOLERANCE) {
    throw new Error('La imagen debe ser vertical con proporción 9:16');
  }

  return { width, height };
};

/**
 * Utility to compress and resize subscription logos/images for Android & Web compatibility.
 * Limits dimension to max 256x256 px and encodes to clean image/jpeg Blob & Data URI.
 */

export interface CompressedImageResult {
  blob: Blob;
  dataUri: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
}

export async function compressImageToMax512(
  file: File,
  maxDimension: number = 256,
  quality: number = 0.7
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para compresión.'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale if dimensions exceed maxDimension (256px)
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo inicializar el contexto del lienzo canvas.'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Always convert to JPEG with white background for minimal file size
        const mimeType = 'image/jpeg' as const;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        const dataUri = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Error al generar el Blob de la imagen comprimida.'));
            }
            resolve({
              blob,
              dataUri,
              width,
              height,
              mimeType,
            });
          },
          mimeType,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

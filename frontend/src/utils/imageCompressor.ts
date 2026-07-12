const QUALITIES = [0.85, 0.70, 0.55, 0.40];

export async function compressImage(
  file: File,
  maxSizeBytes = 1 * 1024 * 1024,
  maxDimension = 1920,
): Promise<File> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
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
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const baseName = file.name.replace(/\.[^.]+$/, '');

      const attempt = (qi: number) => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          if (blob.size <= maxSizeBytes || qi >= QUALITIES.length - 1) {
            resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
          } else {
            attempt(qi + 1);
          }
        }, 'image/jpeg', QUALITIES[qi]);
      };

      attempt(0);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

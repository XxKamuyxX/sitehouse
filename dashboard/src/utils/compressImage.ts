import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file before upload to optimize storage and improve load times.
 * 
 * @param imageFile - The original image file to compress
 * @returns A Promise that resolves to the compressed File object
 * 
 * @example
 * ```typescript
 * const originalFile = event.target.files[0];
 * const compressedFile = await compressFile(originalFile);
 * await uploadToFirebase(compressedFile, path);
 * ```
 */
export async function compressFile(imageFile: File): Promise<File> {
  try {
    // Compression options for optimal balance of quality and size
    const options = {
      maxSizeMB: 0.7, // Target files under 700KB
      maxWidthOrHeight: 1920, // Resize to Full HD (1920px) if larger
      useWebWorker: true, // Run compression in background to avoid UI freeze
      fileType: 'image/webp', // Convert to WebP for superior compression
    };

    const compressedFile = await imageCompression(imageFile, options);
    
    console.log(
      `Image compressed: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
    );
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    console.warn('Falling back to original file');
    // Return original file if compression fails to prevent upload failure
    return imageFile;
  }
}

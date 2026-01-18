/**
 * Loads an image using HTML Image Element (more robust for CORS)
 * @param url - The URL of the image to load
 * @returns Promise<HTMLImageElement | null> - The loaded image element, or null if loading fails
 */
const loadImage = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Try to request CORS permission
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback: If CORS fails, resolve null (don't crash app)
      console.warn("Could not load logo for PDF:", url);
      resolve(null);
    };
  });
};

/**
 * Converts an image URL to base64 string using Canvas method (more robust for CORS)
 * @param imageUrl - The URL of the image to convert
 * @returns Promise<string | null> - The base64 data URL of the image, or null if conversion fails
 */
export const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
  if (!imageUrl || !imageUrl.trim()) {
    return null;
  }

  try {
    // Load image using HTML Image Element
    const imgElement = await loadImage(imageUrl);
    if (!imgElement) {
      return null;
    }

    // Draw image to a temporary canvas to get Base64 data
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      console.warn("Could not get canvas context");
      return null;
    }

    ctx.drawImage(imgElement, 0, 0);
    const logoData = canvas.toDataURL("image/png");
    
    return logoData;
  } catch (error) {
    console.warn('Error converting image to base64:', error);
    // Fallback: don't crash, just return null
    return null;
  }
};

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export function useStorage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File, path: string): Promise<string> => {
    setUploading(true);
    setProgress(0);

    try {
      const storageRef = ref(storage, path);
      
      // Simulate progress (Firebase Storage doesn't provide real-time progress for uploadBytes)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      await uploadBytes(storageRef, file);
      clearInterval(progressInterval);
      setProgress(100);

      const downloadURL = await getDownloadURL(storageRef);
      setUploading(false);
      setProgress(0);
      
      return downloadURL;
    } catch (error) {
      setUploading(false);
      setProgress(0);
      throw error;
    }
  };

  return { uploadImage, uploading, progress };
}




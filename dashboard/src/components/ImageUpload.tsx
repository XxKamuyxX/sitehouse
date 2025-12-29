import { useState, useRef } from 'react';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  path: string;
  label?: string;
  multiple?: boolean;
}

export function ImageUpload({ onUploadComplete, path, label = 'Upload de Imagem', multiple = false }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading, progress } = useStorage();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fullPath = `${path}/${fileName}`;
      
      const url = await uploadImage(file, fullPath);
      onUploadComplete(url);
      setPreview(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem');
      setPreview(null);
    }
  };

  const handleTakePhoto = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-navy bg-navy-50'
            : 'border-slate-300 hover:border-navy hover:bg-slate-50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          multiple={multiple}
          className="hidden"
          capture="environment"
        />

        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 text-navy animate-spin mx-auto" />
            <p className="text-sm text-slate-600">Enviando... {progress}%</p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-navy h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm text-slate-600 mb-1">
                Arraste uma imagem aqui ou
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-800 transition-colors text-sm"
                >
                  Selecionar Arquivo
                </button>
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Tirar Foto
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">PNG, JPG, GIF até 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
}




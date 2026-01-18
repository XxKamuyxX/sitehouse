import { Card } from './ui/Card';
import { Camera, X } from 'lucide-react';

interface DiagnosisProps {
  beforePhotos: string[];
  afterPhotos: string[];
  notes: string;
  onBeforePhotosChange: (photos: string[]) => void;
  onAfterPhotosChange: (photos: string[]) => void;
  onNotesChange: (notes: string) => void;
}

export function Diagnosis({
  beforePhotos,
  afterPhotos,
  notes,
  onBeforePhotosChange,
  onAfterPhotosChange,
  onNotesChange,
}: DiagnosisProps) {
  const handlePhotoUpload = (type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === files.length) {
          if (type === 'before') {
            onBeforePhotosChange([...beforePhotos, ...newPhotos]);
          } else {
            onAfterPhotosChange([...afterPhotos, ...newPhotos]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      onBeforePhotosChange(beforePhotos.filter((_, i) => i !== index));
    } else {
      onAfterPhotosChange(afterPhotos.filter((_, i) => i !== index));
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-navy mb-4">Diagnóstico Técnico</h2>

      {/* Before Photos */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Fotos - Antes do Serviço
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-3">
          {beforePhotos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Antes ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-slate-200"
              />
              <button
                onClick={() => removePhoto('before', index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <label className="flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-32 cursor-pointer hover:border-navy transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoUpload('before', e)}
              className="hidden"
            />
            <div className="text-center">
              <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-xs text-slate-600">Adicionar</span>
            </div>
          </label>
        </div>
      </div>

      {/* After Photos */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Fotos - Depois do Serviço
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-3">
          {afterPhotos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Depois ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-slate-200"
              />
              <button
                onClick={() => removePhoto('after', index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <label className="flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg h-32 cursor-pointer hover:border-navy transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoUpload('after', e)}
              className="hidden"
            />
            <div className="text-center">
              <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-xs text-slate-600">Adicionar</span>
            </div>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Observações do Diagnóstico
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Descreva o diagnóstico técnico da cortina de vidro..."
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy resize-none"
        />
      </div>
    </Card>
  );
}


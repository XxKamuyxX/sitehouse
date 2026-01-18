import { useRef, useEffect, useState } from 'react';

interface SignatureCanvasProps {
  onSignatureChange?: (isEmpty: boolean) => void;
  onSignatureComplete?: (dataUrl: string) => void;
  className?: string;
}

export function SignatureCanvas({ onSignatureChange, onSignatureComplete, className = '' }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set drawing style
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    if (onSignatureChange) {
      onSignatureChange(false);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && onSignatureComplete) {
        const dataUrl = canvas.toDataURL('image/png');
        onSignatureComplete(dataUrl);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onSignatureChange) {
      onSignatureChange(true);
    }
    if (onSignatureComplete) {
      onSignatureComplete('');
    }
  };

  const getSignatureDataUrl = (): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  };

  // Expose method via ref
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).getSignatureDataUrl = getSignatureDataUrl;
    }
  }, []);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full border-2 border-slate-300 rounded-lg bg-white cursor-crosshair touch-none"
        style={{ height: '150px' }}
      />
      <button
        type="button"
        onClick={clearSignature}
        className="mt-2 text-sm text-slate-600 hover:text-slate-800 underline"
      >
        Limpar Assinatura
      </button>
    </div>
  );
}

// Export helper function to get signature from ref
export function getSignatureFromCanvas(canvas: HTMLCanvasElement | null): string {
  if (!canvas) return '';
  return canvas.toDataURL('image/png');
}

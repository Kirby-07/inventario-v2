import React, { useRef, useState } from 'react';
import { Camera, Upload, X, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  currentImage?: string;
  onImageChange: (base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageChange,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Redimensionar ligeramente si es muy grande para mantener rendimiento óptimo
        compressImage(result, (compressed) => {
          onImageChange(compressed);
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (base64Str: string, callback: (result: string) => void) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000;
      const MAX_HEIGHT = 1000;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        callback(base64Str);
      }
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Función para activar cámara
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onImageChange(dataUrl);
    }
    stopCamera();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
          Fotografía de Evidencia del Equipo
        </label>
        <span className="text-xs text-slate-400">Requerido para auditoría física</span>
      </div>

      {isCameraActive ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-black aspect-video flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-3 flex items-center gap-3 bg-black/60 backdrop-blur-xs px-4 py-2 rounded-full">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Tomar Foto
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-full transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : currentImage ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
          <img
            src={currentImage}
            alt="Fotografía del equipo"
            className="w-full h-56 object-contain bg-slate-900/5 p-2"
          />
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onImageChange('')}
              className="p-1.5 bg-rose-600 text-white rounded-lg shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
              title="Eliminar fotografía"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Fotografía adjunta y lista para auditoría
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
              >
                Cambiar archivo
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={startCamera}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
              >
                Tomar otra
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            isDragging
              ? 'border-slate-800 bg-slate-100'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">
            Arrastra la fotografía del equipo All-in-One aquí
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Formatos aceptados: JPG, PNG o WEBP (máximo 15MB)
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              Examinar Archivos
            </button>
            <button
              type="button"
              onClick={startCamera}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5" />
              Usar Cámara
            </button>
          </div>

          {cameraError && (
            <p className="mt-3 text-xs text-rose-600 font-medium">{cameraError}</p>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

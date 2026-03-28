import React, { useRef } from 'react';
import { Camera, UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (imageDataUrls: string[]) => void;
  onUseCamera: () => void;
  title?: string;
  description?: string;
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  onUseCamera,
  title = "Start Your Analysis",
  description = "Upload one or more photos to check your medicine."
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const dataUrlPromises = Array.from(files).map(fileToDataUrl);
        const dataUrls = await Promise.all(dataUrlPromises);
        onImageSelect(dataUrls);
      } catch (error) {
        console.error("Error converting files to data URLs", error);
        alert("Could not load one or more images. Please try again.");
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-lg text-center animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">{title}</h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">{description}</p>
      
      <div className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          multiple
        />
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 font-semibold rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all"
        >
          <UploadCloud className="w-6 h-6" />
          <span>Upload from Device</span>
        </button>
        
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400">OR</span>
          <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
        </div>

        <button
          onClick={onUseCamera}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
        >
          <Camera className="w-6 h-6" />
          <span>Use Camera</span>
        </button>
      </div>
    </div>
  );
};

'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUpload: (file: File, preview: string) => void;
  image?: string;
}

export function ImageUpload({ onUpload, image }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size <= 10 * 1024 * 1024) { // 10MB
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          onUpload(file, preview);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('图片大小不能超过 10MB');
      }
    }
  }, [onUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onUpload(file, preview);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card
      className={`relative border-2 border-dashed transition-all cursor-pointer p-12
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
      `}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      {image ? (
        <div className="space-y-4">
          <img
            src={image}
            alt="上传的图片"
            className="w-full max-w-md mx-auto rounded-lg"
          />
          <p className="text-center text-sm text-muted-foreground">点击重新上传</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-lg font-medium">拖拽图片到此处</p>
            <p className="text-sm text-muted-foreground">或点击上传</p>
            <p className="text-xs text-muted-foreground mt-2">
              支持 JPG、PNG、WEBP,最大 10MB
            </p>
          </div>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </Card>
  );
}

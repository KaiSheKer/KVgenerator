'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUpload: (file: File, preview: string) => void;
  image?: string;
}

export function ImageUpload({ onUpload, image }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('仅支持 JPG、PNG、WEBP 格式');
      return false;
    }

    if (file.size > MAX_SIZE) {
      toast.error('图片大小不能超过 10MB');
      return false;
    }

    return true;
  };

  const readAndUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      onUpload(file, preview);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      readAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      readAndUpload(file);
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
          <Image
            src={image}
            alt="上传的图片"
            width={800}
            height={800}
            unoptimized
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
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </Card>
  );
}

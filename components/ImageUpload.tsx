'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploadProps {
  onUpload: (file: File, preview: string) => void;
  image?: string;
}

export function ImageUpload({ onUpload, image }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('仅支持 JPG、PNG、WEBP 格式');
      return false;
    }

    if (file.size > MAX_SIZE) {
      toast.error('图片大小不能超过 10MB');
      return false;
    }

    return true;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        onUpload(file, preview);
      };
      reader.readAsDataURL(file);
    }
  }, [validateFile, onUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        onUpload(file, preview);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card
      className={cn(
        "relative w-full aspect-video bg-white rounded-3xl shadow-card",
        "border-4 border-dashed border-primary/30",
        "flex items-center justify-center cursor-pointer",
        "transition-all duration-300",
        "hover:shadow-float hover:-translate-y-1 hover:border-primary",
        isDragging && "border-primary bg-primary/5"
      )}
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
            className="w-full max-w-md mx-auto rounded-2xl"
          />
          <p className="text-center text-sm text-muted-foreground">点击重新上传</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl font-semibold text-foreground">拖拽产品图片到此处</p>
            <p className="text-muted-foreground">或点击上传</p>
            <p className="text-sm text-muted-foreground">
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

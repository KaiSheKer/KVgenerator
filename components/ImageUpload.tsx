'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageUploadProps {
  onUpload: (file: File, preview: string) => void;
  image?: string;
  className?: string;
}

export function ImageUpload({ onUpload, image, className }: ImageUploadProps) {
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
        "studio-panel relative w-full aspect-[4/3] cursor-pointer overflow-hidden p-4",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(7,10,30,0.65)]",
        isDragging && "neon-ring border-primary/60",
        className
      )}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <div className="pointer-events-none absolute inset-4 rounded-2xl border border-dashed border-primary/35" />
      {image ? (
        <div className="relative z-10 space-y-4">
          <Image
            src={image}
            alt="上传的图片"
            width={800}
            height={800}
            unoptimized
            className="mx-auto w-full max-w-md rounded-2xl border border-border/70 object-cover shadow-[0_12px_28px_rgba(2,6,20,0.65)]"
          />
          <p className="text-center text-sm text-muted-foreground">点击重新上传</p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border/80 bg-secondary/60 shadow-[0_10px_24px_rgba(10,18,48,0.6)]">
            <Upload className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl font-semibold tracking-wide text-foreground">上传产品图片</p>
            <p className="text-muted-foreground">拖拽到此处或点击上传</p>
            <p className="text-sm text-muted-foreground">
              支持 JPG、PNG、WEBP,最大 10MB
            </p>
          </div>
          <Button size="sm" className="pointer-events-none px-8">
            Upload
          </Button>
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

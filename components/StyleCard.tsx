'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StyleCardProps {
  name: string;
  nameEn: string;
  description: string;
  selected: boolean;
  recommended?: boolean;
  onClick: () => void;
}

export function StyleCard({ name, nameEn, description, selected, recommended, onClick }: StyleCardProps) {
  return (
    <Card
      className={cn(
        "relative p-6 cursor-pointer transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1",
        selected && "ring-4 ring-primary ring-offset-4 scale-105"
      )}
      onClick={onClick}
    >
      {recommended && (
        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-primary to-accent text-white text-xs">
          AI 推荐
        </Badge>
      )}
      <div className="space-y-2">
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{nameEn}</p>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </div>
    </Card>
  );
}

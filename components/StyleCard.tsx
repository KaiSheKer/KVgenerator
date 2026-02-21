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
        "relative cursor-pointer rounded-2xl border-border/70 bg-secondary/35 p-5 transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_16px_28px_rgba(8,13,34,0.65)]",
        selected && "neon-ring scale-[1.03] border-primary/70"
      )}
      onClick={onClick}
    >
      {recommended && (
        <Badge className="absolute right-3 top-3 border-none bg-gradient-to-r from-primary to-accent text-white text-xs">
          AI 推荐
        </Badge>
      )}
      <div className="space-y-2">
        <h3 className="font-semibold tracking-wide">{name}</h3>
        {nameEn && <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{nameEn}</p>}
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}

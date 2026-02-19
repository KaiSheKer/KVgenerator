'use client';

import { Card } from '@/components/ui/card';

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
      className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={onClick}
    >
      {recommended && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
          AI 推荐
        </div>
      )}
      <div className="space-y-2">
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{nameEn}</p>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </div>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StyleCard } from '@/components/StyleCard';
import type { PosterAspectRatio } from '@/contexts/AppContext';

const VISUAL_STYLES = [
  { id: 'magazine', name: '杂志编辑', nameEn: 'Magazine Editorial', description: '高级、专业、大片感、粗衬线标题、极简留白' },
  { id: 'watercolor', name: '水彩艺术', nameEn: 'Watercolor Art', description: '温暖、柔和、晕染效果、手绘质感' },
  { id: 'tech', name: '科技未来', nameEn: 'Tech Future', description: '冷色调、几何图形、数据可视化、蓝光效果' },
  { id: 'vintage', name: '复古胶片', nameEn: 'Vintage Film', description: '颗粒质感、暖色调、怀旧氛围、宝丽来边框' },
  { id: 'minimal', name: '极简北欧', nameEn: 'Minimal Nordic', description: '性冷淡、大留白、几何线条、黑白灰' },
  { id: 'cyber', name: '霓虹赛博', nameEn: 'Neon Cyberpunk', description: '荧光色、描边发光、未来都市、暗色背景' },
  { id: 'organic', name: '自然有机', nameEn: 'Natural Organic', description: '植物元素、大地色系、手工质感、环保理念' },
];

const TYPOGRAPHY_STYLES = [
  { id: 'glassmorphism', name: '玻璃拟态', nameEn: 'Glassmorphism', description: '半透明背景 + 柔和圆角(现代风)' },
  { id: '3d', name: '3D浮雕', nameEn: '3D Embossed', description: '金属质感 + 光影效果(奢华风)' },
  { id: 'handwritten', name: '手写体', nameEn: 'Handwritten', description: '水彩笔触 + 不规则布局(艺术风)' },
  { id: 'serif', name: '粗衬线', nameEn: 'Bold Serif', description: '细线装饰 + 网格对齐(杂志风)' },
  { id: 'sans-serif', name: '无衬线粗体', nameEn: 'Bold Sans-serif', description: '霓虹描边 + 发光效果(赛博风)' },
  { id: 'thin', name: '极细线条', nameEn: 'Thin Sans-serif', description: '大量留白 + 精确对齐(极简风)' },
];

const TEXT_LAYOUTS = [
  { id: 'stacked', name: '中英堆叠', description: '中文在上,英文在下,垂直堆叠' },
  { id: 'parallel', name: '中英并列', description: '中英文横向并列,用竖线分隔' },
  { id: 'separated', name: '中英分离', description: '中英文分别放置在不同位置' },
];

const ASPECT_RATIOS: PosterAspectRatio[] = [
  '9:16',
  '3:4',
  '2:3',
  '1:1',
  '4:3',
  '3:2',
  '16:9',
  '21:9',
];

export default function StylePage() {
  const router = useRouter();
  const { editedProductInfo, selectedStyle, setSelectedStyle } = useAppContext();
  const [visualStyle, setVisualStyle] = useState(selectedStyle?.visual || 'magazine');
  const [typographyStyle, setTypographyStyle] = useState(selectedStyle?.typography || 'glassmorphism');
  const [textLayout, setTextLayout] = useState<'stacked' | 'parallel' | 'separated'>(
    selectedStyle?.textLayout || 'stacked'
  );
  const [aspectRatio, setAspectRatio] = useState<PosterAspectRatio>(
    selectedStyle?.aspectRatio || '9:16'
  );

  useEffect(() => {
    if (!editedProductInfo) {
      router.push('/');
    }
  }, [editedProductInfo, router]);

  if (!editedProductInfo) {
    return null;
  }

  const handleNext = () => {
    setSelectedStyle({
      visual: visualStyle,
      typography: typographyStyle,
      textLayout,
      aspectRatio,
    });
    router.push('/prompts');
  };

  const recommendedStyle = editedProductInfo.recommendedStyle || 'magazine';
  const recommendedTypography = editedProductInfo.recommendedTypography || 'glassmorphism';

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Style Config</p>
          <h2 className="text-2xl font-semibold">选择视觉风格</h2>
          <p className="text-sm text-muted-foreground">AI 推荐: {VISUAL_STYLES.find(s => s.id === recommendedStyle)?.name}</p>
        </div>
        <div className="hidden rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground md:block">
          Step 3 / 6
        </div>
      </div>

      <Card className="studio-panel p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide">视觉风格</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {VISUAL_STYLES.map((style) => (
            <StyleCard
              key={style.id}
              {...style}
              selected={visualStyle === style.id}
              recommended={style.id === recommendedStyle}
              onClick={() => setVisualStyle(style.id)}
            />
          ))}
        </div>
      </Card>

      <Card className="studio-panel p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide">文字排版</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {TYPOGRAPHY_STYLES.map((style) => (
            <StyleCard
              key={style.id}
              {...style}
              selected={typographyStyle === style.id}
              recommended={style.id === recommendedTypography}
              onClick={() => setTypographyStyle(style.id)}
            />
          ))}
        </div>
      </Card>

      <Card className="studio-panel p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide">中英文排版格式</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TEXT_LAYOUTS.map((layout) => (
            <StyleCard
              key={layout.id}
              name={layout.name}
              nameEn=""
              description={layout.description}
              selected={textLayout === layout.id}
              onClick={() => setTextLayout(layout.id as 'stacked' | 'parallel' | 'separated')}
            />
          ))}
        </div>
      </Card>

      <Card className="studio-panel p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide">海报尺寸比例</h3>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio}
              className={
                aspectRatio === ratio
                  ? "rounded-xl border border-primary/80 bg-gradient-to-r from-primary to-accent px-3 py-2 text-sm font-medium text-white"
                  : "rounded-xl border border-border/70 bg-secondary/45 px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }
              onClick={() => setAspectRatio(ratio)}
            >
              {ratio}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          ← 上一步
        </Button>
        <Button size="lg" onClick={handleNext}>
          生成提示词 →
        </Button>
      </div>
    </div>
  );
}

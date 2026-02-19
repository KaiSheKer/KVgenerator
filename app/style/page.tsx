'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { StyleCard } from '@/components/StyleCard';

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

export default function StylePage() {
  const router = useRouter();
  const { editedProductInfo, selectedStyle, setSelectedStyle } = useAppContext();
  const [visualStyle, setVisualStyle] = useState(selectedStyle?.visual || 'magazine');
  const [typographyStyle, setTypographyStyle] = useState(selectedStyle?.typography || 'glassmorphism');
  const [textLayout, setTextLayout] = useState<'stacked' | 'parallel' | 'separated'>(
    selectedStyle?.textLayout || 'stacked'
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
    });
    router.push('/prompts');
  };

  const recommendedStyle = editedProductInfo.recommendedStyle || 'magazine';
  const recommendedTypography = editedProductInfo.recommendedTypography || 'glassmorphism';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">选择视觉风格</h2>
        <p className="text-muted-foreground">
          根据您的产品特点,AI 推荐使用 {VISUAL_STYLES.find(s => s.id === recommendedStyle)?.name}
        </p>
      </div>

      {/* 视觉风格 */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-semibold">视觉风格</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

      {/* 文字排版 */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-semibold">文字排版</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      {/* 中英文排版格式 */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-semibold">中英文排版格式</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

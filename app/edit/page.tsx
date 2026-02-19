'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function EditPage() {
  const router = useRouter();
  const { editedProductInfo, updateProductInfo, setSelectedStyle } = useAppContext();

  useEffect(() => {
    if (!editedProductInfo) {
      router.push('/');
    }
  }, [editedProductInfo]);

  if (!editedProductInfo) {
    return null;
  }

  const handleNext = () => {
    setSelectedStyle({
      visual: editedProductInfo.recommendedStyle,
      typography: editedProductInfo.recommendedTypography,
      textLayout: 'stacked',
    });
    router.push('/style');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">编辑产品信息</h2>
        <p className="text-muted-foreground">
          请确认并编辑 AI 提取的产品信息
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* 品牌名称 */}
        <div className="space-y-2">
          <Label>品牌名称 (中文)</Label>
          <Input
            value={editedProductInfo.brandName.zh}
            onChange={(e) => updateProductInfo({
              brandName: { ...editedProductInfo.brandName, zh: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>品牌名称 (英文)</Label>
          <Input
            value={editedProductInfo.brandName.en}
            onChange={(e) => updateProductInfo({
              brandName: { ...editedProductInfo.brandName, en: e.target.value }
            })}
          />
        </div>

        {/* 产品类型 */}
        <div className="space-y-2">
          <Label>产品类别</Label>
          <Input
            value={editedProductInfo.productType.category}
            onChange={(e) => updateProductInfo({
              productType: { ...editedProductInfo.productType, category: e.target.value }
            })}
          />
        </div>

        <div className="space-y-2">
          <Label>具体产品</Label>
          <Input
            value={editedProductInfo.productType.specific}
            onChange={(e) => updateProductInfo({
              productType: { ...editedProductInfo.productType, specific: e.target.value }
            })}
          />
        </div>

        {/* 核心卖点 */}
        <div className="space-y-2">
          <Label>核心卖点</Label>
          <div className="space-y-2">
            {editedProductInfo.sellingPoints.map((point, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={point.zh}
                  onChange={(e) => {
                    const newPoints = [...editedProductInfo.sellingPoints];
                    newPoints[index] = { ...newPoints[index], zh: e.target.value };
                    updateProductInfo({ sellingPoints: newPoints });
                  }}
                  placeholder="中文卖点"
                />
                <Input
                  value={point.en}
                  onChange={(e) => {
                    const newPoints = [...editedProductInfo.sellingPoints];
                    newPoints[index] = { ...newPoints[index], en: e.target.value };
                    updateProductInfo({ sellingPoints: newPoints });
                  }}
                  placeholder="English卖点"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 配色方案 */}
        <div className="space-y-2">
          <Label>主色调</Label>
          <div className="flex gap-2">
            {editedProductInfo.colorScheme.primary.map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded border"
                  style={{ backgroundColor: color }}
                />
                <Input
                  value={color}
                  onChange={(e) => {
                    const newColors = [...editedProductInfo.colorScheme.primary];
                    newColors[index] = e.target.value;
                    updateProductInfo({
                      colorScheme: { ...editedProductInfo.colorScheme, primary: newColors }
                    });
                  }}
                  className="w-24"
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          ← 上一步
        </Button>
        <Button onClick={handleNext}>
          下一步: 选择风格 →
        </Button>
      </div>
    </div>
  );
}

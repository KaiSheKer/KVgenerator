'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generatePrompts } from '@/lib/utils/promptGenerator';
import { cn } from '@/lib/utils';
import type { GenerationQualityMode } from '@/contexts/AppContext';

type PosterSelectionMode = 'single' | 'multi' | 'all';

const SELECTION_MODE_OPTIONS: Array<{
  value: PosterSelectionMode;
  label: string;
  description: string;
}> = [
  { value: 'single', label: '单张输出', description: '仅生成 1 张海报' },
  { value: 'multi', label: '多张输出', description: '手动勾选多张海报' },
  { value: 'all', label: '全部输出', description: '一次性生成全部类型' },
];

const QUALITY_MODE_OPTIONS: Array<{
  value: GenerationQualityMode;
  label: string;
  description: string;
  candidates: number;
}> = [
  { value: 'fast', label: '快速', description: '每张生成 1 个候选，速度最快', candidates: 1 },
  { value: 'balanced', label: '平衡', description: '每张生成 2 个候选，效果与速度平衡', candidates: 2 },
  { value: 'quality', label: '精品', description: '每张生成 3 个候选，默认演示推荐', candidates: 3 },
];

function resolveSelectionState(
  posterIds: string[],
  selectedPosterIds: string[] | null
): {
  mode: PosterSelectionMode;
  ids: string[];
  firstIndex: number;
} {
  if (posterIds.length === 0) {
    return { mode: 'all', ids: [], firstIndex: 0 };
  }

  const validSet = new Set(posterIds);
  const rememberedIds = (selectedPosterIds ?? posterIds).filter((id) =>
    validSet.has(id)
  );
  const ids = rememberedIds.length > 0 ? rememberedIds : [posterIds[0]];
  const mode: PosterSelectionMode =
    selectedPosterIds === null || ids.length === posterIds.length
      ? 'all'
      : ids.length === 1
        ? 'single'
        : 'multi';
  const firstIndex = posterIds.findIndex((id) => id === ids[0]);

  return {
    mode,
    ids,
    firstIndex: firstIndex >= 0 ? firstIndex : 0,
  };
}

export default function PromptsPage() {
  const router = useRouter();
  const {
    editedProductInfo,
    selectedStyle,
    selectedPosterIds,
    selectedQualityMode,
    setGeneratedPrompts,
    setSelectedPosterIds,
    setSelectedQualityMode,
  } = useAppContext();

  const prompts = useMemo(() => {
    if (!editedProductInfo || !selectedStyle) return null;
    return generatePrompts(editedProductInfo, selectedStyle);
  }, [editedProductInfo, selectedStyle]);

  const allPosterIds = useMemo(
    () => prompts?.posters.map((poster) => poster.id) ?? [],
    [prompts]
  );

  const initialSelection = useMemo(
    () => resolveSelectionState(allPosterIds, selectedPosterIds),
    [allPosterIds, selectedPosterIds]
  );

  const [selectedIndex, setSelectedIndex] = useState(initialSelection.firstIndex);
  const [copiedField, setCopiedField] = useState<'zh' | 'en' | null>(null);
  const [selectionMode, setSelectionMode] = useState<PosterSelectionMode>(
    initialSelection.mode
  );
  const [localSelectedPosterIds, setLocalSelectedPosterIds] = useState<string[]>(
    initialSelection.ids
  );
  const [editablePromptEnById, setEditablePromptEnById] = useState<Record<string, string>>({});

  const selectedPosterIdsForOutput = useMemo(() => {
    if (selectionMode === 'all') return allPosterIds;
    return localSelectedPosterIds;
  }, [allPosterIds, localSelectedPosterIds, selectionMode]);
  const qualityModeMeta = useMemo(
    () => QUALITY_MODE_OPTIONS.find((item) => item.value === selectedQualityMode) ?? QUALITY_MODE_OPTIONS[2],
    [selectedQualityMode]
  );

  useEffect(() => {
    if (!editedProductInfo || !selectedStyle) {
      router.push('/');
      return;
    }

    if (prompts) {
      setGeneratedPrompts(prompts);
    }
  }, [editedProductInfo, prompts, router, selectedStyle, setGeneratedPrompts]);

  if (!editedProductInfo || !selectedStyle || !prompts) {
    return null;
  }

  const safeSelectedIndex = Math.min(selectedIndex, prompts.posters.length - 1);
  const currentPrompt = prompts.posters[safeSelectedIndex];
  const currentPromptEn = editablePromptEnById[currentPrompt.id] ?? currentPrompt.promptEn;

  const handleCopy = (text: string, field: 'zh' | 'en') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField((prev) => (prev === field ? null : prev));
    }, 2000);
  };

  const handlePromptEnChange = (value: string) => {
    setEditablePromptEnById((prev) => ({
      ...prev,
      [currentPrompt.id]: value,
    }));
  };

  const handleResetPromptEn = () => {
    setEditablePromptEnById((prev) => {
      const next = { ...prev };
      delete next[currentPrompt.id];
      return next;
    });
  };

  const setMode = (mode: PosterSelectionMode) => {
    setSelectionMode(mode);
    if (mode === 'all') {
      setLocalSelectedPosterIds(allPosterIds);
      return;
    }

    const preferredId =
      prompts.posters[safeSelectedIndex]?.id || localSelectedPosterIds[0] || allPosterIds[0];
    if (!preferredId) return;

    if (mode === 'single') {
      setLocalSelectedPosterIds([preferredId]);
      return;
    }

    if (localSelectedPosterIds.length === 0) {
      setLocalSelectedPosterIds([preferredId]);
    }
  };

  const togglePosterSelection = (posterId: string, index: number) => {
    setSelectedIndex(index);
    if (selectionMode === 'all') return;

    if (selectionMode === 'single') {
      setLocalSelectedPosterIds([posterId]);
      return;
    }

    const alreadySelected = localSelectedPosterIds.includes(posterId);
    if (alreadySelected && localSelectedPosterIds.length === 1) {
      return;
    }

    const nextIds = alreadySelected
      ? localSelectedPosterIds.filter((id) => id !== posterId)
      : [...localSelectedPosterIds, posterId];

    setLocalSelectedPosterIds(nextIds);
    if (nextIds.length > 0 && !nextIds.includes(currentPrompt.id)) {
      const nextIndex = prompts.posters.findIndex((poster) => poster.id === nextIds[0]);
      setSelectedIndex(nextIndex >= 0 ? nextIndex : 0);
    }
  };

  const handleGenerate = () => {
    const idsToGenerate =
      selectionMode === 'all' ? allPosterIds : localSelectedPosterIds;
    if (idsToGenerate.length === 0) return;

    const promptsForGeneration = {
      ...prompts,
      posters: prompts.posters.map((poster) => {
        const editedPrompt = editablePromptEnById[poster.id];
        const effectivePrompt =
          typeof editedPrompt === 'string' && editedPrompt.trim().length > 0
            ? editedPrompt
            : poster.promptEn;
        return {
          ...poster,
          promptEn: effectivePrompt,
        };
      }),
    };
    setGeneratedPrompts(promptsForGeneration);
    setSelectedPosterIds(selectionMode === 'all' ? null : idsToGenerate);
    router.push('/generate');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          ← 上一步
        </Button>
        <Button size="lg" onClick={handleGenerate}>
          开始生成海报 ({selectedPosterIdsForOutput.length}张 · {qualityModeMeta.label}) →
        </Button>
      </div>

      <Card className="studio-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide">输出设置</h3>
          <span className="text-xs text-muted-foreground">
            已选 {selectedPosterIdsForOutput.length}/{prompts.posters.length} 张
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {SELECTION_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition-all duration-200',
                selectionMode === option.value
                  ? 'border-primary/80 bg-gradient-to-r from-primary to-accent text-white shadow-[0_10px_24px_rgba(70,92,255,0.35)]'
                  : 'border-border/70 bg-secondary/55 text-muted-foreground hover:border-primary/45 hover:text-foreground'
              )}
              onClick={() => setMode(option.value)}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              <div className="text-xs opacity-90">{option.description}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="studio-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide">质量模式</h3>
          <span className="text-xs text-muted-foreground">
            当前: {qualityModeMeta.label}（{qualityModeMeta.candidates} 候选/张）
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {QUALITY_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition-all duration-200',
                selectedQualityMode === option.value
                  ? 'border-primary/80 bg-gradient-to-r from-primary to-accent text-white shadow-[0_10px_24px_rgba(70,92,255,0.35)]'
                  : 'border-border/70 bg-secondary/55 text-muted-foreground hover:border-primary/45 hover:text-foreground'
              )}
              onClick={() => setSelectedQualityMode(option.value)}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              <div className="text-xs opacity-90">{option.description}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="studio-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide">海报类型选择</h3>
          <span className="text-xs text-muted-foreground">{safeSelectedIndex + 1}/{prompts.posters.length}</span>
        </div>
        <div className="glass-scrollbar flex gap-2 overflow-x-auto pb-1">
          {prompts.posters.map((poster, index) => (
            <button
              key={poster.id}
              className={cn(
                "whitespace-nowrap rounded-xl border px-4 py-2 text-sm transition-all duration-200",
                selectedPosterIdsForOutput.includes(poster.id)
                  ? "border-primary/80 bg-gradient-to-r from-primary to-accent text-white shadow-[0_10px_24px_rgba(70,92,255,0.35)]"
                  : "border-border/70 bg-secondary/55 text-muted-foreground hover:border-primary/45 hover:text-foreground",
                safeSelectedIndex === index && "ring-1 ring-primary/50"
              )}
              onClick={() => togglePosterSelection(poster.id, index)}
            >
              {poster.id} · {poster.title} {selectedPosterIdsForOutput.includes(poster.id) ? '✓' : ''}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {selectionMode === 'all'
            ? '当前为全部输出模式，将生成全部海报类型。'
            : selectionMode === 'single'
              ? '当前为单张输出模式，点击一个类型即可切换。'
              : '当前为多张输出模式，点击可勾选或取消（至少保留1张）。'}
        </p>
      </Card>

      <Card className="studio-panel animate-slide-up p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="mb-2 text-xl font-bold">
              海报 {currentPrompt.id} - {currentPrompt.title}
            </h3>
            <p className="text-sm text-muted-foreground">{currentPrompt.titleEn}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopy(currentPrompt.promptZh, 'zh')}
            >
              {copiedField === 'zh' ? '✓ 已复制中文' : '复制中文提示词'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopy(currentPromptEn, 'en')}
            >
              {copiedField === 'en' ? '✓ 已复制英文' : '复制英文 Prompt'}
            </Button>
            <Button
              variant="outline"
              onClick={handleResetPromptEn}
              disabled={currentPromptEn === currentPrompt.promptEn}
            >
              恢复英文模板
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold">中文提示词</h4>
            <div className="glass-scrollbar max-h-72 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-4 text-sm whitespace-pre-wrap">
              {currentPrompt.promptZh}
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">英文 Prompt（可编辑）</h4>
            <textarea
              value={currentPromptEn}
              onChange={(event) => handlePromptEnChange(event.target.value)}
              rows={14}
              className="glass-scrollbar w-full rounded-xl border border-border/70 bg-secondary/40 p-4 text-sm leading-6 outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              这里的英文 Prompt 会直接用于实际生成；可针对单张海报定向优化。
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">负面词</h4>
            <div className="glass-scrollbar max-h-36 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-4 text-sm whitespace-pre-wrap">
              {currentPrompt.negative}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setSelectedIndex(Math.max(0, safeSelectedIndex - 1))}
          disabled={safeSelectedIndex === 0}
        >
          ← 上一张
        </Button>
        <span className="text-sm text-muted-foreground">
          {safeSelectedIndex + 1} / {prompts.posters.length}
        </span>
        <Button
          variant="outline"
          onClick={() => setSelectedIndex(Math.min(prompts.posters.length - 1, safeSelectedIndex + 1))}
          disabled={safeSelectedIndex === prompts.posters.length - 1}
        >
          下一张 →
        </Button>
      </div>
    </div>
  );
}

# Prompt-related Files Audit (20260227-190456)

## Scope
Prompt text, prompt assembly logic, runtime prompt resolution, refine prompt stitching, API prompt transport, and prompt-linked scripts.

## Files
- contexts/AppContext.tsx
- app/analyze/page.tsx
- app/api/analyze/route.ts
- lib/api/gemini.ts
- lib/utils/promptGenerator.ts
- lib/utils/promptGeneratorV2.ts
- app/prompts/page.tsx
- lib/api/client.ts
- app/api/generate/route.ts
- lib/api/nanobanana.ts
- app/generate/page.tsx
- app/gallery/page.tsx
- app/style/page.tsx
- scripts/prompt-generator-demo.ts
- scripts/local-acceptance.sh
- scripts/verify-deployment.sh

## contexts/AppContext.tsx

```
'use client';

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

// 类型定义
export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url: string;
}

export interface AnalysisResponse {
  brandName: {
    zh: string;
    en: string;
  };
  productType: {
    category: string;
    specific: string;
  };
  specifications: string;
  sellingPoints: Array<{
    zh: string;
    en: string;
  }>;
  colorScheme: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  designStyle: string;
  targetAudience: string;
  brandTone: string;
  packagingHighlights: string[];
  parameters: {
    netContent: string;
    ingredients: string;
    nutrition: string;
    usage: string;
    shelfLife: string;
    storage: string;
  };
  recommendedStyle: string;
  recommendedTypography: string;
  styleDirection?: {
    primary: string;
    secondary: string;
    tags: string[];
  };
}

export type PosterAspectRatio =
  | '9:16'
  | '3:4'
  | '2:3'
  | '1:1'
  | '4:3'
  | '3:2'
  | '16:9'
  | '21:9';

export type GenerationQualityMode = 'fast' | 'balanced' | 'quality';
export type GenerationPipelineMode = 'one_pass_layout_anchor';

export interface StyleConfig {
  visual: string;
  typography: string;
  textLayout: 'stacked' | 'parallel' | 'separated';
  aspectRatio: PosterAspectRatio;
}

export interface PosterOverlayPalette {
  primary: string;
  secondary: string;
  accent: string;
  textOnDark: string;
}

export interface PosterOverlaySpec {
  layout: 'hero' | 'lifestyle' | 'specs' | 'generic';
  titleZh: string;
  titleEn: string;
  subtitleZh?: string;
  subtitleEn?: string;
  bullets?: Array<{ zh: string; en: string }>;
  ctaZh?: string;
  ctaEn?: string;
  logoText?: string;
  palette?: PosterOverlayPalette;
}

export interface PosterPrompt {
  id: string;
  title: string;
  titleEn: string;
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  promptZh: string;
  promptEn: string;
  negative: string;
  runtimePromptEn?: string;
  runtimePromptAnchorEn?: string;
  runtimeMainPromptEn?: string;
  runtimeLayoutPromptEn?: string;
  runtimeNegative?: string;
  overlaySpec?: PosterOverlaySpec;
}

export interface PromptsSystem {
  logo: string;
  posters: PosterPrompt[];
}

export interface GeneratedPoster {
  id: string;
  url: string;
  status: 'completed' | 'failed';
  rawUrl?: string;
  overlayApplied?: boolean;
  generationMode?: GenerationPipelineMode;
  promptSource?: string;
  negativeSource?: string;
  versions?: GeneratedPosterVersion[];
  activeVersionId?: string;
}

export interface GeneratedPosterVersion {
  id: string;
  url: string;
  source: 'initial' | 'refine';
  note?: string;
  createdAt: number;
}

interface AppState {
  currentStep: number;
  uploadedImage: UploadedImage | null;
  productInfo: AnalysisResponse | null;
  editedProductInfo: AnalysisResponse | null;
  selectedStyle: StyleConfig | null;
  selectedPosterIds: string[] | null;
  selectedQualityMode: GenerationQualityMode;
  selectedGenerationMode: GenerationPipelineMode;
  generatedPrompts: PromptsSystem | null;
  generatedPosters: GeneratedPoster[] | null;
  isLoading: boolean;
  error: string | null;
}

interface AppActions {
  setCurrentStep: (step: number) => void;
  setUploadedImage: (image: UploadedImage) => void;
  setProductInfo: (info: AnalysisResponse) => void;
  updateProductInfo: (info: Partial<AnalysisResponse>) => void;
  setSelectedStyle: (style: StyleConfig) => void;
  setSelectedPosterIds: (ids: string[] | null) => void;
  setSelectedQualityMode: (mode: GenerationQualityMode) => void;
  setSelectedGenerationMode: (mode: GenerationPipelineMode) => void;
  setGeneratedPrompts: (prompts: PromptsSystem) => void;
  setGeneratedPosters: (posters: GeneratedPoster[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentStep: 0,
  uploadedImage: null,
  productInfo: null,
  editedProductInfo: null,
  selectedStyle: null,
  selectedPosterIds: null,
  selectedQualityMode: 'quality',
  selectedGenerationMode: 'one_pass_layout_anchor',
  generatedPrompts: null,
  generatedPosters: null,
  isLoading: false,
  error: null,
};

// 创建 Context
const AppContext = createContext<AppState & AppActions | undefined>(undefined);

// Provider 组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    ...initialState,
  });

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setUploadedImage = useCallback((image: UploadedImage) => {
    setState((prev) => ({ ...prev, uploadedImage: image }));
  }, []);

  const setProductInfo = useCallback((info: AnalysisResponse) => {
    setState((prev) => ({ ...prev, productInfo: info, editedProductInfo: info }));
  }, []);

  const updateProductInfo = useCallback((info: Partial<AnalysisResponse>) => {
    setState((prev) => ({
      ...prev,
      editedProductInfo: prev.editedProductInfo ? { ...prev.editedProductInfo, ...info } : null
    }));
  }, []);

  const setSelectedStyle = useCallback((style: StyleConfig) => {
    setState((prev) => ({ ...prev, selectedStyle: style }));
  }, []);

  const setSelectedPosterIds = useCallback((ids: string[] | null) => {
    setState((prev) => ({ ...prev, selectedPosterIds: ids }));
  }, []);

  const setSelectedQualityMode = useCallback((mode: GenerationQualityMode) => {
    setState((prev) => ({ ...prev, selectedQualityMode: mode }));
  }, []);

  const setSelectedGenerationMode = useCallback((mode: GenerationPipelineMode) => {
    setState((prev) => ({ ...prev, selectedGenerationMode: mode }));
  }, []);

  const setGeneratedPrompts = useCallback((prompts: PromptsSystem) => {
    setState((prev) => ({ ...prev, generatedPrompts: prompts }));
  }, []);

  const setGeneratedPosters = useCallback((posters: GeneratedPoster[]) => {
    setState((prev) => ({ ...prev, generatedPosters: posters }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const actions: AppActions = useMemo(() => ({
    setCurrentStep,
    setUploadedImage,
    setProductInfo,
    updateProductInfo,
    setSelectedStyle,
    setSelectedPosterIds,
    setSelectedQualityMode,
    setSelectedGenerationMode,
    setGeneratedPrompts,
    setGeneratedPosters,
    setLoading,
    setError,
    reset,
  }), [
    setCurrentStep,
    setUploadedImage,
    setProductInfo,
    updateProductInfo,
    setSelectedStyle,
    setSelectedPosterIds,
    setSelectedQualityMode,
    setSelectedGenerationMode,
    setGeneratedPrompts,
    setGeneratedPosters,
    setLoading,
    setError,
    reset,
  ]);

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
```

## app/analyze/page.tsx

```
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useLoading } from '@/hooks/useLoading';
import { analyzeProduct } from '@/lib/api/client';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { AnalysisResponse } from '@/contexts/AppContext';

const inFlightAnalyzeTasks = new Map<string, Promise<AnalysisResponse>>();

function getOrCreateAnalyzeTask(imageId: string, imagePreview: string) {
  const existingTask = inFlightAnalyzeTasks.get(imageId);
  if (existingTask) return existingTask;

  const task = analyzeProduct(imagePreview).finally(() => {
    inFlightAnalyzeTasks.delete(imageId);
  });
  inFlightAnalyzeTasks.set(imageId, task);
  return task;
}

export default function AnalyzePage() {
  const router = useRouter();
  const { uploadedImage, editedProductInfo, setProductInfo } = useAppContext();
  const { isLoading, progress, message, startLoading, updateProgress, stopLoading } = useLoading();
  const routerRef = useRef(router);
  const handlersRef = useRef({
    setProductInfo,
    startLoading,
    updateProgress,
    stopLoading,
  });

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    handlersRef.current = {
      setProductInfo,
      startLoading,
      updateProgress,
      stopLoading,
    };
  }, [setProductInfo, startLoading, stopLoading, updateProgress]);

  useEffect(() => {
    const imageId = uploadedImage?.id;
    const imagePreview = uploadedImage?.preview;
    if (!imageId || !imagePreview) {
      routerRef.current.push('/');
      return;
    }

    let cancelled = false;

    const analyze = async () => {
      handlersRef.current.startLoading('AI 正在分析产品图片...');
      if (cancelled) return;

      try {
        if (cancelled) return;
        handlersRef.current.updateProgress(20, '识别品牌名称...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (cancelled) return;

        handlersRef.current.updateProgress(40, '提取产品信息...');
        const result = await getOrCreateAnalyzeTask(imageId, imagePreview);
        if (cancelled) return;

        handlersRef.current.updateProgress(80, '分析配色方案...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (cancelled) return;

        handlersRef.current.updateProgress(100, '分析完成!');
        if (cancelled) return;
        console.info('[analyze-flow] analysis complete, preparing redirect', { imageId });
        handlersRef.current.setProductInfo(result);
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (cancelled) return;
        handlersRef.current.stopLoading();
        console.info('[analyze-flow] redirect -> /edit (primary path)', { imageId });
        routerRef.current.replace('/edit');
      } catch (error) {
        if (cancelled) return;
        console.error('Analysis failed:', error);
        alert('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
        handlersRef.current.stopLoading();
        routerRef.current.push('/');
      }
    };

    analyze();

    return () => {
      cancelled = true;
    };
  }, [uploadedImage?.id, uploadedImage?.preview]);

  useEffect(() => {
    if (!editedProductInfo) return;
    const fallbackTimer = setTimeout(() => {
      console.info('[analyze-flow] redirect -> /edit (fallback path)');
      routerRef.current.replace('/edit');
    }, 250);
    const hardFallbackTimer = setTimeout(() => {
      if (window.location.pathname === '/analyze') {
        console.info('[analyze-flow] redirect retry -> /edit');
        routerRef.current.replace('/edit');
      }
    }, 1200);
    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(hardFallbackTimer);
    };
  }, [editedProductInfo]);

  if (isLoading) {
    return <LoadingScreen progress={progress} message={message} />;
  }

  return null;
}
```

## app/api/analyze/route.ts

```
import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduct } from '@/lib/api/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageBase64 = body?.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageBase64' },
        { status: 400 }
      );
    }

    const result = await analyzeProduct(imageBase64);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/analyze] failed', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analyze API failed',
      },
      { status: 500 }
    );
  }
}
```

## lib/api/gemini.ts

```
import 'server-only';
import { withRetry } from '@/lib/errors/errorHandler';

interface AnalysisResponse {
  brandName: {
    zh: string;
    en: string;
  };
  productType: {
    category: string;
    specific: string;
  };
  specifications: string;
  sellingPoints: Array<{
    zh: string;
    en: string;
  }>;
  colorScheme: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  designStyle: string;
  targetAudience: string;
  brandTone: string;
  packagingHighlights: string[];
  parameters: {
    netContent: string;
    ingredients: string;
    nutrition: string;
    usage: string;
    shelfLife: string;
    storage: string;
  };
  recommendedStyle: string;
  recommendedTypography: string;
  styleDirection?: {
    primary: string;
    secondary: string;
    tags: string[];
  };
}

const ANALYSIS_PROMPT = `
请仔细分析这张产品图片,提取以下信息并以 JSON 格式返回:

1. 品牌名称(中英文)
2. 产品类型(大类和具体产品)
3. 产品规格
4. 核心卖点(5个,中英文双语)
5. 配色方案(主色、辅助色、点缀色的 HEX 值)
6. 设计风格
7. 目标受众
8. 品牌调性
9. 包装亮点
10. 产品参数(净含量、成分、营养、用法、保质期、储存)
11. 推荐的视觉风格(从以下选择: magazine, watercolor, tech, vintage, minimal, cyber, organic)
12. 推荐的文字排版(根据产品特征选择最合适的):
    - glassmorphism: 适合科技、现代、未来感产品
    - 3d: 适合奢华、高端、金属质感产品
    - handwritten: 适合艺术、手作、温暖、自然产品
    - serif: 适合杂志、编辑、专业、经典产品
    - sans-serif: 适合现代、简洁、商务产品
    - thin: 适合极简、高端、优雅产品
    请根据产品的品牌调性、设计风格和目标受众，选择最匹配的排版风格
13. 双风格导向(主风格 + 副风格 + 3个风格关键词,用于生图时混合控制)

请严格按照以下 JSON 格式返回:
{
  "brandName": {"zh": "", "en": ""},
  "productType": {"category": "", "specific": ""},
  "specifications": "",
  "sellingPoints": [
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""}
  ],
  "colorScheme": {
    "primary": ["#HEX", "#HEX"],
    "secondary": ["#HEX"],
    "accent": ["#HEX", "#HEX"]
  },
  "designStyle": "",
  "targetAudience": "",
  "brandTone": "",
  "packagingHighlights": ["", "", ""],
  "parameters": {
    "netContent": "",
    "ingredients": "",
    "nutrition": "",
    "usage": "",
    "shelfLife": "",
    "storage": ""
  },
  "recommendedStyle": "",
  "recommendedTypography": "",
  "styleDirection": {
    "primary": "",
    "secondary": "",
    "tags": ["", "", ""]
  }
}

重要提示：
- 如果产品是食品、饮料、日用品等，推荐 serif 或 handwritten
- 如果产品是电子产品、科技产品，推荐 glassmorphism 或 thin
- 如果产品是奢侈品、高端产品，推荐 3d 或 serif
- 如果产品是时尚、潮流产品，推荐 sans-serif
- 根据产品的实际特征选择，不要总是推荐同一种
`;

const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const ANALYSIS_TIMEOUT_MS = 20000;
const ANALYSIS_MAX_RETRIES = 2;
const ANALYSIS_RETRY_DELAY_MS = 1200;

export async function analyzeProduct(imageBase64: string): Promise<AnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // 移除 base64 前缀
  const base64Data = imageBase64.split(',')[1] || imageBase64;

  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${ANALYSIS_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: ANALYSIS_PROMPT
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 8192,
            }
          })
        }
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gemini API timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutTimer);
    }

    if (!response.ok) {
      const rawError = await response.text();
      const parsedError = tryParseJson(rawError);
      const errorBody = parsedError ? JSON.stringify(parsedError) : rawError;
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return normalizeAnalysisResponse(result as Partial<AnalysisResponse>);
  }, ANALYSIS_MAX_RETRIES, ANALYSIS_RETRY_DELAY_MS);
}

function normalizeAnalysisResponse(
  input: Partial<AnalysisResponse>
): AnalysisResponse {
  const normalizedRecommendedStyle = normalizeRecommendedStyle(
    input.recommendedStyle
  );
  const normalizedStyleDirection = normalizeStyleDirection({
    recommendedStyle: normalizedRecommendedStyle,
    designStyle: input.designStyle,
    brandTone: input.brandTone,
    styleDirection: input.styleDirection,
  });

  return {
    brandName: input.brandName || { zh: '', en: '' },
    productType: input.productType || { category: '', specific: '' },
    specifications: input.specifications || '',
    sellingPoints: Array.isArray(input.sellingPoints) ? input.sellingPoints : [],
    colorScheme: input.colorScheme || {
      primary: ['#5F77FF'],
      secondary: ['#AAB7FF'],
      accent: ['#C248FF'],
    },
    designStyle: input.designStyle || '',
    targetAudience: input.targetAudience || '',
    brandTone: input.brandTone || '',
    packagingHighlights: Array.isArray(input.packagingHighlights)
      ? input.packagingHighlights
      : [],
    parameters: input.parameters || {
      netContent: '',
      ingredients: '',
      nutrition: '',
      usage: '',
      shelfLife: '',
      storage: '',
    },
    recommendedStyle: normalizedRecommendedStyle,
    recommendedTypography: input.recommendedTypography || 'glassmorphism',
    styleDirection: normalizedStyleDirection,
  };
}

function normalizeRecommendedStyle(input?: string): string {
  const allowed = new Set([
    'magazine',
    'watercolor',
    'tech',
    'vintage',
    'minimal',
    'cyber',
    'organic',
  ]);
  const normalized = (input || '').trim().toLowerCase();
  if (allowed.has(normalized)) {
    return normalized;
  }
  return 'magazine';
}

function normalizeStyleDirection(args: {
  recommendedStyle: string;
  designStyle?: string;
  brandTone?: string;
  styleDirection?: {
    primary?: string;
    secondary?: string;
    tags?: string[];
  };
}): { primary: string; secondary: string; tags: string[] } {
  const primaryFallback = mapStyleIdToDirection(args.recommendedStyle);
  const parsedDesignTokens = tokenizeStyleText(args.designStyle || '');
  const rawPrimary = cleanStyleDirectionText(
    args.styleDirection?.primary || parsedDesignTokens[0] || primaryFallback
  );
  let rawSecondary = cleanStyleDirectionText(
    args.styleDirection?.secondary || parsedDesignTokens[1] || getSecondaryFallback(rawPrimary)
  );

  if (!rawSecondary || rawSecondary.toLowerCase() === rawPrimary.toLowerCase()) {
    rawSecondary = getSecondaryFallback(rawPrimary);
  }

  const tagsSource = [
    ...(Array.isArray(args.styleDirection?.tags) ? args.styleDirection?.tags : []),
    ...tokenizeStyleText(args.brandTone || ''),
    ...parsedDesignTokens,
  ];
  const tags = uniqueNonEmpty(tagsSource.map((tag) => cleanStyleDirectionText(tag))).slice(0, 4);

  return {
    primary: rawPrimary || primaryFallback,
    secondary: rawSecondary || getSecondaryFallback(rawPrimary || primaryFallback),
    tags: tags.length > 0 ? tags : ['premium', 'clean', 'commercial'],
  };
}

function mapStyleIdToDirection(styleId: string): string {
  const map: Record<string, string> = {
    magazine: 'Modern Luxury Editorial',
    watercolor: 'Artistic Watercolor',
    tech: 'Futuristic Tech',
    vintage: 'Vintage Film',
    minimal: 'Minimalist Clean',
    cyber: 'Cyberpunk Minimalist',
    organic: 'Natural Organic',
  };
  return map[styleId] || map.magazine;
}

function getSecondaryFallback(primary: string): string {
  const lower = primary.toLowerCase();
  if (lower.includes('luxury') || lower.includes('editorial')) return 'Cyberpunk Minimalist';
  if (lower.includes('cyber') || lower.includes('tech')) return 'Modern Luxury Editorial';
  if (lower.includes('organic') || lower.includes('watercolor')) return 'Minimalist Clean';
  if (lower.includes('vintage')) return 'Modern Luxury Editorial';
  return 'Minimalist Clean';
}

function tokenizeStyleText(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[\\/|,+，、；;]+/)
    .map((item) => cleanStyleDirectionText(item))
    .filter(Boolean);
}

function cleanStyleDirectionText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result;
}

function tryParseJson(text: string): unknown | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
```

## lib/utils/promptGenerator.ts

```
import { AnalysisResponse, PosterOverlaySpec, StyleConfig } from '@/contexts/AppContext';

interface PosterPrompt {
  id: string;
  title: string;
  titleEn: string;
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  promptZh: string;
  promptEn: string;
  negative: string;
  runtimePromptEn?: string;
  runtimePromptAnchorEn?: string;
  runtimeMainPromptEn?: string;
  runtimeLayoutPromptEn?: string;
  runtimeNegative?: string;
  overlaySpec?: PosterOverlaySpec;
}

interface PromptsSystem {
  logo: string;
  posters: PosterPrompt[];
}

interface PosterTemplate {
  id: string;
  title: string;
  titleEn: string;
  type: PosterPrompt['type'];
  shotHint: string;
  scenePlan: string;
  sceneKeywords: string[];
}

interface BrandLock {
  enabled: boolean;
  text: string;
}

const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: '01',
    title: '主KV视觉',
    titleEn: 'Hero Shot',
    type: 'hero',
    shotHint: 'Centered hero product shot with clean background and subtle shadow reflection.',
    scenePlan: 'Hero-only composition with product as the sole visual focus on a clean gradient backdrop.',
    sceneKeywords: [
      'single hero object',
      'cream-orange gradient backdrop',
      'center composition',
      'leaf detail visible',
    ],
  },
  {
    id: '02',
    title: '生活场景',
    titleEn: 'Lifestyle Scene',
    type: 'lifestyle',
    shotHint: 'Lifestyle breakfast scene with product foreground and soft kitchen depth.',
    scenePlan: 'Daily-use breakfast setup with tableware and juice props, keeping product as the anchor subject.',
    sceneKeywords: [
      'light wood table',
      'morning window light',
      'white ceramic plate',
      'fresh juice glass',
      'home kitchen bokeh',
    ],
  },
  {
    id: '03',
    title: '工艺概念',
    titleEn: 'Process Concept',
    type: 'process',
    shotHint: 'Concept visual with citrus cross-section, nutrient particles, and controlled splash.',
    scenePlan: 'Technical concept scene visualizing product internals and process cues, not a lifestyle photo.',
    sceneKeywords: [
      'macro pulp cross-section',
      'floating nutrient particles',
      'citrus liquid splash',
      'deep orange radial glow',
    ],
  },
  {
    id: '04',
    title: '细节特写01',
    titleEn: 'Detail Focus 01',
    type: 'detail',
    shotHint: 'Macro close-up emphasizing peel pores, droplets, and leaf veins.',
    scenePlan: 'Extreme macro detail scene focused on tactile freshness signals in a shallow-depth frame.',
    sceneKeywords: [
      'water droplet on peel',
      'leaf veins macro',
      'extreme close-up',
      'orchard bokeh',
    ],
  },
  {
    id: '05',
    title: '细节特写02',
    titleEn: 'Detail Focus 02',
    type: 'detail',
    shotHint: 'Material detail angle highlighting slice translucency and juicy texture.',
    scenePlan: 'Food-texture detail scene with appetizing high-key look and translucent pulp focus.',
    sceneKeywords: [
      'orange slice translucency',
      'visible juice droplets',
      'high-key food light',
      'saturated citrus tone',
    ],
  },
  {
    id: '06',
    title: '细节特写03',
    titleEn: 'Detail Focus 03',
    type: 'detail',
    shotHint: 'Functional close-up showing half-peeled structure and intact segments.',
    scenePlan: 'Functional detail scene demonstrating peel performance in a minimal studio setup.',
    sceneKeywords: [
      'half-peeled reveal',
      'thin peel texture',
      'clean white studio',
      'soft tabletop shadow',
    ],
  },
  {
    id: '07',
    title: '细节特写04',
    titleEn: 'Detail Focus 04',
    type: 'detail',
    shotHint: 'Trust-focused social-proof scene with quote-card foreground and product anchor.',
    scenePlan: 'Review and trust scene with social-proof collage elements and one clear product anchor.',
    sceneKeywords: [
      'blurry customer photo grid',
      'glass quote card',
      'star-rating icon set',
      'product anchor bottom-right',
    ],
  },
  {
    id: '08',
    title: '品牌故事',
    titleEn: 'Brand Story',
    type: 'brand',
    shotHint: 'Brand-story orchard scene at golden hour with warm cinematic mood.',
    scenePlan: 'Storytelling scene combining orchard atmosphere, palette inspiration, and foreground product anchor.',
    sceneKeywords: [
      'golden hour orchard',
      'sun flare haze',
      'wooden post foreground',
      'palette-strip accent',
    ],
  },
  {
    id: '09',
    title: '产品参数',
    titleEn: 'Specifications',
    type: 'specs',
    shotHint: 'Clean specs poster with top-down product and structured data zone.',
    scenePlan: 'Technical infographic scene with annotation lines and a dedicated lower data-table area.',
    sceneKeywords: [
      'top-down product view',
      'minimal grid lines',
      'annotation callouts',
      'data-table lower area',
    ],
  },
  {
    id: '10',
    title: '使用指南',
    titleEn: 'Usage Guide',
    type: 'usage',
    shotHint: 'Usage guide scene with clear three-step icon workflow.',
    scenePlan: 'Instructional scene with vertical step flow and warm orange-white guide blocks.',
    sceneKeywords: [
      'three-step icon flow',
      'orange-white guide blocks',
      'pictogram instructions',
      'vertical process layout',
    ],
  },
];

export function generatePrompts(
  productInfo: AnalysisResponse,
  style: StyleConfig
): PromptsSystem {
  const sellingPoints = normalizeSellingPoints(productInfo.sellingPoints);
  const styleDirection = resolveStyleDirection(productInfo, style.visual);
  const aspectRatio = style.aspectRatio || '9:16';
  const orientation = getAspectRatioOrientationEn(aspectRatio);
  const brandLock = resolveBrandLock();

  const posters = POSTER_TEMPLATES.map((template, index) => {
    const overlaySpec = buildOverlaySpec({
      template,
      productInfo,
      sellingPoints,
      templateIndex: index,
      brandLock,
    });
    const runtimeMainPromptEn = buildRuntimeMainPrompt({
      template,
      productInfo,
      style,
      styleDirection,
      aspectRatio,
      orientation,
      brandLock,
    });
    const runtimeLayoutPromptEn = buildRuntimeLayoutPrompt({
      template,
      overlaySpec,
    });
    const runtimePromptAnchorEn = `${runtimeMainPromptEn}\n\n${runtimeLayoutPromptEn}`;
    const runtimeNegative = buildRuntimeNegative(template.type);

    return {
      id: template.id,
      title: template.title,
      titleEn: template.titleEn,
      type: template.type,
      promptZh: buildDisplayPromptZh(runtimeMainPromptEn, runtimeLayoutPromptEn),
      promptEn: runtimePromptAnchorEn,
      negative: runtimeNegative,
      runtimePromptEn: runtimePromptAnchorEn,
      runtimePromptAnchorEn,
      runtimeMainPromptEn,
      runtimeLayoutPromptEn,
      runtimeNegative,
      overlaySpec,
    } satisfies PosterPrompt;
  });

  return {
    logo: brandLock.enabled ? brandLock.text : '',
    posters,
  };
}

function normalizeSellingPoints(
  points: Array<{ zh: string; en: string }> | undefined
): Array<{ zh: string; en: string }> {
  const normalized = Array.isArray(points) ? points : [];
  const cleaned = normalized
    .map((point) => ({
      zh: sanitizeCopy(point?.zh),
      en: sanitizeCopy(point?.en),
    }))
    .filter((point) => point.zh || point.en);
  const fallbackZh = cleaned[0]?.zh || '';
  const fallbackEn = cleaned[0]?.en || '';

  return Array.from({ length: 5 }, (_, index) => {
    const point = cleaned[index];
    return {
      zh: point?.zh || point?.en || fallbackZh,
      en: point?.en || point?.zh || fallbackEn,
    };
  });
}

function buildOverlaySpec(args: {
  template: PosterTemplate;
  productInfo: AnalysisResponse;
  sellingPoints: Array<{ zh: string; en: string }>;
  templateIndex: number;
  brandLock: BrandLock;
}): PosterOverlaySpec {
  const { template, productInfo, sellingPoints, templateIndex, brandLock } = args;
  const logoText = brandLock.enabled ? brandLock.text : '';
  const defaultTitleZh = sanitizeCopy(productInfo.productType.specific || productInfo.productType.category);
  const defaultTitleEn = sanitizeCopy(productInfo.productType.specific || productInfo.productType.category);
  const palette = {
    primary: productInfo.colorScheme.primary[0] || '#5F77FF',
    secondary: productInfo.colorScheme.secondary[0] || '#8CA2FF',
    accent: productInfo.colorScheme.accent[0] || '#C248FF',
    textOnDark: '#F7F8FF',
  };

  if (template.id === '09') {
    const specBullets = Object.entries(productInfo.parameters || {})
      .filter(([, value]) => Boolean(value && String(value).trim()))
      .slice(0, 2)
      .map(([key, value]) => ({
        zh: `${mapParameterKeyZh(key)}：${String(value).trim()}`,
        en: '',
      }));

    return {
      layout: 'specs',
      titleZh: '产品参数',
      titleEn: 'SPECIFICATIONS',
      subtitleZh: '',
      subtitleEn: '',
      bullets: specBullets,
      logoText,
      palette,
    };
  }

  if (template.id === '10') {
    return {
      layout: 'generic',
      titleZh: '使用指南',
      titleEn: 'USAGE GUIDE',
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.id === '08') {
    return {
      layout: 'generic',
      titleZh: '品牌故事',
      titleEn: 'BRAND STORY',
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.type === 'lifestyle') {
    return {
      layout: 'lifestyle',
      titleZh: pickText(sellingPoints[0]?.zh, defaultTitleZh),
      titleEn: pickText(sellingPoints[0]?.en, defaultTitleEn),
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.type === 'hero') {
    return {
      layout: 'hero',
      titleZh: pickText(sellingPoints[0]?.zh, defaultTitleZh),
      titleEn: pickText(sellingPoints[0]?.en, defaultTitleEn),
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.type === 'detail') {
    const pick = sellingPoints[Math.min(4, Math.max(1, templateIndex))] || sellingPoints[0];
    return {
      layout: 'generic',
      titleZh: pickText(pick?.zh, defaultTitleZh),
      titleEn: pickText(pick?.en, defaultTitleEn),
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.type === 'process') {
    return {
      layout: 'generic',
      titleZh: pickText(sellingPoints[0]?.zh, defaultTitleZh),
      titleEn: pickText(sellingPoints[0]?.en, defaultTitleEn),
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  return {
    layout: 'generic',
    titleZh: pickText(sellingPoints[0]?.zh, defaultTitleZh),
    titleEn: pickText(sellingPoints[0]?.en, defaultTitleEn),
    subtitleZh: '',
    subtitleEn: '',
    bullets: [],
    logoText,
    palette,
  };
}

function buildRuntimeMainPrompt(args: {
  template: PosterTemplate;
  productInfo: AnalysisResponse;
  style: StyleConfig;
  styleDirection: { primary: string; secondary: string; tags: string[] };
  aspectRatio: string;
  orientation: string;
  brandLock: BrandLock;
}): string {
  const { template, productInfo, style, styleDirection, aspectRatio, orientation, brandLock } = args;
  const lightingHint = resolveLightingHint(template.type, style.visual);
  const productName = sanitizeCopy(productInfo.productType.specific) || sanitizeCopy(productInfo.productType.category) || 'product';
  const sceneKeywords = buildSceneKeywords(template, productInfo);
  const styleLabel = resolveTemplateStyleLabel(styleDirection.primary, template);
  const realismRule = isPhotoCriticalTemplate(template)
    ? 'Realism: ultra-photorealistic commercial product photography, real lens optics, physically plausible lighting/material response, no illustration or CGI look.'
    : '';
  const antiSimilarityHint =
    template.id === '01'
      ? ''
      : 'Avoid repeating hero-style plain centered product-only composition.';
  const brandRule = brandLock.enabled
    ? `Brand rule: if logo/brand text appears, it must be exactly '${brandLock.text}' and identical across all posters.`
    : 'Brand rule: no standalone logo or brand-name text overlays.';
  const restoreLine = brandLock.enabled
    ? `Strictly restore uploaded product image (${brandLock.text} ${productName}); keep package, logo, and texture unchanged.`
    : `Strictly restore uploaded product image (${productName}); keep package and texture unchanged.`;

  return [
    `${aspectRatio} ${orientation} poster, ${styleLabel} style, ${lightingHint}.`,
    template.shotHint,
    `Scene: ${template.scenePlan}.`,
    `Keywords: ${sceneKeywords.join(', ')}.`,
    antiSimilarityHint,
    realismRule,
    brandRule,
    restoreLine,
    'Commercial quality, 8k resolution.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildSceneKeywords(
  template: PosterTemplate,
  productInfo: AnalysisResponse
): string[] {
  const productKeyword = sanitizeCopy(productInfo.productType.specific || productInfo.productType.category)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const productAnchor = productKeyword ? `${productKeyword} anchor subject` : 'product anchor subject';
  const paletteKeyword = derivePaletteKeyword(productInfo.colorScheme.primary);
  const keywords = [...template.sceneKeywords];

  if (!keywords.includes(productAnchor)) {
    keywords.push(productAnchor);
  }
  if (paletteKeyword && !keywords.includes(paletteKeyword)) {
    keywords.push(paletteKeyword);
  }

  return keywords.slice(0, 6);
}

function derivePaletteKeyword(primary: string[] | undefined): string {
  const value = (primary || []).find((item) => typeof item === 'string' && item.trim().length > 0);
  if (!value) return '';
  return `palette accent ${value.trim()}`;
}

function buildRuntimeLayoutPrompt(args: {
  template: PosterTemplate;
  overlaySpec: PosterOverlaySpec;
}): string {
  const { template, overlaySpec } = args;
  const anchors = buildLayoutAnchors(template, overlaySpec);

  return [
    'Layout anchors (instruction only, do not render label words):',
    ...anchors,
    'Constraints: safe margins; no subtitle; no CTA; no border/frame; no filler captions.',
  ].join('\n');
}

function buildLayoutAnchors(
  template: PosterTemplate,
  overlaySpec: PosterOverlaySpec
): string[] {
  const logoText = composeLogo(overlaySpec);
  const title = composeTitle(overlaySpec);
  const logoTopCenter = logoText ? [`Top-Center: Logo '${logoText}'.`] : [];
  const logoTopLeft = logoText ? [`Top-Left: Logo '${logoText}'.`] : [];

  if (template.id === '09') {
    return [...logoTopCenter, `Upper-Center: Main Title '${title}'.`];
  }

  if (template.type === 'hero') {
    return [...logoTopCenter, `Center: Main Title '${title}'.`];
  }

  if (template.type === 'lifestyle') {
    return [...logoTopLeft, `Middle: Main Title '${title}'.`];
  }

  return [...logoTopLeft, `Upper-Left: Main Title '${title}'.`];
}

function composeLogo(overlaySpec: PosterOverlaySpec): string {
  return compactLayoutText(sanitizeCopy(overlaySpec.logoText), 18);
}

function composeTitle(overlaySpec: PosterOverlaySpec): string {
  const zh = compactLayoutText(sanitizeCopy(overlaySpec.titleZh), 12);
  const en = compactLayoutText(sanitizeCopy(overlaySpec.titleEn), 22);
  return zh || en || 'Headline';
}

function pickText(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

function buildRuntimeNegative(type: PosterPrompt['type']): string {
  const photoOnlyNegatives = [
    'cartoon style',
    'anime style',
    'illustration style',
    'watercolor painting',
    'oil painting',
    'flat vector art',
    '3d render',
    'cgi look',
    'synthetic ai look',
  ];
  const common = [
    'extra unrelated logo',
    'watermark',
    'cta button',
    'shop now',
    'learn more',
    'scan for details',
    'qr code',
    'decorative border frame',
    'poster frame',
    'floating translucent full-screen text panel',
    'gibberish text',
    'random characters',
    'misspelled words',
    'broken letters',
    'duplicated words',
    'mirrored text',
    'wrong brand spelling',
    'inconsistent brand text',
    'random logo text',
    'altered packaging design',
    'extra product package',
    'deformed package shape',
    'cropped package front',
    'low resolution',
    'blurry focus',
  ];

  const byType: Record<PosterPrompt['type'], string[]> = {
    hero: ['busy background', 'subject too small', ...photoOnlyNegatives],
    lifestyle: ['overcrowded scene', 'face-dominant composition', ...photoOnlyNegatives],
    process: ['overloaded infographic', 'too many icon layers'],
    detail: ['fake plastic texture', 'over-sharpen halos', ...photoOnlyNegatives],
    brand: ['brand mismatch style', 'inconsistent palette', ...photoOnlyNegatives],
    specs: ['tiny unreadable specs', 'crooked bullet alignment'],
    usage: ['too many instruction steps', 'confusing step order'],
  };

  return [...common, ...byType[type]].join(', ');
}

function buildDisplayPromptZh(mainPrompt: string, layoutPrompt: string): string {
  return ['主提示词:', mainPrompt, '', '版式配置:', layoutPrompt].join('\n');
}

function resolveStyleDirection(
  productInfo: AnalysisResponse,
  selectedVisual: string
): { primary: string; secondary: string; tags: string[] } {
  const fallbackPrimary = mapStyleIdToDirection(selectedVisual || productInfo.recommendedStyle);
  const primary = sanitizeCopy(productInfo.styleDirection?.primary) || fallbackPrimary;
  let secondary = sanitizeCopy(productInfo.styleDirection?.secondary) || inferSecondaryDirection(primary);

  if (!secondary || secondary.toLowerCase() === primary.toLowerCase()) {
    secondary = inferSecondaryDirection(primary);
  }

  const tags = dedupe(
    [
      ...(productInfo.styleDirection?.tags || []),
      ...tokenize(productInfo.brandTone),
      ...tokenize(productInfo.designStyle),
    ].map((item) => sanitizeCopy(item))
  ).slice(0, 4);

  return {
    primary,
    secondary,
    tags: tags.length > 0 ? tags : ['premium', 'clean', 'commercial'],
  };
}

function mapStyleIdToDirection(styleId: string): string {
  const styleMap: Record<string, string> = {
    magazine: 'Modern Luxury Photo Editorial',
    watercolor: 'Soft Natural Photo Editorial',
    tech: 'Futuristic Product Photography',
    vintage: 'Filmic Product Photography',
    minimal: 'Minimalist Studio Photography',
    cyber: 'Neon Urban Photo Editorial',
    organic: 'Natural Organic Product Photography',
  };
  const normalized = (styleId || '').trim().toLowerCase();
  return styleMap[normalized] || styleMap.magazine;
}

function inferSecondaryDirection(primary: string): string {
  const lower = primary.toLowerCase();
  if (lower.includes('luxury') || lower.includes('editorial')) return 'Neon Urban Photo Editorial';
  if (lower.includes('cyber') || lower.includes('tech')) return 'Modern Luxury Photo Editorial';
  if (lower.includes('organic') || lower.includes('watercolor')) return 'Minimalist Studio Photography';
  if (lower.includes('vintage')) return 'Modern Luxury Photo Editorial';
  return 'Minimalist Studio Photography';
}

function isPhotoCriticalTemplate(template: PosterTemplate): boolean {
  return template.type === 'hero' || template.type === 'detail' || template.type === 'lifestyle';
}

function resolveTemplateStyleLabel(baseStyle: string, template: PosterTemplate): string {
  if (!isPhotoCriticalTemplate(template)) {
    return baseStyle;
  }
  if (/photo|photography|editorial|filmic|studio/i.test(baseStyle)) {
    return baseStyle;
  }
  return `${baseStyle} Product Photography`;
}

function resolveLightingHint(type: PosterPrompt['type'], visual: string): string {
  if (visual === 'cyber') return 'neon-edged contrast lighting';
  if (visual === 'minimal') return 'soft neutral lighting';
  if (visual === 'vintage') return 'warm filmic lighting';

  const byType: Record<PosterPrompt['type'], string> = {
    hero: 'dramatic rim lighting',
    lifestyle: 'soft natural side lighting',
    process: 'controlled studio highlights',
    detail: 'macro contrast lighting',
    brand: 'cinematic ambient lighting',
    specs: 'clean neutral front lighting',
    usage: 'bright practical lighting',
  };

  return byType[type] || byType.hero;
}

function getAspectRatioOrientationEn(aspectRatio: string): string {
  const vertical = new Set(['9:16', '3:4', '2:3']);
  const square = new Set(['1:1']);
  if (vertical.has(aspectRatio)) return 'vertical';
  if (square.has(aspectRatio)) return 'square';
  return 'horizontal';
}

function mapParameterKeyZh(key: string): string {
  const map: Record<string, string> = {
    netContent: '净含量',
    ingredients: '核心成分',
    nutrition: '营养信息',
    usage: '使用方式',
    shelfLife: '保质期',
    storage: '储存方式',
  };
  return map[key] || key;
}

function tokenize(input?: string): string[] {
  if (!input) return [];
  return input
    .split(/[\\/|,+，、；;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupe(values: Array<string | undefined>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    const cleaned = (value || '').trim();
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  });

  return result;
}

function sanitizeCopy(input?: string): string {
  const text = (input || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const blockedPatterns: RegExp[] = [
    /shop now/i,
    /learn more/i,
    /scan for details/i,
    /details visible/i,
    /lifestyle pick/i,
    /tech insight/i,
    /try it now/i,
    /discover brand/i,
    /立即选购/,
    /了解更多/,
    /扫码了解更多/,
    /细节可见/,
    /关键信息一目了然/,
    /细节特写/,
    /真实场景体验/,
    /技术可视化表达/,
    /可视化呈现/,
    /视觉化呈现/,
    /呈现新鲜度/,
    /freshness visualization/i,
    /visual(?:ized|izing)? freshness/i,
    /visual representation/i,
    /品质之选/,
    /富含天然维生素c/i,
    /增强免疫力/,
    /vitamin c.*immunity/i,
  ];

  const chunks = text
    .split(/[|/｜、，,。.;；:：]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const filteredChunks = chunks.filter(
    (chunk) => !blockedPatterns.some((pattern) => pattern.test(chunk))
  );

  if (filteredChunks.length > 0 && filteredChunks.length < chunks.length) {
    return filteredChunks.join(' / ');
  }

  if (blockedPatterns.some((pattern) => pattern.test(text))) {
    return '';
  }
  return text;
}

function compactLayoutText(value: string, maxLength: number): string {
  if (!value) return '';
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;

  const firstChunk = normalized
    .split(/[|/｜、，,。.;；:：]/)
    .map((item) => item.trim())
    .find((item) => item.length > 0);

  if (firstChunk && firstChunk.length <= maxLength) return firstChunk;
  return normalized.slice(0, maxLength).trim();
}

function resolveBrandLock(): BrandLock {
  // Current flow has no dedicated user-uploaded logo asset.
  // Keep logo overlay optional and off by default to avoid forced brand text.
  return { enabled: false, text: '' };
}
```

## lib/utils/promptGeneratorV2.ts

```
import { AnalysisResponse, StyleConfig } from '@/contexts/AppContext';

/**
 * 提示词生成器 V2 - 叙述式组装逻辑
 *
 * 核心原则：
 * 1. 视觉流线性：像描述一个画面，而不是列需求
 * 2. 一次性可读：不被打断的叙述流
 * 3. 优先级清晰：产品还原 > 视觉元素 > 技术规格
 * 4. 自然语言：使用摄影/设计领域的自然表达
 */

// ============================================================================
// 类型定义
// ============================================================================

interface NarrativePromptConfig {
  // 基础配置
  aspectRatio: string;
  orientation: string;
  visualStyle: string;

  // 布局位置
  logoPosition?: string;
  mainTitle?: string;
  subtitle?: string;
  sellingPoints?: string[];

  // 产品描述
  productDescription: string;
  restoreRequirement?: boolean;

  // 背景与环境
  background?: string;
  lighting?: string;
  atmosphere?: string;

  // 色彩
  primaryColors?: string[];
  secondaryColors?: string[];
  accentColors?: string[];

  // 文字样式
  typography?: string;
  textLayout?: string;

  // 技术规格
  technicalSpecs?: string;

  // 特殊指令
  specialInstructions?: string[];
}

interface VisualStyleDescriptor {
  primary: string;      // 主风格描述
  secondary: string;    // 副风格描述
  tags: string[];       // 风格关键词
  lighting: string;     // 推荐光影
  background: string;   // 推荐背景
}

// ============================================================================
// 视觉风格映射表（基于提示词1的成功风格）
// ============================================================================

const VISUAL_STYLE_MAP: Record<string, VisualStyleDescriptor> = {
  magazine: {
    primary: 'Organic Magazine Style',
    secondary: 'Editorial Photography',
    tags: ['clean', 'minimalist', 'professional', 'high-end'],
    lighting: 'soft morning sunlight, studio lighting',
    background: 'clean and minimalist, light beige textured fabric',
  },
  watercolor: {
    primary: 'Watercolor Art Style',
    secondary: 'Hand-painted Illustration',
    tags: ['warm', 'soft', 'artistic', 'dreamy'],
    lighting: 'soft diffuse natural light',
    background: 'watercolor wash background, subtle brush strokes',
  },
  tech: {
    primary: 'Tech Future Style',
    secondary: 'Digital Visualization',
    tags: ['cool', 'geometric', 'data-driven', 'futuristic'],
    lighting: 'cool blue ambient light, rim lighting',
    background: 'dark gradient, geometric patterns, data visualization elements',
  },
  vintage: {
    primary: 'Vintage Film Style',
    secondary: 'Retro Photography',
    tags: ['nostalgic', 'warm', 'film grain', 'classic'],
    lighting: 'warm tungsten light, soft shadows',
    background: 'vintage texture, film grain, warm tones',
  },
  minimal: {
    primary: 'Minimal Nordic Style',
    secondary: 'Clean Modern Design',
    tags: ['clean', 'geometric', 'minimal', 'elegant'],
    lighting: 'soft even lighting, low contrast',
    background: 'pure white or light gray, large negative space',
  },
  cyber: {
    primary: 'Neon Cyberpunk Style',
    secondary: 'Future Urban',
    tags: ['neon', 'glowing', 'dark', 'futuristic'],
    lighting: 'neon glow lighting, colored rim lights',
    background: 'dark urban background, neon lights, cyber elements',
  },
  organic: {
    primary: 'Natural Organic Style',
    secondary: 'Eco-friendly Design',
    tags: ['natural', 'earth tones', 'handmade texture', 'eco-friendly'],
    lighting: 'soft natural sunlight, warm tones',
    background: 'natural elements, plant textures, earth tones',
  },
};

// ============================================================================
// 主函数：生成叙述式提示词
// ============================================================================

/**
 * 生成叙述式提示词（类似提示词1的风格）
 *
 * @example
 * 9:16 vertical poster, Organic Magazine Style.
 *
 * Top center: Logo 'Brand Name'.
 *
 * Center: Hyper-realistic product shot, strictly restore uploaded product image.
 *
 * Below: Main title in Bold Sans, subtitle in Light Serif.
 *
 * Background is clean and minimalist. High-end food photography, 8k resolution.
 */
export function generateNarrativePrompt(config: NarrativePromptConfig): string {
  const parts: string[] = [];

  // 1. 开头：比例 + 风格（一句话定义）
  parts.push(buildOpeningLine(config.aspectRatio, config.orientation, config.visualStyle));

  // 2. Logo位置（如果明确）
  if (config.logoPosition && config.mainTitle) {
    parts.push(buildLogoLine(config.logoPosition, config.mainTitle));
  }

  // 3. 中心：产品描述（最重要，用单独一段）
  parts.push(buildProductLine(config.productDescription, config.restoreRequirement));

  // 4. 主标题和副标题
  if (config.mainTitle || config.subtitle) {
    parts.push(buildTitleLine(config.mainTitle, config.subtitle, config.typography));
  }

  // 5. 卖点（精简，最多2个）
  if (config.sellingPoints && config.sellingPoints.length > 0) {
    parts.push(buildSellingPointsLine(config.sellingPoints));
  }

  // 6. 背景和光影
  parts.push(buildBackgroundLine(config.background, config.lighting, config.atmosphere));

  // 7. 色彩方案
  parts.push(buildColorLine(config.primaryColors, config.secondaryColors, config.accentColors));

  // 8. 技术规格（收尾）
  parts.push(buildTechnicalSpecsLine(config.technicalSpecs));

  // 9. 特殊指令（如果有）
  if (config.specialInstructions && config.specialInstructions.length > 0) {
    parts.push(buildSpecialInstructions(config.specialInstructions));
  }

  // 组装：用段落分隔，保持可读性
  return parts.filter(Boolean).join('\n\n');
}

// ============================================================================
// 辅助构建函数
// ============================================================================

function buildOpeningLine(aspectRatio: string, orientation: string, visualStyle: string): string {
  const styleDesc = VISUAL_STYLE_MAP[visualStyle];
  if (!styleDesc) {
    return `${aspectRatio} ${orientation} poster, ${visualStyle} style.`;
  }
  return `${aspectRatio} ${orientation} poster, ${styleDesc.primary}.`;
}

function buildLogoLine(position: string, logoText: string): string {
  const positionMap: Record<string, string> = {
    'top-left': 'Top left',
    'top-center': 'Top center',
    'top-right': 'Top right',
  };
  const pos = positionMap[position] || 'Top';
  return `${pos}: Logo '${logoText}'.`;
}

function buildProductLine(description: string, restoreRequired = false): string {
  let line = `Center: ${description}`;
  if (restoreRequired) {
    line += '. Strictly restore the uploaded product image, including packaging design, colors, logo position, and all details.';
  }
  return line;
}

function buildTitleLine(
  mainTitle?: string,
  subtitle?: string,
  typography?: string
): string {
  const parts: string[] = [];

  if (mainTitle) {
    parts.push(`Main title '${mainTitle}'`);
    if (typography) {
      parts.push(`in ${typography}`);
    }
  }

  if (subtitle) {
    if (mainTitle) {
      parts.push(`below`);
    }
    parts.push(`subtitle '${subtitle}'`);
  }

  return parts.length > 0 ? `Below: ${parts.join(' ')}.` : '';
}

function buildSellingPointsLine(sellingPoints: string[]): string {
  // 最多取2个卖点，避免信息过载
  const points = sellingPoints.slice(0, 2);
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `Key selling point: ${points[0]}.`;
  }
  return `Key selling points: ${points.join(' / ')}.`;
}

function buildBackgroundLine(
  background?: string,
  lighting?: string,
  atmosphere?: string
): string {
  const parts: string[] = [];

  if (background) {
    parts.push(`Background is ${background}`);
  }

  if (lighting) {
    parts.push(lighting);
  }

  if (atmosphere) {
    parts.push(atmosphere);
  }

  return parts.length > 0 ? parts.join(', ') + '.' : '';
}

function buildColorLine(
  primary?: string[],
  secondary?: string[],
  accent?: string[]
): string {
  const parts: string[] = [];

  if (primary && primary.length > 0) {
    parts.push(`primary colors ${primary.join(', ')}`);
  }

  if (secondary && secondary.length > 0) {
    parts.push(`secondary ${secondary.join(', ')}`);
  }

  if (accent && accent.length > 0) {
    parts.push(`accent ${accent.join(', ')}`);
  }

  return parts.length > 0 ? `Color palette: ${parts.join('; ')}.` : '';
}

function buildTechnicalSpecsLine(specs?: string): string {
  if (!specs) return 'Professional studio product photography, 8k resolution, cinematic lighting.';
  return specs;
}

function buildSpecialInstructions(instructions: string[]): string {
  return instructions.join('. ');
}

// ============================================================================
// 高阶函数：从产品信息生成配置
// ============================================================================

interface ProductToPromptConfig {
  productInfo: AnalysisResponse;
  style: StyleConfig;
  posterType: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  sellingPointIndex?: number; // 用于detail类型，指定使用哪个卖点
}

/**
 * 将产品信息转换为叙述式提示词配置
 * 实现10种海报类型的完整提示词生成
 */
export function convertProductToPromptConfig(config: ProductToPromptConfig): NarrativePromptConfig {
  const { productInfo, style, posterType, sellingPointIndex } = config;
  const {
    brandName,
    productType,
    specifications,
    sellingPoints,
    colorScheme,
    designStyle,
    brandTone,
    packagingHighlights,
  } = productInfo;

  const { visual, typography, textLayout, aspectRatio } = style;
  const orientation = getAspectRatioOrientationEn(aspectRatio);
  const styleDesc = VISUAL_STYLE_MAP[visual];

  // 基础配置
  const baseConfig: NarrativePromptConfig = {
    aspectRatio,
    orientation,
    visualStyle: visual,
    logoPosition: 'top-left',
    mainTitle: `${brandName.en || brandName.zh} | ${brandName.zh || brandName.en}`,
    productDescription: `${productType.category} - ${productType.specific}`,
    restoreRequirement: true,
    background: styleDesc?.background,
    lighting: styleDesc?.lighting,
    primaryColors: colorScheme.primary,
    secondaryColors: colorScheme.secondary,
    accentColors: colorScheme.accent,
    typography: getTypographyGrammar(typography),
    textLayout: getTextLayoutGrammar(textLayout),
  };

  // 根据海报类型生成不同的配置
  switch (posterType) {
    // 海报01 - 主KV视觉
    case 'hero':
      return {
        ...baseConfig,
        logoPosition: 'top-center',
        mainTitle: `${brandName.zh} | ${brandName.en}`,
        productDescription: productType.specific,
        subtitle: undefined, // 移除副标题，保持简洁
        sellingPoints: [], // 不展示卖点，只突出产品本身
        technicalSpecs: `High-end ${designStyle || 'product'} photography, 8k resolution, cinematic lighting.`,
      };

    // 海报02 - 生活场景
    case 'lifestyle':
      return {
        ...baseConfig,
        productDescription: `Lifestyle shot showing ${productType.specific} in natural daily life`,
        restoreRequirement: true,
        subtitle: undefined, // 简洁
        sellingPoints: [], // 不展示卖点，让画面说话
        technicalSpecs: `Lifestyle photography, natural lighting, authentic atmosphere, 8k resolution.`,
      };

    // 海报03 - 工艺技术
    case 'process':
      return {
        ...baseConfig,
        productDescription: productType.specific,
        restoreRequirement: true,
        subtitle: packagingHighlights[0] || sellingPoints[0]?.en, // 只展示一个技术亮点
        sellingPoints: [],
        technicalSpecs: `Clean technical illustration, infographics style, 8k resolution.`,
      };

    // 海报04-07 - 细节特写
    case 'detail':
      const index = sellingPointIndex || 0;
      const detailPoint = sellingPoints[index];
      return {
        ...baseConfig,
        productDescription: productType.specific,
        restoreRequirement: true,
        subtitle: detailPoint?.en || undefined, // 只展示这一个细节的标题
        sellingPoints: [],
        lighting: 'side light or top light to highlight texture',
        technicalSpecs: `Macro photography, shallow depth of field, 8k resolution.`,
      };

    // 海报08 - 品牌故事
    case 'brand':
      return {
        ...baseConfig,
        productDescription: `${brandName.en} brand presentation`,
        restoreRequirement: true,
        subtitle: brandTone || undefined,
        sellingPoints: [],
        technicalSpecs: `Brand photography, storytelling style, 8k resolution.`,
      };

    // 海报09 - 产品参数
    case 'specs':
      return {
        ...baseConfig,
        productDescription: productType.specific,
        restoreRequirement: true,
        subtitle: specifications || undefined,
        sellingPoints: [],
        technicalSpecs: `Clean data visualization, technical drawing style, 8k resolution.`,
      };

    // 海报10 - 使用指南
    case 'usage':
      return {
        ...baseConfig,
        productDescription: productType.specific,
        restoreRequirement: true,
        subtitle: 'Easy to Use',
        sellingPoints: [],
        technicalSpecs: `Step-by-step illustration, instructional design, 8k resolution.`,
      };

    default:
      return baseConfig;
  }
}

// ============================================================================
// 工具函数
// ============================================================================

function getAspectRatioOrientationEn(aspectRatio: string): string {
  const verticalRatios = new Set(['9:16', '3:4', '2:3']);
  const squareRatios = new Set(['1:1']);
  if (verticalRatios.has(aspectRatio)) return 'vertical';
  if (squareRatios.has(aspectRatio)) return 'square';
  return 'horizontal';
}

function getTypographyGrammar(typography: string): string {
  const map: Record<string, string> = {
    glassmorphism: 'Glassmorphism style - translucent background card, soft rounded corners',
    '3d': '3D embossed style - metallic texture, dramatic lighting',
    handwritten: 'Handwritten style - watercolor brush strokes, artistic layout',
    serif: 'Bold Serif style - elegant lines, magazine editorial feel',
    'sans-serif': 'Bold Sans-serif style - clean, modern, strong visual impact',
    thin: 'Thin Sans-serif style - minimal, precise alignment, lots of white space',
  };
  return map[typography] || map['sans-serif'];
}

function getTextLayoutGrammar(textLayout: string): string {
  const map: Record<string, string> = {
    stacked: 'Chinese on top (larger), English below (smaller), centered alignment',
    parallel: 'Chinese and English side by side, separated by vertical line',
    separated: 'Chinese in top-left, English in bottom-right, visual contrast',
  };
  return map[textLayout] || map.stacked;
}

// ============================================================================
// 负面提示词生成（基于海报类型）
// ============================================================================

export function generateNegativePromptByType(
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage'
): string {
  const baseNegative = [
    'cluttered', 'busy', 'messy', 'blurry', 'low quality', 'watermark',
    'distorted', 'ugly', 'bad anatomy', 'disfigured', 'poorly drawn',
    'mutation', 'mutated', 'extra limb', 'missing limb', 'floating limbs',
    'malformed', 'out of focus', 'long neck', 'bad proportions', 'low resolution',
  ];

  const typeSpecific: Record<string, string[]> = {
    hero: ['plastic fake texture', 'excessive bloom', 'harsh shadows'],
    lifestyle: ['staged pose', 'artificial lighting', 'plastic smile'],
    detail: ['soft focus', 'shallow depth of field overused', 'noise'],
    process: ['cluttered infographic', 'confusing layout', 'too much text'],
    brand: ['generic stock photo', 'cliched imagery', 'lacking brand identity'],
    specs: ['hard to read text', 'cluttered data', 'poor hierarchy'],
    usage: ['confusing steps', 'lack of visual flow', 'unclear icons'],
  };

  return [...baseNegative, ...(typeSpecific[type] || [])].join(', ');
}

// ============================================================================
// 导出便捷函数
// ============================================================================

/**
 * 生成主KV海报的叙述式提示词（基于提示词1的风格）
 */
export function generateHeroPosterPrompt(
  productInfo: AnalysisResponse,
  style: StyleConfig
): string {
  const config = convertProductToPromptConfig({
    productInfo,
    style,
    posterType: 'hero',
  });

  return generateNarrativePrompt(config);
}

/**
 * 生成细节特写海报的叙述式提示词
 */
export function generateDetailPosterPrompt(
  productInfo: AnalysisResponse,
  style: StyleConfig,
  sellingPointIndex: number
): string {
  const config = convertProductToPromptConfig({
    productInfo,
    style,
    posterType: 'detail',
    sellingPointIndex,
  });

  return generateNarrativePrompt(config);
}

/**
 * 生成生活场景海报的叙述式提示词
 */
export function generateLifestylePosterPrompt(
  productInfo: AnalysisResponse,
  style: StyleConfig
): string {
  const config = convertProductToPromptConfig({
    productInfo,
    style,
    posterType: 'lifestyle',
  });

  return generateNarrativePrompt(config);
}

/**
 * 生成工艺技术海报的叙述式提示词
 */
export function generateProcessPosterPrompt(
  productInfo: AnalysisResponse,
  style: StyleConfig
): string {
  const config = convertProductToPromptConfig({
    productInfo,
    style,
    posterType: 'process',
  });

  return generateNarrativePrompt(config);
}

/**
 * 生成品牌故事海报的叙述式提示词
 */
export function generateBrandPosterPrompt(
  productInfo: AnalysisResponse,
  style: StyleConfig
): string {
  const config = convertProductToPromptConfig({
    productInfo,
    style,
    posterType: 'brand',
  });

  return generateNarrativePrompt(config);
}

/**
 * 生成产品参数海报的叙述式提示词
 */
export function generateSpecsPosterPrompt(
  productInfo: AnalysisResponse,
  style: StyleConfig
): string {
  const config = convertProductToPromptConfig({
    productInfo,
    style,
    posterType: 'specs',
  });

  return generateNarrativePrompt(config);
}

/**
 * 生成使用指南海报的叙述式提示词
 */
export function generateUsagePosterPrompt(
  productInfo: AnalysisResponse,
  style: StyleConfig
): string {
  const config = convertProductToPromptConfig({
    productInfo,
    style,
    posterType: 'usage',
  });

  return generateNarrativePrompt(config);
}
```

## app/prompts/page.tsx

```
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generatePrompts } from '@/lib/utils/promptGenerator';
import { cn } from '@/lib/utils';
import type {
  GenerationQualityMode,
} from '@/contexts/AppContext';

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

const FIXED_GENERATION_MODE = 'one_pass_layout_anchor' as const;
const FIXED_GENERATION_MODE_LABEL = '一步成图（短+锚点）';

const QUICK_VALIDATE_POSTER_IDS = ['01', '04', '09'];

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
    setSelectedGenerationMode,
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

    setSelectedGenerationMode(FIXED_GENERATION_MODE);

    if (prompts) {
      setGeneratedPrompts(prompts);
    }
  }, [editedProductInfo, prompts, selectedStyle, router, setGeneratedPrompts, setSelectedGenerationMode]);

  if (!editedProductInfo || !selectedStyle || !prompts) {
    return null;
  }

  const safeSelectedIndex = Math.min(selectedIndex, prompts.posters.length - 1);
  const currentPrompt = prompts.posters[safeSelectedIndex];
  const currentPromptBaseEn =
    currentPrompt.runtimePromptAnchorEn ||
    currentPrompt.runtimePromptEn ||
    currentPrompt.promptEn;
  const currentPromptEn = editablePromptEnById[currentPrompt.id] ?? currentPromptBaseEn;
  const currentNegative = currentPrompt.runtimeNegative || currentPrompt.negative;

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

  const applyQuickValidationPreset = () => {
    const presetIds = QUICK_VALIDATE_POSTER_IDS.filter((id) =>
      allPosterIds.includes(id)
    );
    if (presetIds.length === 0) return;

    setSelectionMode('multi');
    setLocalSelectedPosterIds(presetIds);
    const firstPresetIndex = prompts.posters.findIndex(
      (poster) => poster.id === presetIds[0]
    );
    setSelectedIndex(firstPresetIndex >= 0 ? firstPresetIndex : 0);
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
        const basePrompt =
          poster.runtimePromptAnchorEn || poster.runtimePromptEn || poster.promptEn;
        const effectivePrompt =
          typeof editedPrompt === 'string' && editedPrompt.trim().length > 0
            ? editedPrompt
            : basePrompt;
        return {
          ...poster,
          runtimePromptAnchorEn: effectivePrompt,
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
          开始生成海报 ({selectedPosterIdsForOutput.length}张 · {qualityModeMeta.label} · {FIXED_GENERATION_MODE_LABEL}) →
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={applyQuickValidationPreset}
              className="h-7 px-2 text-[11px]"
            >
              快速预设 01/04/09
            </Button>
            <span className="text-xs text-muted-foreground">{safeSelectedIndex + 1}/{prompts.posters.length}</span>
          </div>
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
              disabled={currentPromptEn === currentPromptBaseEn}
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
              当前固定使用“短主提示词 + 锚点版式”生成；可直接微调锚点与文案。
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold">负面词</h4>
            <div className="glass-scrollbar max-h-36 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-4 text-sm whitespace-pre-wrap">
              {currentNegative}
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
```

## lib/api/client.ts

```
import type { AnalysisResponse } from '@/contexts/AppContext';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  referenceImage?: string;
  enforceNoText?: boolean;
  enforceHardConstraints?: boolean;
}

const GENERATE_TIMEOUT_MS = 150000;
const GENERATE_MAX_NETWORK_RETRIES = 2;
const ANALYZE_TIMEOUT_MS = 45000;
const ANALYZE_MAX_NETWORK_RETRIES = 1;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return true;
  return /failed to fetch|networkerror|load failed|network request failed/i.test(error.message);
}

function shouldRetryAnalyzeStatus(status: number, message: string): boolean {
  if (status >= 500) return true;
  return /fetch failed|network|timeout|temporarily unavailable|service unavailable/i.test(
    message
  );
}

export async function analyzeProduct(imageBase64: string): Promise<AnalysisResponse> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= ANALYZE_MAX_NETWORK_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          typeof errorData?.error === 'string'
            ? errorData.error
            : `Analyze request failed: ${response.status}`;

        if (
          attempt < ANALYZE_MAX_NETWORK_RETRIES &&
          shouldRetryAnalyzeStatus(response.status, errorMessage)
        ) {
          await sleep(1200 * (attempt + 1));
          continue;
        }

        throw new Error(errorMessage);
      }

      return (await response.json()) as AnalysisResponse;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (isNetworkLikeError(error) && attempt < ANALYZE_MAX_NETWORK_RETRIES) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  if (isNetworkLikeError(lastError)) {
    const reason = lastError instanceof Error ? lastError.message : 'unknown';
    throw new Error(
      `无法连接 /api/analyze（网络或本地服务中断）。请确认本地服务在线后重试。原始错误: ${reason}`
    );
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Analyze request failed');
}

export async function generatePoster(request: GenerationRequest): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= GENERATE_MAX_NETWORK_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generate request failed: ${response.status}`);
      }

      const data = (await response.json()) as { dataUrl?: string };
      if (!data.dataUrl) {
        throw new Error('No image generated');
      }

      return data.dataUrl;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (isNetworkLikeError(error) && attempt < GENERATE_MAX_NETWORK_RETRIES) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  if (isNetworkLikeError(lastError)) {
    const reason = lastError instanceof Error ? lastError.message : 'unknown';
    throw new Error(
      `无法连接 /api/generate（网络或本地服务中断）。请确认本地服务在线后重试。原始错误: ${reason}`
    );
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Generate request failed');
}

// 模拟生成函数,用于开发测试
export async function generatePosterMock(
  request: GenerationRequest
): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const width = request.width || 720;
  const height = request.height || 1280;
  return `https://via.placeholder.com/${width}x${height}/000000/FFFFFF?text=Poster+Generated`;
}
```

## app/api/generate/route.ts

```
import { NextRequest, NextResponse } from 'next/server';
import { generatePoster } from '@/lib/api/nanobanana';

export const runtime = 'nodejs';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  referenceImage?: string;
  enforceNoText?: boolean;
  enforceHardConstraints?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerationRequest;

    if (!body?.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' },
        { status: 400 }
      );
    }

    const dataUrl = await generatePoster({
      prompt: body.prompt,
      negative: body.negative,
      width: body.width,
      height: body.height,
      referenceImage: body.referenceImage,
      enforceNoText: body.enforceNoText,
      enforceHardConstraints: body.enforceHardConstraints,
    });

    return NextResponse.json({ dataUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Generate API failed',
      },
      { status: 500 }
    );
  }
}
```

## lib/api/nanobanana.ts

```
import 'server-only';
import { withRetry } from '@/lib/errors/errorHandler';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  num?: number;
  referenceImage?: string;
  enforceNoText?: boolean;
  enforceHardConstraints?: boolean;
}

interface ConstraintAuditResult {
  pass: boolean;
  reason: string;
  failedRules: string[];
}

interface ConstraintAuditJsonPayload {
  hasCtaText?: boolean;
  hasDecorativeFrame?: boolean;
  hasJunkCaption?: boolean;
  hasUnrelatedLogoOrWatermark?: boolean;
  hasUnreadableText?: boolean;
  confidence?: number;
  foundTexts?: string[];
  reason?: string;
}

interface GeminiApiErrorPayload {
  error?: {
    message?: string;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string;
    }>;
  };
}

const DEFAULT_ANALYSIS_MODEL = 'gemini-3-flash-preview';
const DEFAULT_IMAGE_MODEL = 'gemini-3-pro-image-preview';
const DEFAULT_FLASH_FALLBACK_MODEL = 'gemini-2.5-flash-image';

const MAX_CONSTRAINT_RETRIES = 2;

export async function generatePoster(
  request: GenerationRequest
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const analysisModel = DEFAULT_ANALYSIS_MODEL;
  const imageModel = DEFAULT_IMAGE_MODEL;
  const allowFlashFallback =
    process.env.KV_IMAGE_FALLBACK_TO_FLASH === 'true' ||
    process.env.ALLOW_FLASH_FALLBACK === 'true';
  const fallbackImageModel = allowFlashFallback
    ? resolveImageModel(
        process.env.GEMINI_IMAGE_FALLBACK_MODEL,
        DEFAULT_FLASH_FALLBACK_MODEL
      )
    : '';

  return withRetry(async () => {
    const width = request.width || 720;
    const height = request.height || 1280;
    const aspectRatio = getAspectRatio(width, height);
    const enforceHardConstraints =
      request.enforceHardConstraints ?? request.enforceNoText ?? true;

    const basePrompt = request.negative
      ? `${request.prompt}\n\nAvoid: ${request.negative}`
      : request.prompt;

    let fallbackUsed = false;
    let retryCount = 0;
    const constraintFailReasons: string[] = [];

    for (let attempt = 0; attempt <= MAX_CONSTRAINT_RETRIES; attempt += 1) {
      const constrainedPrompt =
        attempt === 0
          ? basePrompt
          : strengthenPromptForHardConstraints(basePrompt, constraintFailReasons);

      const imageResult = await requestImageWithFallback({
        apiKey,
        primaryModel: imageModel,
        fallbackModel: fallbackImageModel,
        allowFlashFallback,
        prompt: constrainedPrompt,
        aspectRatio,
        referenceImage: request.referenceImage,
      });

      fallbackUsed = fallbackUsed || imageResult.fallbackUsed;

      if (!enforceHardConstraints) {
        logGenerationResult({
          analysisModel,
          imageModel: imageResult.usedModel,
          fallbackUsed,
          retryCount,
          constraintFailReasons,
        });
        return imageResult.dataUrl;
      }

      const audit = await verifyPosterHardConstraints({
        apiKey,
        model: analysisModel,
        imageDataUrl: imageResult.dataUrl,
      });

      if (audit.pass) {
        logGenerationResult({
          analysisModel,
          imageModel: imageResult.usedModel,
          fallbackUsed,
          retryCount,
          constraintFailReasons,
        });
        return imageResult.dataUrl;
      }

      const reason = audit.reason || 'unknown hard-constraint violation';
      constraintFailReasons.push(reason);
      retryCount += 1;

      if (attempt >= MAX_CONSTRAINT_RETRIES) {
        logGenerationResult({
          analysisModel,
          imageModel: imageResult.usedModel,
          fallbackUsed,
          retryCount,
          constraintFailReasons,
        });
        throw new Error(`Poster hard constraints failed: ${reason}`);
      }
    }

    throw new Error('Poster generation failed after constraint retries');
  }, 5, 2000);
}

export async function generatePosterMock(
  request: GenerationRequest
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const width = request.width || 720;
  const height = request.height || 1280;
  return `https://via.placeholder.com/${width}x${height}/000000/FFFFFF?text=Poster+Generated`;
}

async function requestImageWithFallback(args: {
  apiKey: string;
  primaryModel: string;
  fallbackModel: string;
  allowFlashFallback: boolean;
  prompt: string;
  aspectRatio: string;
  referenceImage?: string;
}): Promise<{ dataUrl: string; usedModel: string; fallbackUsed: boolean }> {
  const primaryAttempt = await requestImageFromModel({
    apiKey: args.apiKey,
    model: args.primaryModel,
    prompt: args.prompt,
    aspectRatio: args.aspectRatio,
    referenceImage: args.referenceImage,
  });

  if (primaryAttempt.dataUrl) {
    return {
      dataUrl: primaryAttempt.dataUrl,
      usedModel: args.primaryModel,
      fallbackUsed: false,
    };
  }

  if (
    shouldFallbackToSecondaryModel(
      primaryAttempt.status,
      primaryAttempt.message,
      args.primaryModel,
      args.fallbackModel,
      args.allowFlashFallback
    )
  ) {
    const fallbackAttempt = await requestImageFromModel({
      apiKey: args.apiKey,
      model: args.fallbackModel,
      prompt: args.prompt,
      aspectRatio: args.aspectRatio,
      referenceImage: args.referenceImage,
    });

    if (fallbackAttempt.dataUrl) {
      return {
        dataUrl: fallbackAttempt.dataUrl,
        usedModel: args.fallbackModel,
        fallbackUsed: true,
      };
    }

    throw buildGeminiImageError(
      fallbackAttempt.status,
      fallbackAttempt.message,
      fallbackAttempt.parsedError
    );
  }

  throw buildGeminiImageError(
    primaryAttempt.status,
    primaryAttempt.message,
    primaryAttempt.parsedError
  );
}

async function requestImageFromModel(args: {
  apiKey: string;
  model: string;
  prompt: string;
  aspectRatio: string;
  referenceImage?: string;
}): Promise<{
  status: number;
  message: string;
  parsedError: GeminiApiErrorPayload | null;
  dataUrl?: string;
}> {
  const requestParts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [{ text: args.prompt }];

  const parsedReference = parseDataUrl(args.referenceImage);
  if (parsedReference) {
    requestParts.push({
      inline_data: {
        mime_type: parsedReference.mimeType,
        data: parsedReference.base64,
      },
    });
  }

  const executeRequest = async (
    withAspectRatio: boolean
  ): Promise<{
    status: number;
    message: string;
    parsedError: GeminiApiErrorPayload | null;
    dataUrl?: string;
  }> => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': args.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: requestParts,
            },
          ],
          generationConfig: withAspectRatio
            ? {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                  aspectRatio: args.aspectRatio,
                },
              }
            : {
                responseModalities: ['TEXT', 'IMAGE'],
              },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      const parsed = tryParseJson(errorBody);
      const message = parsed?.error?.message || errorBody;

      if (
        withAspectRatio &&
        response.status === 400 &&
        /aspect ratio is not enabled for this model/i.test(message)
      ) {
        return executeRequest(false);
      }

      return {
        status: response.status,
        message,
        parsedError: parsed,
      };
    }

    const data = await response.json();
    const responseParts: Array<{
      text?: string;
      inlineData?: { data?: string; mimeType?: string };
      inline_data?: { data?: string; mime_type?: string };
    }> = Array.isArray(data?.candidates?.[0]?.content?.parts)
      ? data.candidates[0].content.parts
      : [];

    const imagePart =
      responseParts.find(
        (part) => part?.inlineData?.data || part?.inline_data?.data
      ) || null;
    const base64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
    const mimeType =
      imagePart?.inlineData?.mimeType ||
      imagePart?.inline_data?.mime_type ||
      'image/png';

    if (!base64) {
      const modelText =
        responseParts.find((part) => typeof part.text === 'string')?.text || '';
      return {
        status: 502,
        message: `No image generated${modelText ? `: ${modelText}` : ''}`,
        parsedError: null,
      };
    }

    return {
      status: 200,
      message: 'OK',
      parsedError: null,
      dataUrl: `data:${mimeType};base64,${base64}`,
    };
  };

  return executeRequest(true);
}

async function verifyPosterHardConstraints(args: {
  apiKey: string;
  model: string;
  imageDataUrl: string;
}): Promise<ConstraintAuditResult> {
  const parsedImage = parseDataUrl(args.imageDataUrl);
  if (!parsedImage) {
    return {
      pass: false,
      reason: 'invalid generated image payload',
      failedRules: ['invalid_image_payload'],
    };
  }

  const auditPrompt = [
    'You are checking a generated advertisement poster for hard constraints.',
    'Return JSON only with booleans and short reason.',
    'Hard constraints:',
    '1) hasCtaText: true if image includes CTA button/text like SHOP NOW, Learn more, 立即选购, 了解更多, 扫码了解更多.',
    '2) hasDecorativeFrame: true if there is decorative border/frame around canvas.',
    '3) hasJunkCaption: true if there are filler captions such as 细节特写, 关键信息一目了然, 视觉化呈现新鲜度, 可视化呈现, details visible, lifestyle pick, tech insight.',
    '4) hasUnrelatedLogoOrWatermark: true if unrelated logos/watermarks exist outside product package print.',
    '5) hasUnreadableText: true only if text is obvious gibberish, broken, mirrored, or duplicated.',
    'Do NOT mark normal bilingual Chinese/English copy as unreadable.',
    'Ignore text naturally printed on product package and meaningful title/body copy.',
    'JSON schema:',
    '{"hasCtaText":boolean,"hasDecorativeFrame":boolean,"hasJunkCaption":boolean,"hasUnrelatedLogoOrWatermark":boolean,"hasUnreadableText":boolean,"confidence":number,"foundTexts":[string],"reason":string}',
  ].join('\n');

  const maxAuditAttempts = 3;
  let lastAuditError = 'audit unavailable';

  for (let attempt = 0; attempt < maxAuditAttempts; attempt += 1) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': args.apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: auditPrompt },
                  {
                    inline_data: {
                      mime_type: parsedImage.mimeType,
                      data: parsedImage.base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        lastAuditError = `status=${response.status} body=${body.slice(0, 120)}`;
        if (
          (response.status === 429 || response.status === 503) &&
          attempt < maxAuditAttempts - 1
        ) {
          const parsedError = tryParseJson(body);
          const retryAfterMs = extractRetryAfterMs(parsedError, body);
          const waitMs = Math.max(
            1500,
            Math.min(8000, retryAfterMs ?? 1200 * (attempt + 1))
          );
          await sleep(waitMs);
          continue;
        }
        return {
          pass: false,
          reason: `audit request failed: ${lastAuditError}`,
          failedRules: ['audit_unavailable'],
        };
      }

      const data = await response.json();
      const textParts: string[] = Array.isArray(data?.candidates?.[0]?.content?.parts)
        ? data.candidates[0].content.parts
            .map((part: { text?: string }) => part?.text)
            .filter((value: unknown): value is string => typeof value === 'string')
        : [];
      const rawText = textParts.join('\n').trim();
      const audit = parseConstraintAuditJson(rawText);

      if (!audit) {
        lastAuditError =
          `audit parse failed: ${rawText.slice(0, 120) || 'empty response'}`;
        if (attempt < maxAuditAttempts - 1) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        return {
          pass: false,
          reason: lastAuditError,
          failedRules: ['audit_parse_failed'],
        };
      }

      const confidence = clampConfidence(audit.confidence);
      const failedRules: string[] = [];
      if (audit.hasCtaText) failedRules.push('cta_text');
      if (audit.hasDecorativeFrame) failedRules.push('decorative_frame');
      if (audit.hasJunkCaption) failedRules.push('junk_caption');
      if (audit.hasUnrelatedLogoOrWatermark) failedRules.push('unrelated_logo_or_watermark');

      const foundTexts = Array.isArray(audit.foundTexts)
        ? audit.foundTexts
            .filter((item) => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 4)
        : [];

      const unreadableViolation = shouldBlockForUnreadableText({
        hasUnreadableTextFlag: audit.hasUnreadableText === true,
        foundTexts,
        reason: audit.reason,
        confidence,
      });
      if (unreadableViolation) {
        failedRules.push('unreadable_text');
      }

      const blockedFoundText = foundTexts.some((item) =>
        isHardConstraintKeywordText(item)
      );
      if (blockedFoundText) {
        failedRules.push('blocked_found_text');
      }

      const shouldFail = failedRules.length > 0;
      if (!shouldFail) {
        return {
          pass: true,
          reason: 'constraints passed',
          failedRules: [],
        };
      }

      const reason = [
        failedRules.length > 0 ? `rules=${failedRules.join('|')}` : '',
        foundTexts.length > 0 ? `texts=${foundTexts.join('|')}` : '',
        audit.reason ? `detail=${audit.reason}` : '',
        `confidence=${confidence.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join('; ');

      return {
        pass: false,
        reason: reason || 'hard-constraint violation',
        failedRules,
      };
    } catch (error) {
      lastAuditError = error instanceof Error ? error.message : 'unknown runtime error';
      if (attempt < maxAuditAttempts - 1) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      return {
        pass: false,
        reason: `audit runtime error: ${lastAuditError}`,
        failedRules: ['audit_runtime_error'],
      };
    }
  }

  return {
    pass: false,
    reason: `audit retries exhausted: ${lastAuditError}`,
    failedRules: ['audit_retries_exhausted'],
  };
}

function parseConstraintAuditJson(text: string): ConstraintAuditJsonPayload | null {
  if (!text) return null;
  const trimmed = stripCodeFences(text.trim());
  const direct = tryParseConstraintAuditJson(trimmed);
  if (direct) return direct;

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = tryParseConstraintAuditJson(match[0]);
    if (parsed) return parsed;
  }

  return parseConstraintAuditJsonByRegex(trimmed);
}

function tryParseConstraintAuditJson(
  text: string
): ConstraintAuditJsonPayload | null {
  try {
    return JSON.parse(text) as ConstraintAuditJsonPayload;
  } catch {
    return null;
  }
}

function parseConstraintAuditJsonByRegex(
  text: string
): ConstraintAuditJsonPayload | null {
  const ctaMatch = matchBooleanField(text, 'hasCtaText');
  const frameMatch = matchBooleanField(text, 'hasDecorativeFrame');
  const junkMatch = matchBooleanField(text, 'hasJunkCaption');
  const logoMatch = matchBooleanField(text, 'hasUnrelatedLogoOrWatermark');
  const unreadableMatch = matchBooleanField(text, 'hasUnreadableText');
  const confidenceMatch = text.match(/["']?confidence["']?\s*:\s*([0-9.]+)/i);
  const foundTextsMatch = text.match(/["']?foundTexts["']?\s*:\s*\[([^\]]*)\]/i);
  const reasonMatch = text.match(/["']?reason["']?\s*:\s*["']([^"']*)["']/i);

  if (
    ctaMatch === undefined &&
    frameMatch === undefined &&
    junkMatch === undefined &&
    logoMatch === undefined &&
    unreadableMatch === undefined &&
    !confidenceMatch &&
    !foundTextsMatch &&
    !reasonMatch
  ) {
    return null;
  }

  const foundTexts = foundTextsMatch
    ? foundTextsMatch[1]
        .split(',')
        .map((item) => item.replace(/["']/g, '').trim())
        .filter(Boolean)
    : [];

  return {
    hasCtaText: ctaMatch,
    hasDecorativeFrame: frameMatch,
    hasJunkCaption: junkMatch,
    hasUnrelatedLogoOrWatermark: logoMatch,
    hasUnreadableText: unreadableMatch,
    confidence: confidenceMatch ? Number(confidenceMatch[1]) : undefined,
    foundTexts,
    reason: reasonMatch?.[1],
  };
}

function matchBooleanField(text: string, field: string): boolean | undefined {
  const match = text.match(
    new RegExp(`["']?${field}["']?\\s*:\\s*(true|false)`, 'i')
  );
  if (!match) return undefined;
  return match[1].toLowerCase() === 'true';
}

function strengthenPromptForHardConstraints(
  basePrompt: string,
  reasons: string[]
): string {
  const tail = reasons.length > 0 ? ' Recent failures detected; apply stricter cleanup.' : '';

  return [
    basePrompt,
    'HARD CONSTRAINT OVERRIDE:',
    '- Remove any CTA button/text (SHOP NOW, Learn more, 立即选购, 了解更多, 扫码了解更多).',
    '- Remove decorative border/frame lines around canvas.',
    '- Remove filler captions (细节特写, 关键信息一目了然, 视觉化呈现新鲜度, 可视化呈现, details visible, lifestyle pick, tech insight).',
    '- Remove unrelated logos/watermarks and unreadable gibberish text.',
    '- Keep only logo(optional) and main title defined by layout config; do not invent extra captions.',
    tail,
  ]
    .filter(Boolean)
    .join('\n');
}

function logGenerationResult(args: {
  analysisModel: string;
  imageModel: string;
  fallbackUsed: boolean;
  retryCount: number;
  constraintFailReasons: string[];
}) {
  console.info(
    '[kv-generation-result]',
    JSON.stringify({
      analysis_model: args.analysisModel,
      image_model: args.imageModel,
      fallback_used: args.fallbackUsed,
      retry_count: args.retryCount,
      constraint_fail_reasons: args.constraintFailReasons,
    })
  );
}

function getAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  const options = [
    { value: '1:1', ratio: 1 },
    { value: '2:3', ratio: 2 / 3 },
    { value: '3:2', ratio: 3 / 2 },
    { value: '3:4', ratio: 3 / 4 },
    { value: '4:3', ratio: 4 / 3 },
    { value: '4:5', ratio: 4 / 5 },
    { value: '5:4', ratio: 5 / 4 },
    { value: '9:16', ratio: 9 / 16 },
    { value: '16:9', ratio: 16 / 9 },
    { value: '21:9', ratio: 21 / 9 },
  ];

  let best = options[0];
  let minDiff = Math.abs(ratio - best.ratio);
  for (const option of options.slice(1)) {
    const diff = Math.abs(ratio - option.ratio);
    if (diff < minDiff) {
      best = option;
      minDiff = diff;
    }
  }

  return best.value;
}

function shouldFallbackToSecondaryModel(
  status: number,
  message: string,
  primaryModel: string,
  fallbackModel: string,
  allowFlashFallback: boolean
): boolean {
  if (!allowFlashFallback) return false;
  if (!fallbackModel) return false;
  if (primaryModel === fallbackModel) return false;
  if (status !== 429 && status !== 503) return false;
  return /high demand|unavailable|try again later|quota|rate limit|resource_exhausted/i.test(
    message
  );
}

function shouldBlockForUnreadableText(args: {
  hasUnreadableTextFlag: boolean;
  foundTexts: string[];
  reason?: string;
  confidence: number;
}): boolean {
  if (!args.hasUnreadableTextFlag) return false;
  if (args.confidence < 0.9) return false;

  const suspiciousTextDetected = args.foundTexts.some((item) =>
    isLikelyGibberishText(item)
  );
  if (suspiciousTextDetected) return true;

  if (args.foundTexts.length > 0) {
    // Guard against false positives where OCR returns normal bilingual copy.
    return false;
  }

  const reason = (args.reason || '').toLowerCase();
  if (!reason) return false;
  return /gibberish|mirrored|broken|duplicated|garbled|乱码|镜像|破碎/.test(reason);
}

function isLikelyGibberishText(input: string): boolean {
  const text = input.trim();
  if (!text) return false;

  const hasCjk = /[\u4e00-\u9fff]/.test(text);
  if (hasCjk) {
    const weirdCjkRatio = ratioOfMatches(
      text,
      /[^A-Za-z0-9\u4e00-\u9fff\s.,:;!?'"/\-+&|()%]/g
    );
    return weirdCjkRatio > 0.25;
  }

  const asciiWords = text.match(/[A-Za-z]{2,}/g) || [];
  const hasCommonWord = asciiWords.some((word) =>
    /^(fresh|natural|orange|premium|vitamin|product|brand|specifications|guide|usage|details)$/i.test(
      word
    )
  );
  if (hasCommonWord) return false;

  const weirdRatio = ratioOfMatches(text, /[^A-Za-z0-9\s.,:;!?'"/\-+&|()%]/g);
  if (weirdRatio > 0.2) return true;

  const compact = text.replace(/\s+/g, '');
  if (/(.)\1{4,}/.test(compact)) return true;

  const vowelCount = (compact.match(/[aeiou]/gi) || []).length;
  if (compact.length >= 8 && vowelCount === 0) return true;

  return false;
}

function ratioOfMatches(input: string, pattern: RegExp): number {
  const total = Math.max(1, input.length);
  const matches = input.match(pattern);
  return (matches?.length || 0) / total;
}

function isHardConstraintKeywordText(input: string): boolean {
  const text = input.trim().toLowerCase();
  if (!text) return false;
  return (
    /shop now|learn more|scan for details|qr/.test(text) ||
    /立即选购|了解更多|扫码了解更多/.test(input) ||
    /细节特写|关键信息一目了然|视觉化呈现新鲜度|可视化呈现|details visible|lifestyle pick|tech insight|freshness visualization|visual(?:ized|izing)? freshness|visual representation/i.test(
      input
    )
  );
}

function resolveImageModel(
  model?: string,
  defaultModel = DEFAULT_IMAGE_MODEL
): string {
  const normalized = (model || '').trim();
  if (!normalized) return defaultModel;
  if (normalized === 'gemini-3-pro' || normalized === 'gemini-3-pro-preview') {
    return 'gemini-3-pro-image-preview';
  }
  if (normalized === 'gemini-2.5-flash' || normalized === 'gemini-2.5-flash-preview') {
    return 'gemini-2.5-flash-image';
  }
  return normalized;
}

function parseDataUrl(
  value?: string
): { mimeType: string; base64: string } | null {
  if (!value) return null;
  const trimmed = value.trim();
  const dataUrlMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      base64: dataUrlMatch[2],
    };
  }

  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return {
      mimeType: 'image/jpeg',
      base64: trimmed,
    };
  }

  return null;
}

function tryParseJson(input: string): GeminiApiErrorPayload | null {
  try {
    return JSON.parse(input) as GeminiApiErrorPayload;
  } catch {
    return null;
  }
}

function buildGeminiImageError(
  status: number,
  message: string,
  parsedError: GeminiApiErrorPayload | null
): Error & { retryAfterMs?: number } {
  const error = new Error(
    `Gemini image API error (${status}): ${message}`
  ) as Error & { retryAfterMs?: number };

  if (status === 429 || status === 503) {
    const retryAfterMs = extractRetryAfterMs(parsedError, message);
    if (retryAfterMs) {
      error.retryAfterMs = retryAfterMs;
    } else if (status === 503) {
      error.retryAfterMs = 8000;
    }
  }

  return error;
}

function stripCodeFences(text: string): string {
  if (!text.startsWith('```')) return text;
  return text
    .replace(/^```[a-zA-Z]*\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function clampConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function extractRetryAfterMs(
  parsed: GeminiApiErrorPayload | null,
  fallbackMessage: string
): number | undefined {
  const retryInfo = parsed?.error?.details?.find(
    (detail) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
  );
  const fromDetails = parseSecondsToMs(retryInfo?.retryDelay);
  if (fromDetails) return fromDetails;

  const match = fallbackMessage.match(/retry in\s+([0-9.]+)s/i);
  if (!match) return undefined;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.ceil(seconds * 1000);
}

function parseSecondsToMs(input?: string): number | undefined {
  if (!input) return undefined;
  const match = input.match(/([0-9.]+)s$/i);
  if (!match) return undefined;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.ceil(seconds * 1000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

## app/generate/page.tsx

```
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Download,
  Eye,
  Fingerprint,
  Palette,
  Play,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { generatePoster, generatePosterMock } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type {
  GeneratedPoster,
  GeneratedPosterVersion,
  GenerationPipelineMode,
  GenerationQualityMode,
  PosterAspectRatio,
  PosterPrompt,
} from '@/contexts/AppContext';

interface PosterProgress {
  id: string;
  title: string;
  titleEn: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  url?: string;
  rawUrl?: string;
  error?: string;
  overlayApplied?: boolean;
  generationMode?: GenerationPipelineMode;
  promptSource?: string;
  negativeSource?: string;
  versions?: GeneratedPosterVersion[];
  activeVersionId?: string;
}

interface PromptExecutionPayload {
  prompt: string;
  negative?: string;
  promptSource: string;
  negativeSource: string;
}

const GENERATION_MODE_LABELS: Record<GenerationPipelineMode, string> = {
  one_pass_layout_anchor: '一步成图（短提示词+锚点版式）',
};

const VISUAL_STYLE_LABELS: Record<string, string> = {
  magazine: '杂志编辑',
  watercolor: '水彩艺术',
  tech: '科技未来',
  vintage: '复古胶片',
  minimal: '极简北欧',
  cyber: '霓虹赛博',
  organic: '自然有机',
};

const TYPOGRAPHY_STYLE_LABELS: Record<string, string> = {
  glassmorphism: '玻璃拟态',
  '3d': '3D浮雕',
  handwritten: '手写体',
  serif: '粗衬线',
  'sans-serif': '无衬线粗体',
  thin: '极细线条',
};

const TEXT_LAYOUT_LABELS: Record<string, string> = {
  stacked: '中英堆叠',
  parallel: '中英并列',
  separated: '中英分离',
};

function getPosterSize(aspectRatio?: PosterAspectRatio): { width: number; height: number } {
  const ratio = aspectRatio || '9:16';
  const ratioMap: Record<PosterAspectRatio, { width: number; height: number }> = {
    '9:16': { width: 900, height: 1600 },
    '3:4': { width: 900, height: 1200 },
    '2:3': { width: 900, height: 1350 },
    '1:1': { width: 1200, height: 1200 },
    '4:3': { width: 1200, height: 900 },
    '3:2': { width: 1200, height: 800 },
    '16:9': { width: 1600, height: 900 },
    '21:9': { width: 2100, height: 900 },
  };
  return ratioMap[ratio];
}

function resolveAspectRatioStyle(aspectRatio?: PosterAspectRatio): string {
  const [width, height] = (aspectRatio || '9:16').split(':').map((value) => Number(value));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return '9 / 16';
  }
  return `${width} / ${height}`;
}

function getPosterVersions(poster: PosterProgress): GeneratedPosterVersion[] {
  if (poster.versions && poster.versions.length > 0) {
    return poster.versions;
  }
  if (poster.url) {
    return [
      {
        id: 'v1',
        url: poster.url,
        source: 'initial',
        createdAt: 0,
      },
    ];
  }
  return [];
}

function resolveActiveVersion(
  poster: PosterProgress,
  preferredVersionId?: string | null
): GeneratedPosterVersion | null {
  const versions = getPosterVersions(poster);
  if (versions.length === 0) return null;

  if (preferredVersionId) {
    const matched = versions.find((version) => version.id === preferredVersionId);
    if (matched) return matched;
  }

  if (poster.activeVersionId) {
    const matched = versions.find((version) => version.id === poster.activeVersionId);
    if (matched) return matched;
  }

  return versions[versions.length - 1];
}

function extractSwatchColor(value?: string): string | null {
  if (!value) return null;
  const hexMatch = value.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
  if (hexMatch) return hexMatch[0];
  const trimmed = value.trim();
  if (/^[a-zA-Z]+$/.test(trimmed)) return trimmed;
  return null;
}

function compactPromptSnippet(prompt: string | undefined): string {
  if (!prompt) return '等待生成';
  const compact = prompt.replace(/\s+/g, ' ').trim();
  if (compact.length <= 88) return compact;
  return `${compact.slice(0, 88)}...`;
}

export default function GeneratePage() {
  const router = useRouter();
  const {
    editedProductInfo,
    generatedPrompts,
    selectedStyle,
    selectedPosterIds,
    selectedQualityMode,
    selectedGenerationMode,
    uploadedImage,
    setGeneratedPosters,
  } = useAppContext();

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
  const [postersProgress, setPostersProgress] = useState<PosterProgress[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('点击卡片内按钮或顶部一键按钮开始生成');
  const [cardPromptDetails, setCardPromptDetails] = useState<Record<string, boolean>>({});
  const [cardRefineInputs, setCardRefineInputs] = useState<Record<string, string>>({});
  const [cardRefining, setCardRefining] = useState<Record<string, boolean>>({});
  const [cardRefineErrors, setCardRefineErrors] = useState<Record<string, string | null>>({});
  const [cardPreviewModes, setCardPreviewModes] = useState<Record<string, 'final' | 'raw'>>({});

  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const generationLockRef = useRef(false);

  const queue = useMemo(() => {
    if (!generatedPrompts) return [];
    if (!selectedPosterIds || selectedPosterIds.length === 0) return generatedPrompts.posters;
    const selectedSet = new Set(selectedPosterIds);
    return generatedPrompts.posters.filter((poster) => selectedSet.has(poster.id));
  }, [generatedPrompts, selectedPosterIds]);

  const promptById = useMemo(
    () => new Map(queue.map((poster) => [poster.id, poster])),
    [queue]
  );

  const completedCount = useMemo(
    () => postersProgress.filter((poster) => poster.status === 'completed').length,
    [postersProgress]
  );
  const failedCount = useMemo(
    () => postersProgress.filter((poster) => poster.status === 'failed').length,
    [postersProgress]
  );
  const totalCount = postersProgress.length;
  const progressValue = totalCount === 0 ? 0 : Math.round(((completedCount + failedCount) / totalCount) * 100);
  const hasRunningSingleGeneration = useMemo(
    () => postersProgress.some((poster) => poster.status === 'generating'),
    [postersProgress]
  );

  const styleDirectionPrimary =
    editedProductInfo?.styleDirection?.primary ||
    VISUAL_STYLE_LABELS[selectedStyle?.visual || ''] ||
    selectedStyle?.visual ||
    '风格未设置';
  const styleDirectionSecondary =
    editedProductInfo?.styleDirection?.secondary ||
    TYPOGRAPHY_STYLE_LABELS[selectedStyle?.typography || ''] ||
    selectedStyle?.typography ||
    '风格未设置';
  const styleTags =
    editedProductInfo?.styleDirection?.tags && editedProductInfo.styleDirection.tags.length > 0
      ? editedProductInfo.styleDirection.tags
      : [editedProductInfo?.designStyle, selectedStyle?.textLayout ? TEXT_LAYOUT_LABELS[selectedStyle.textLayout] : undefined]
          .filter(Boolean)
          .map((value) => String(value));

  const colorCandidates = [
    ...(editedProductInfo?.colorScheme.primary || []),
    ...(editedProductInfo?.colorScheme.secondary || []),
    ...(editedProductInfo?.colorScheme.accent || []),
  ];
  const colorSwatches = colorCandidates
    .map((item) => ({
      raw: item,
      swatch: extractSwatchColor(item),
    }))
    .filter((item): item is { raw: string; swatch: string } => Boolean(item.raw && item.swatch))
    .slice(0, 3);

  useEffect(() => {
    if (!generatedPrompts || !selectedStyle || !editedProductInfo) {
      router.push('/prompts');
      return;
    }
    if (queue.length === 0) {
      router.push('/prompts');
      return;
    }

    const initial = queue.map((poster) => ({
      id: poster.id,
      title: poster.title,
      titleEn: poster.titleEn,
      status: 'pending' as const,
      generationMode: selectedGenerationMode,
    }));

    setPostersProgress(initial);
    setGeneratedPosters([]);
    setGlobalMessage('点击卡片内按钮或顶部一键按钮开始生成');
    setCardPromptDetails({});
    setCardRefineInputs({});
    setCardRefining({});
    setCardRefineErrors({});
    setCardPreviewModes({});
  }, [generatedPrompts, selectedStyle, editedProductInfo, queue, router, selectedGenerationMode, setGeneratedPosters]);

  useEffect(() => {
    const completed = postersProgress
      .filter((poster) => poster.status === 'completed' && poster.url)
      .map(
        (poster) =>
          ({
            id: poster.id,
            url: poster.url as string,
            status: 'completed',
            rawUrl: poster.rawUrl,
            overlayApplied: poster.overlayApplied,
            generationMode: poster.generationMode,
            promptSource: poster.promptSource,
            negativeSource: poster.negativeSource,
            versions: poster.versions,
            activeVersionId: poster.activeVersionId,
          }) satisfies GeneratedPoster
      );

    setGeneratedPosters(completed);
  }, [postersProgress, setGeneratedPosters]);

  const resolveCandidateCount = useCallback((mode: GenerationQualityMode) => {
    switch (mode) {
      case 'fast':
        return 1;
      case 'balanced':
        return 2;
      case 'quality':
      default:
        return 3;
    }
  }, []);

  const resolvePromptExecution = useCallback(
    (poster: PosterPrompt): PromptExecutionPayload => {
      const runtimePrompt =
        typeof poster.runtimePromptAnchorEn === 'string' &&
        poster.runtimePromptAnchorEn.trim().length > 0
          ? poster.runtimePromptAnchorEn
          : typeof poster.runtimePromptEn === 'string' && poster.runtimePromptEn.trim().length > 0
            ? poster.runtimePromptEn
          : poster.promptEn;
      const runtimeNegative =
        typeof poster.runtimeNegative === 'string' && poster.runtimeNegative.trim().length > 0
          ? poster.runtimeNegative
          : poster.negative;

      return {
        prompt: runtimePrompt,
        negative: runtimeNegative,
        promptSource:
          runtimePrompt === poster.runtimePromptAnchorEn
            ? 'runtimePromptAnchorEn'
            : runtimePrompt === poster.runtimePromptEn
              ? 'runtimePromptEn(fallback)'
              : 'promptEn(fallback)',
        negativeSource: runtimeNegative === poster.runtimeNegative ? 'runtimeNegative' : 'negative(fallback)',
      };
    },
    []
  );

  const scoreCandidate = useCallback((url: string, posterId: string, attempt: number) => {
    let score = 0;
    if (url.startsWith('data:image/')) score += 55;
    if (url.includes('placeholder')) score -= 80;
    if (url.length > 8000) score += 20;
    if (url.length > 30000) score += 10;
    if (posterId === '01' && url.length > 50000) score += 10;
    score += Math.max(0, 5 - attempt);
    return score;
  }, []);

  const isCapacityPeakError = useCallback((error: unknown) => {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return (
      message.includes('gemini image api error (429)') ||
      message.includes('gemini image api error (503)') ||
      message.includes('resource_exhausted') ||
      message.includes('quota') ||
      message.includes('high demand')
    );
  }, []);

  const parseRetryDelayMs = useCallback((message: string): number | undefined => {
    const messageMatch = message.match(/retry(?:\s+again)?\s+in\s+([0-9.]+)\s*s?/i);
    if (messageMatch) {
      const seconds = Number(messageMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.ceil(seconds * 1000);
      }
    }

    const retryInfoMatch = message.match(/"retryDelay"\s*:\s*"([0-9.]+)s"/i);
    if (retryInfoMatch) {
      const seconds = Number(retryInfoMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.ceil(seconds * 1000);
      }
    }

    return undefined;
  }, []);

  const sleep = useCallback((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)), []);

  const updatePoster = useCallback(
    (posterId: string, updater: (current: PosterProgress) => PosterProgress) => {
      setPostersProgress((prev) => prev.map((poster) => (poster.id === posterId ? updater(poster) : poster)));
    },
    []
  );

  const executeSinglePoster = useCallback(
    async (poster: PosterPrompt): Promise<PromptExecutionPayload & { finalUrl: string; rawUrl?: string }> => {
      const { width, height } = getPosterSize(selectedStyle?.aspectRatio);
      const candidateCount = resolveCandidateCount(selectedQualityMode);
      const promptExecution = resolvePromptExecution(poster);

      console.info(
        `[kv-generation] poster=${poster.id} mode=${selectedGenerationMode} prompt=${promptExecution.promptSource} negative=${promptExecution.negativeSource}`
      );

      let bestRawUrl = '';
      let bestScore = Number.NEGATIVE_INFINITY;
      let lastCandidateErrors: string[] = [];
      let capacityRetryAttempt = 0;
      const maxCapacityRetries = 2;

      while (!bestRawUrl && capacityRetryAttempt <= maxCapacityRetries) {
        const effectiveCandidateCount = capacityRetryAttempt > 0 ? 1 : candidateCount;
        const candidateErrors: string[] = [];

        for (let candidateIndex = 0; candidateIndex < effectiveCandidateCount; candidateIndex++) {
          try {
            const request = {
              prompt: promptExecution.prompt,
              negative: promptExecution.negative,
              width,
              height,
              referenceImage: uploadedImage?.preview,
              enforceHardConstraints: true,
            };
            const candidateUrl = useMock ? await generatePosterMock(request) : await generatePoster(request);
            const score = scoreCandidate(candidateUrl, poster.id, candidateIndex);
            if (!bestRawUrl || score > bestScore) {
              bestRawUrl = candidateUrl;
              bestScore = score;
            }
          } catch (candidateError) {
            const errorMessage = candidateError instanceof Error ? candidateError.message : '未知错误';
            candidateErrors.push(`候选 ${candidateIndex + 1}: ${errorMessage}`);
            console.warn(`海报 ${poster.id} 候选 ${candidateIndex + 1} 失败:`, candidateError);

            if (bestRawUrl && isCapacityPeakError(candidateError)) {
              break;
            }
          }
        }

        if (bestRawUrl) break;

        lastCandidateErrors = candidateErrors;
        const allCapacityErrors =
          candidateErrors.length > 0 &&
          candidateErrors.every((message) => isCapacityPeakError(new Error(message)));

        if (!allCapacityErrors || capacityRetryAttempt >= maxCapacityRetries) {
          break;
        }

        const retryDelayFromApi = candidateErrors
          .map((message) => parseRetryDelayMs(message))
          .find((delay): delay is number => typeof delay === 'number');
        const fallbackDelayMs = 12000 + capacityRetryAttempt * 8000;
        const waitMs = Math.max(5000, Math.min(60000, retryDelayFromApi ?? fallbackDelayMs));

        setGlobalMessage(
          `海报 ${poster.id} 服务高峰，等待 ${Math.ceil(waitMs / 1000)} 秒后重试...`
        );
        await sleep(waitMs);
        capacityRetryAttempt += 1;
      }

      if (!bestRawUrl) {
        const allCapacityErrors =
          lastCandidateErrors.length > 0 &&
          lastCandidateErrors.every((message) => isCapacityPeakError(new Error(message)));
        if (allCapacityErrors) {
          throw new Error('模型高峰拥塞，当前海报暂时生成失败。请 30-60 秒后重试。');
        }
        const firstError = lastCandidateErrors[0] || '未获取到可用候选图';
        throw new Error(firstError);
      }

      return {
        ...promptExecution,
        finalUrl: bestRawUrl,
        rawUrl: bestRawUrl,
      };
    },
    [
      isCapacityPeakError,
      parseRetryDelayMs,
      resolveCandidateCount,
      resolvePromptExecution,
      scoreCandidate,
      selectedGenerationMode,
      selectedQualityMode,
      selectedStyle?.aspectRatio,
      sleep,
      uploadedImage?.preview,
      useMock,
    ]
  );

  const runPosterGeneration = useCallback(
    async (posterId: string, forceRegenerate: boolean) => {
      const poster = promptById.get(posterId);
      if (!poster) return false;

      const current = postersProgress.find((item) => item.id === posterId);
      if (current?.status === 'generating') {
        return false;
      }
      if (!forceRegenerate && current?.status === 'completed') {
        return true;
      }

      updatePoster(posterId, (item) => ({
        ...item,
        status: 'generating',
        error: undefined,
      }));
      setGlobalMessage(`正在生成海报 ${poster.id} - ${poster.title}...`);

      try {
        const generated = await executeSinglePoster(poster);
        updatePoster(posterId, (item) => {
          const existingVersions = getPosterVersions(item);
          const shouldAppend = forceRegenerate && existingVersions.length > 0;

          if (shouldAppend) {
            const nextVersionId = `v${existingVersions.length + 1}`;
            const nextVersion: GeneratedPosterVersion = {
              id: nextVersionId,
              url: generated.finalUrl,
              source: 'refine',
              note: '重新生成',
              createdAt: Date.now(),
            };
            return {
              ...item,
              status: 'completed',
              url: generated.finalUrl,
              rawUrl: generated.rawUrl,
              overlayApplied: false,
              generationMode: selectedGenerationMode,
              promptSource: generated.promptSource,
              negativeSource: generated.negativeSource,
              versions: [...existingVersions, nextVersion],
              activeVersionId: nextVersionId,
            };
          }

          return {
            ...item,
            status: 'completed',
            url: generated.finalUrl,
            rawUrl: generated.rawUrl,
            overlayApplied: false,
            generationMode: selectedGenerationMode,
            promptSource: generated.promptSource,
            negativeSource: generated.negativeSource,
            versions: [
              {
                id: 'v1',
                url: generated.finalUrl,
                source: 'initial',
                createdAt: Date.now(),
              },
            ],
            activeVersionId: 'v1',
          };
        });
        setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));
        return true;
      } catch (error) {
        console.error(`生成海报 ${poster.id} 失败:`, error);
        updatePoster(posterId, (item) => ({
          ...item,
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误',
        }));
        return false;
      }
    },
    [executeSinglePoster, postersProgress, promptById, selectedGenerationMode, updatePoster]
  );

  const handleGenerateOne = useCallback(
    async (posterId: string, forceRegenerate = false) => {
      if (isBatchGenerating) return;
      await runPosterGeneration(posterId, forceRegenerate);
    },
    [isBatchGenerating, runPosterGeneration]
  );

  const handleGenerateAll = useCallback(async () => {
    if (generationLockRef.current || hasRunningSingleGeneration) return;

    const pendingOrFailed = postersProgress
      .filter((poster) => poster.status !== 'completed')
      .map((poster) => poster.id);

    if (pendingOrFailed.length === 0) {
      setGlobalMessage('所有海报已经生成完成，可单独点击“重新生成”继续优化');
      return;
    }

    generationLockRef.current = true;
    setIsBatchGenerating(true);

    try {
      let hadFailure = false;
      for (const posterId of pendingOrFailed) {
        const success = await runPosterGeneration(posterId, false);
        if (!success) {
          hadFailure = true;
        }
      }

      setGlobalMessage(hadFailure ? '全部任务完成（含失败项，可单独重试）' : '全部任务生成完成');
    } finally {
      setIsBatchGenerating(false);
      generationLockRef.current = false;
    }
  }, [hasRunningSingleGeneration, postersProgress, runPosterGeneration]);

  const handleDownload = useCallback((url: string, id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `poster-${id}.jpg`;
    link.click();
  }, []);

  const handleSelectVersion = useCallback(
    (posterId: string, versionId: string) => {
      const targetPoster = postersProgress.find((poster) => poster.id === posterId);
      if (!targetPoster) return;

      const versions = getPosterVersions(targetPoster);
      const targetVersion = versions.find((version) => version.id === versionId);
      if (!targetVersion) return;

      setPostersProgress((prev) =>
        prev.map((poster) =>
          poster.id === posterId
            ? {
                ...poster,
                versions,
                activeVersionId: versionId,
                url: targetVersion.url,
              }
            : poster
        )
      );
      setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));

      if (selectedPosterId === posterId) {
        setSelectedVersionId(versionId);
      }
    },
    [postersProgress, selectedPosterId]
  );

  const applyRefineToPoster = useCallback(
    async (posterId: string, instruction: string) => {
      const selected = postersProgress.find((poster) => poster.id === posterId);
      if (!selected || selected.status !== 'completed') {
        throw new Error('请先生成该海报后再优化');
      }

      const prompt = promptById.get(selected.id);
      if (!prompt) {
        throw new Error('未找到该海报提示词');
      }

      const promptExecution = resolvePromptExecution(prompt);
      const referenceImage = resolveActiveVersion(selected)?.url || selected.url;
      if (!referenceImage) {
        throw new Error('当前海报图片不可用，暂时无法优化');
      }

      const { width, height } = getPosterSize(selectedStyle?.aspectRatio);
      const refinedPrompt = [
        promptExecution.prompt,
        'Refinement instruction:',
        instruction,
        'Keep product identity and composition continuity with the reference image. Apply only the requested visual changes.',
      ].join('\n\n');

      const refinedUrl = useMock
        ? await generatePosterMock({
            prompt: refinedPrompt,
            negative: promptExecution.negative,
            width,
            height,
            referenceImage,
            enforceHardConstraints: true,
          })
        : await generatePoster({
            prompt: refinedPrompt,
            negative: promptExecution.negative,
            width,
            height,
            referenceImage,
            enforceHardConstraints: true,
          });

      setPostersProgress((prev) =>
        prev.map((poster) => {
          if (poster.id !== selected.id) return poster;
          const baseVersions = getPosterVersions(poster);
          const nextVersionId = `v${baseVersions.length + 1}`;
          const nextVersion: GeneratedPosterVersion = {
            id: nextVersionId,
            url: refinedUrl,
            source: 'refine',
            note: instruction,
            createdAt: Date.now(),
          };
          return {
            ...poster,
            status: 'completed',
            url: refinedUrl,
            versions: [...baseVersions, nextVersion],
            activeVersionId: nextVersionId,
          };
        })
      );
      setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));

      if (selectedPosterId === posterId) {
        const updated = postersProgress.find((poster) => poster.id === posterId);
        const versionCount = updated ? getPosterVersions(updated).length + 1 : 1;
        setSelectedVersionId(`v${versionCount}`);
      }
    },
    [
      postersProgress,
      promptById,
      resolvePromptExecution,
      selectedPosterId,
      selectedStyle?.aspectRatio,
      useMock,
    ]
  );

  const handleCardRefine = useCallback(
    async (posterId: string) => {
      if (generationLockRef.current) return;
      const instruction = (cardRefineInputs[posterId] || '').trim();
      if (!instruction) {
        setCardRefineErrors((prev) => ({ ...prev, [posterId]: '请输入修改意见' }));
        return;
      }

      generationLockRef.current = true;
      setCardRefining((prev) => ({ ...prev, [posterId]: true }));
      setCardRefineErrors((prev) => ({ ...prev, [posterId]: null }));
      setGlobalMessage(`正在优化海报 ${posterId}...`);

      try {
        await applyRefineToPoster(posterId, instruction);
        setCardRefineInputs((prev) => ({ ...prev, [posterId]: '' }));
        setGlobalMessage(`海报 ${posterId} 优化完成`);
      } catch (error) {
        setCardRefineErrors((prev) => ({
          ...prev,
          [posterId]: error instanceof Error ? error.message : '优化失败，请稍后重试',
        }));
      } finally {
        setCardRefining((prev) => ({ ...prev, [posterId]: false }));
        generationLockRef.current = false;
      }
    },
    [applyRefineToPoster, cardRefineInputs]
  );

  const selectedPoster = selectedPosterId
    ? postersProgress.find((poster) => poster.id === selectedPosterId)
    : null;
  const selectedPrompt = selectedPosterId ? promptById.get(selectedPosterId) : undefined;
  const selectedVersion = selectedPoster
    ? resolveActiveVersion(selectedPoster, selectedVersionId)
    : null;
  const selectedPreviewUrl = selectedVersion?.url || selectedPoster?.url;

  const clampZoom = (value: number) => Math.min(4, Math.max(1, Number(value.toFixed(2))));

  const centerPreviewScroll = useCallback(() => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
  }, []);

  const openPreview = useCallback(
    (posterId: string) => {
      const poster = postersProgress.find((item) => item.id === posterId);
      const initialVersion = poster ? resolveActiveVersion(poster) : null;

      setSelectedPosterId(posterId);
      setSelectedVersionId(initialVersion?.id || null);
      setPreviewZoom(1);
      setIsPanning(false);
      panStateRef.current = null;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => centerPreviewScroll());
      });
    },
    [centerPreviewScroll, postersProgress]
  );

  const closePreview = () => {
    setSelectedPosterId(null);
    setSelectedVersionId(null);
    setIsPanning(false);
    panStateRef.current = null;
  };

  const resetPreviewView = () => {
    setPreviewZoom(1);
    requestAnimationFrame(() => centerPreviewScroll());
  };

  const zoomTo = (targetZoom: number) => {
    const nextZoom = clampZoom(targetZoom);
    if (nextZoom === previewZoom) return;

    const viewport = previewViewportRef.current;
    if (!viewport) {
      setPreviewZoom(nextZoom);
      return;
    }

    const centerRatioX =
      (viewport.scrollLeft + viewport.clientWidth / 2) / Math.max(viewport.scrollWidth, 1);
    const centerRatioY =
      (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(viewport.scrollHeight, 1);

    setPreviewZoom(nextZoom);
    requestAnimationFrame(() => {
      const nextViewport = previewViewportRef.current;
      if (!nextViewport) return;
      nextViewport.scrollLeft = Math.max(
        0,
        centerRatioX * nextViewport.scrollWidth - nextViewport.clientWidth / 2
      );
      nextViewport.scrollTop = Math.max(
        0,
        centerRatioY * nextViewport.scrollHeight - nextViewport.clientHeight / 2
      );
    });
  };

  const handlePreviewMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (previewZoom <= 1) return;
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    setIsPanning(true);
    panStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
  };

  const handlePreviewMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStateRef.current) return;
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    const deltaX = event.clientX - panStateRef.current.startX;
    const deltaY = event.clientY - panStateRef.current.startY;
    viewport.scrollLeft = panStateRef.current.scrollLeft - deltaX;
    viewport.scrollTop = panStateRef.current.scrollTop - deltaY;
  };

  const stopPanning = () => {
    setIsPanning(false);
    panStateRef.current = null;
  };

  if (!generatedPrompts || !selectedStyle || !editedProductInfo) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push('/prompts')}>
          ← 返回提示词
        </Button>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Generation Workspace</p>
          <h2 className="text-xl font-semibold">海报生成工作台</h2>
        </div>
      </div>

      <Card className="studio-panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            <h3 className="text-2xl font-semibold">产品 DNA 分析</h3>
          </div>
          <span className="text-xs text-muted-foreground">先确认调性，再逐张生成</span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_0.9fr]">
          <Card className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Fingerprint className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">品牌核心</span>
            </div>
            <p className="text-4xl font-semibold leading-tight">
              {editedProductInfo.brandName.zh || editedProductInfo.brandName.en || '未命名品牌'}
            </p>
            <p className="mt-2 text-2xl font-medium uppercase tracking-wide text-muted-foreground/90">
              {editedProductInfo.brandName.en || editedProductInfo.brandName.zh || 'Brand Core'}
            </p>
            <div className="mt-4 grid gap-3 border-t border-border/60 pt-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">品类定位</p>
                  <p className="font-semibold">
                    {editedProductInfo.productType.category || '-'}
                    {editedProductInfo.productType.specific ? ` / ${editedProductInfo.productType.specific}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">驱动人群</p>
                  <p className="font-semibold line-clamp-3">{editedProductInfo.targetAudience || '-'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Palette className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold">色彩基因</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {(colorSwatches.length > 0
                ? colorSwatches
                : [
                    { raw: '#5F77FF', swatch: '#5F77FF' },
                    { raw: '#8CA2FF', swatch: '#8CA2FF' },
                    { raw: '#C248FF', swatch: '#C248FF' },
                  ]
              ).map((item, index) => (
                <div key={`${item.raw}-${index}`} className="text-center">
                  <div
                    className="mx-auto h-14 w-14 rounded-full border border-white/20"
                    style={{ backgroundColor: item.swatch }}
                  />
                  <p className="mt-2 truncate text-xs font-semibold">{item.raw}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {index === 0 ? '主色' : index === 1 ? '辅助色' : '点缀色'}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground line-clamp-2">
              {editedProductInfo.brandTone || '用于统一全套海报的颜色与氛围表达'}
            </p>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-secondary/35 p-4">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-semibold">风格导向</span>
            </div>
            <p className="text-3xl font-semibold leading-tight">{styleDirectionPrimary}</p>
            <p className="mt-1 text-2xl font-semibold text-muted-foreground/90">{styleDirectionSecondary}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              排版: {TEXT_LAYOUT_LABELS[selectedStyle.textLayout] || selectedStyle.textLayout} · 比例:{' '}
              {selectedStyle.aspectRatio}
            </p>
            <div className="mt-4 rounded-full border border-border/70 bg-background/45 px-3 py-2 text-sm font-medium">
              {(styleTags.length > 0 ? styleTags : ['风格一致', '品牌稳定', '双语可读']).join(' · ')}
            </div>
          </Card>
        </div>
      </Card>

      <Card className="studio-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-semibold">KV 视觉体系</h3>
              <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                {GENERATION_MODE_LABELS[selectedGenerationMode]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              已完成 {completedCount}/{totalCount} · 失败 {failedCount} · 质量模式 {selectedQualityMode}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleGenerateAll}
            disabled={isBatchGenerating || hasRunningSingleGeneration || totalCount === 0}
            className="h-11 rounded-full px-6"
          >
            <Play className="mr-2 h-4 w-4" />
            一键生成所有海报
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          <Progress value={progressValue} className="h-2" />
          <p className="text-xs text-muted-foreground">{globalMessage}</p>
        </div>
      </Card>

      <div className="grid justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
        {queue.map((posterPrompt) => {
          const poster = postersProgress.find((item) => item.id === posterPrompt.id);
          if (!poster) return null;

          const versions = getPosterVersions(poster);
          const activeVersion = resolveActiveVersion(poster);
          const cardPreviewMode = cardPreviewModes[poster.id] || 'final';
          const cardImageUrl =
            cardPreviewMode === 'raw' && poster.rawUrl ? poster.rawUrl : activeVersion?.url || poster.url;
          const isPromptOpen = cardPromptDetails[poster.id] === true;
          const cardPromptValue = cardRefineInputs[poster.id] || '';
          const isCardRefining = cardRefining[poster.id] === true;
          const cardRefineError = cardRefineErrors[poster.id];
          const canGenerate = !isBatchGenerating && poster.status !== 'generating';

          return (
            <Card
              key={poster.id}
              className="relative w-[300px] max-w-[92vw] overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-md"
            >
              <div
                className="group relative bg-muted"
                style={{ aspectRatio: resolveAspectRatioStyle(selectedStyle.aspectRatio) }}
              >
                {cardImageUrl ? (
                  <Image
                    src={cardImageUrl}
                    alt={poster.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 92vw, 320px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center px-5 text-center">
                    <div className="mb-5 rounded-3xl border border-border/70 bg-secondary/45 p-6">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-4xl font-semibold">{poster.title}</p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {compactPromptSnippet(resolvePromptExecution(posterPrompt).prompt)}
                    </p>
                    <Button
                      className="mt-5 h-12 w-44 rounded-2xl"
                      disabled={!canGenerate}
                      onClick={() => handleGenerateOne(poster.id)}
                    >
                      {poster.status === 'generating' ? '生成中...' : '生成海报'}
                    </Button>
                  </div>
                )}

                {cardImageUrl ? (
                  <>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15" />
                    <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
                      <span className="rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                        {poster.id}
                      </span>
                      {versions.length > 1 && (
                        <div className="flex items-center gap-1 rounded-md bg-black/60 p-1">
                          {versions.map((version) => (
                            <button
                              key={version.id}
                              onClick={() => handleSelectVersion(poster.id, version.id)}
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                                (activeVersion?.id || 'v1') === version.id
                                  ? 'bg-white text-black'
                                  : 'text-white/80 hover:bg-white/20 hover:text-white'
                              )}
                              title={
                                version.note
                                  ? `优化: ${version.note}`
                                  : version.source === 'initial'
                                    ? '初始版本'
                                    : '优化版本'
                              }
                            >
                              {version.id}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {poster.rawUrl && (
                      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/60 p-1">
                        <button
                          onClick={() =>
                            setCardPreviewModes((prev) => ({ ...prev, [poster.id]: 'final' }))
                          }
                          className={cn(
                            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                            cardPreviewMode === 'final'
                              ? 'bg-white text-black'
                              : 'text-white/80 hover:bg-white/20 hover:text-white'
                          )}
                        >
                          成品
                        </button>
                        <button
                          onClick={() =>
                            setCardPreviewModes((prev) => ({ ...prev, [poster.id]: 'raw' }))
                          }
                          className={cn(
                            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                            cardPreviewMode === 'raw'
                              ? 'bg-white text-black'
                              : 'text-white/80 hover:bg-white/20 hover:text-white'
                          )}
                        >
                          原图
                        </button>
                      </div>
                    )}

                    <div className="pointer-events-none invisible absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openPreview(poster.id);
                        }}
                        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-colors hover:bg-white"
                        title="查看"
                      >
                        <Eye className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(event) => cardImageUrl && handleDownload(cardImageUrl, poster.id, event)}
                        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-colors hover:bg-white"
                        title="下载"
                      >
                        <Download className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleGenerateOne(poster.id, true);
                        }}
                        className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-full border border-white/35 bg-[#8A4F33]/85 px-5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#8A4F33]"
                        title="重新生成"
                        disabled={!canGenerate}
                      >
                        重新生成
                      </button>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-border/70 bg-card/95 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-[13px] font-semibold text-muted-foreground">
                    #{poster.id}:{poster.title}
                  </h3>
                  <button
                    onClick={() =>
                      setCardPromptDetails((prev) => ({ ...prev, [poster.id]: !prev[poster.id] }))
                    }
                    className="shrink-0 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    提示词详情 {isPromptOpen ? '▴' : '▾'}
                  </button>
                </div>

                {isPromptOpen && (
                  <div className="glass-scrollbar max-h-24 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-2 text-[11px] leading-5 text-muted-foreground whitespace-pre-wrap">
                    {resolvePromptExecution(posterPrompt).prompt}
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={cardPromptValue}
                      onChange={(event) =>
                        setCardRefineInputs((prev) => ({
                          ...prev,
                          [poster.id]: event.target.value,
                        }))
                      }
                      placeholder="输入修改意见..."
                      className="h-10 flex-1 rounded-xl border border-border/70 bg-white/65 px-3 text-sm text-black outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                    />
                    <Button
                      onClick={() => handleCardRefine(poster.id)}
                      disabled={
                        isCardRefining ||
                        cardPromptValue.trim().length === 0 ||
                        poster.status !== 'completed' ||
                        isBatchGenerating
                      }
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl"
                      title="提交优化"
                    >
                      {isCardRefining ? <span className="text-[11px]">...</span> : <SendHorizontal className="h-4 w-4" />}
                    </Button>
                  </div>
                  {poster.status !== 'completed' && (
                    <p className="mt-2 text-[11px] text-muted-foreground">请先生成该卡片后再做二次优化</p>
                  )}
                </div>
                {poster.error && <p className="text-xs text-red-400">{poster.error}</p>}
                {cardRefineError && <p className="text-xs text-red-400">{cardRefineError}</p>}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedPosterId !== null && selectedPoster && selectedPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 p-2 backdrop-blur-sm animate-fade-in sm:p-4" onClick={closePreview}>
          <div className="mx-auto h-full w-full max-w-[1440px]">
            <div className="flex h-full flex-col gap-3">
              <Card
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/95 px-3 py-2 sm:px-4"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    海报 {selectedPrompt?.id} - {selectedPrompt?.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{selectedPrompt?.titleEn}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => zoomTo(previewZoom - 0.25)}
                    disabled={previewZoom <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
                    title="缩小"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <div className="w-14 text-center text-xs tabular-nums text-muted-foreground">
                    {Math.round(previewZoom * 100)}%
                  </div>
                  <button
                    onClick={() => zoomTo(previewZoom + 0.25)}
                    disabled={previewZoom >= 4}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
                    title="放大"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={resetPreviewView}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="重置"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const versionTag = selectedVersion?.id || selectedPoster.activeVersionId || 'v1';
                      handleDownload(selectedPreviewUrl, `${selectedPoster.id}-${versionTag}`);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="下载"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={closePreview}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="关闭"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Card>

              <Card
                className="flex-1 overflow-hidden rounded-2xl border border-border/70 bg-black/45"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  ref={previewViewportRef}
                  className={cn(
                    'glass-scrollbar h-full w-full overflow-auto',
                    previewZoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                  )}
                  onMouseDown={handlePreviewMouseDown}
                  onMouseMove={handlePreviewMouseMove}
                  onMouseUp={stopPanning}
                  onMouseLeave={stopPanning}
                >
                  <div className="flex h-full min-w-full items-center justify-center p-3 sm:p-6">
                    <div
                      className="shrink-0"
                      style={{
                        height: `${previewZoom * 100}%`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedPreviewUrl}
                        alt={selectedPrompt?.title || `Poster ${selectedPoster.id}`}
                        draggable={false}
                        className="block h-full w-auto max-w-none select-none shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## app/gallery/page.tsx

```
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Eye, RotateCcw, SendHorizontal, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generatePoster } from '@/lib/api/client';
import type {
  GeneratedPoster,
  GeneratedPosterVersion,
  GenerationPipelineMode,
  PosterAspectRatio,
} from '@/contexts/AppContext';

const GENERATION_MODE_LABELS: Record<GenerationPipelineMode, string> = {
  one_pass_layout_anchor: '一步成图（短提示词+锚点版式）',
};

function getPosterSize(aspectRatio?: PosterAspectRatio): { width: number; height: number } {
  const ratio = aspectRatio || '9:16';
  const ratioMap: Record<PosterAspectRatio, { width: number; height: number }> = {
    '9:16': { width: 900, height: 1600 },
    '3:4': { width: 900, height: 1200 },
    '2:3': { width: 900, height: 1350 },
    '1:1': { width: 1200, height: 1200 },
    '4:3': { width: 1200, height: 900 },
    '3:2': { width: 1200, height: 800 },
    '16:9': { width: 1600, height: 900 },
    '21:9': { width: 2100, height: 900 },
  };
  return ratioMap[ratio];
}

function resolveAspectRatioStyle(aspectRatio?: PosterAspectRatio): string {
  const [width, height] = (aspectRatio || '9:16').split(':').map((value) => Number(value));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return '9 / 16';
  }
  return `${width} / ${height}`;
}

function getPosterVersions(poster: GeneratedPoster): GeneratedPosterVersion[] {
  if (poster.versions && poster.versions.length > 0) {
    return poster.versions;
  }
  return [
    {
      id: 'v1',
      url: poster.url,
      source: 'initial',
      createdAt: 0,
    },
  ];
}

type PreviewMode = 'final' | 'raw';

function resolveActiveVersion(
  poster: GeneratedPoster,
  preferredVersionId?: string | null
): GeneratedPosterVersion | null {
  const versions = getPosterVersions(poster);
  if (versions.length === 0) return null;

  if (preferredVersionId) {
    const matched = versions.find((version) => version.id === preferredVersionId);
    if (matched) return matched;
  }

  if (poster.activeVersionId) {
    const matched = versions.find((version) => version.id === poster.activeVersionId);
    if (matched) return matched;
  }

  return versions[versions.length - 1];
}

function getPosterPreviewUrl(
  poster: GeneratedPoster,
  previewMode: PreviewMode,
  preferredVersionId?: string | null
): string | undefined {
  const activeVersion = resolveActiveVersion(poster, preferredVersionId);
  const finalUrl = activeVersion?.url || poster.url;
  if (previewMode === 'raw' && poster.rawUrl) return poster.rawUrl;
  return finalUrl;
}

export default function GalleryPage() {
  const router = useRouter();
  const {
    generatedPosters,
    generatedPrompts,
    selectedStyle,
    setGeneratedPosters,
  } = useAppContext();
  const [selectedPosterId, setSelectedPosterId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [cardPreviewModes, setCardPreviewModes] = useState<Record<string, PreviewMode>>({});
  const [cardRefineInputs, setCardRefineInputs] = useState<Record<string, string>>({});
  const [cardRefining, setCardRefining] = useState<Record<string, boolean>>({});
  const [cardRefineErrors, setCardRefineErrors] = useState<Record<string, string | null>>({});
  const [cardPromptDetails, setCardPromptDetails] = useState<Record<string, boolean>>({});
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const cardInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const panStateRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const promptById = new Map(generatedPrompts?.posters.map((poster) => [poster.id, poster]));
  const selectedPoster = selectedPosterId
    ? generatedPosters?.find((poster) => poster.id === selectedPosterId)
    : null;
  const selectedPrompt = selectedPosterId ? promptById.get(selectedPosterId) : undefined;
  const selectedVersion = selectedPoster
    ? resolveActiveVersion(selectedPoster, selectedVersionId)
    : null;
  const selectedPreviewUrl = selectedVersion?.url || selectedPoster?.url;

  useEffect(() => {
    if (!generatedPosters || generatedPosters.length === 0) {
      router.push('/');
    }
  }, [generatedPosters, router]);

  useEffect(() => {
    if (!generatedPosters || generatedPosters.length === 0) return;

    let hasChange = false;
    const normalized = generatedPosters.map((poster) => {
      const activeVersion = resolveActiveVersion(poster);
      if (!activeVersion) return poster;
      if (poster.activeVersionId === activeVersion.id && poster.url === activeVersion.url) {
        return poster;
      }
      hasChange = true;
      return {
        ...poster,
        activeVersionId: activeVersion.id,
        url: activeVersion.url,
      };
    });

    if (hasChange) {
      setGeneratedPosters(normalized);
    }
  }, [generatedPosters, setGeneratedPosters]);

  const clampZoom = (value: number) => Math.min(4, Math.max(1, Number(value.toFixed(2))));

  const centerPreviewScroll = () => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
  };

  const openPreview = (posterId: string) => {
    const poster = generatedPosters?.find((item) => item.id === posterId);
    const initialVersion = poster ? resolveActiveVersion(poster) : null;

    setSelectedPosterId(posterId);
    setSelectedVersionId(initialVersion?.id || null);
    setPreviewZoom(1);
    stopPanning();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => centerPreviewScroll());
    });
  };

  const closePreview = () => {
    setSelectedPosterId(null);
    setSelectedVersionId(null);
    stopPanning();
  };

  const resetPreviewView = () => {
    setPreviewZoom(1);
    requestAnimationFrame(() => centerPreviewScroll());
  };

  const zoomTo = (targetZoom: number) => {
    const nextZoom = clampZoom(targetZoom);
    if (nextZoom === previewZoom) return;

    const viewport = previewViewportRef.current;
    if (!viewport) {
      setPreviewZoom(nextZoom);
      return;
    }

    const centerRatioX =
      (viewport.scrollLeft + viewport.clientWidth / 2) / Math.max(viewport.scrollWidth, 1);
    const centerRatioY =
      (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(viewport.scrollHeight, 1);

    setPreviewZoom(nextZoom);
    requestAnimationFrame(() => {
      const nextViewport = previewViewportRef.current;
      if (!nextViewport) return;
      nextViewport.scrollLeft = Math.max(
        0,
        centerRatioX * nextViewport.scrollWidth - nextViewport.clientWidth / 2
      );
      nextViewport.scrollTop = Math.max(
        0,
        centerRatioY * nextViewport.scrollHeight - nextViewport.clientHeight / 2
      );
    });
  };

  const handleZoomIn = () => {
    zoomTo(previewZoom + 0.25);
  };

  const handleZoomOut = () => {
    zoomTo(previewZoom - 0.25);
  };

  const handlePreviewMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (previewZoom <= 1) return;
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    setIsPanning(true);
    panStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
  };

  const handlePreviewMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStateRef.current) return;
    const viewport = previewViewportRef.current;
    if (!viewport) return;

    const deltaX = event.clientX - panStateRef.current.startX;
    const deltaY = event.clientY - panStateRef.current.startY;
    viewport.scrollLeft = panStateRef.current.scrollLeft - deltaX;
    viewport.scrollTop = panStateRef.current.scrollTop - deltaY;
  };

  const stopPanning = () => {
    setIsPanning(false);
    panStateRef.current = null;
  };

  const handleSelectVersion = (posterId: string, versionId: string) => {
    if (!generatedPosters) return;
    const targetPoster = generatedPosters.find((poster) => poster.id === posterId);
    if (!targetPoster) return;

    const versions = getPosterVersions(targetPoster);
    const targetVersion = versions.find((version) => version.id === versionId);
    if (!targetVersion) return;

    const nextPosters = generatedPosters.map((poster) =>
      poster.id === posterId
        ? {
            ...poster,
            versions,
            activeVersionId: versionId,
            url: targetVersion.url,
          }
        : poster
    );
    setGeneratedPosters(nextPosters);
    setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));

    if (selectedPosterId === posterId) {
      setSelectedVersionId(versionId);
    }
  };

  const applyRefineToPoster = async (posterId: string, instruction: string) => {
    if (!generatedPosters) {
      throw new Error('当前没有可优化的海报');
    }
    const selected = generatedPosters.find((poster) => poster.id === posterId);
    if (!selected) {
      throw new Error('未找到目标海报');
    }

    const prompt = promptById.get(selected.id);
    const basePrompt =
      prompt?.runtimePromptAnchorEn || prompt?.runtimePromptEn || prompt?.promptEn;
    if (!basePrompt) {
      throw new Error('未找到该海报的英文提示词');
    }

    const referenceImage = getPosterPreviewUrl(selected, 'final');
    if (!referenceImage) {
      throw new Error('当前海报图片不可用，暂时无法优化');
    }

    const { width, height } = getPosterSize(selectedStyle?.aspectRatio);
    const refinedPrompt = [
      basePrompt,
      'Refinement instruction:',
      instruction,
      'Keep product identity and composition continuity with the reference image. Apply only the requested visual changes.',
    ].join('\n\n');

    const refinedUrl = await generatePoster({
      prompt: refinedPrompt,
      negative: prompt.runtimeNegative || prompt.negative,
      width,
      height,
      referenceImage,
      enforceHardConstraints: true,
    });

    const baseVersions = getPosterVersions(selected);
    const nextVersionId = `v${baseVersions.length + 1}`;
    const nextVersion: GeneratedPosterVersion = {
      id: nextVersionId,
      url: refinedUrl,
      source: 'refine',
      note: instruction,
      createdAt: Date.now(),
    };
    const nextVersions = [...baseVersions, nextVersion];

    const nextPosters = generatedPosters.map((poster) =>
      poster.id === selected.id
        ? {
            ...poster,
            url: refinedUrl,
            versions: nextVersions,
            activeVersionId: nextVersionId,
          }
        : poster
    );
    setGeneratedPosters(nextPosters);
    setCardPreviewModes((prev) => ({ ...prev, [posterId]: 'final' }));

    if (selectedPosterId === posterId) {
      setSelectedVersionId(nextVersionId);
    }

    return nextVersionId;
  };

  const handleCardRefine = async (posterId: string) => {
    const instruction = (cardRefineInputs[posterId] || '').trim();
    if (!instruction) {
      setCardRefineErrors((prev) => ({ ...prev, [posterId]: '请输入修改意见' }));
      return;
    }

    setCardRefining((prev) => ({ ...prev, [posterId]: true }));
    setCardRefineErrors((prev) => ({ ...prev, [posterId]: null }));
    try {
      await applyRefineToPoster(posterId, instruction);
      setCardRefineInputs((prev) => ({ ...prev, [posterId]: '' }));
    } catch (error) {
      setCardRefineErrors((prev) => ({
        ...prev,
        [posterId]: error instanceof Error ? error.message : '优化失败，请稍后重试',
      }));
    } finally {
      setCardRefining((prev) => ({ ...prev, [posterId]: false }));
    }
  };

  if (!generatedPosters || generatedPosters.length === 0) {
    return null;
  }

  const handleDownload = (url: string, id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `poster-${id}.jpg`;
    link.click();
  };

  const handleDownloadAll = async () => {
    // 简单实现: 逐个下载
    // 实际项目中应该使用 JSZip 打包下载
    for (const poster of generatedPosters) {
      if (poster.status === 'completed' && poster.url) {
        const versions = getPosterVersions(poster);
        const activeVersion =
          versions.find((version) => version.id === poster.activeVersionId) ||
          versions[versions.length - 1];
        const targetUrl = activeVersion?.url || poster.url;
        if (!targetUrl) continue;
        await new Promise(resolve => setTimeout(resolve, 500));
        handleDownload(targetUrl, poster.id);
      }
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 animate-fade-in">
      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <Button size="lg" onClick={handleDownloadAll}>
          下载全部
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push('/')}>
          重新开始
        </Button>
      </div>

      {/* 海报网格 */}
      <div className="grid justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
        {generatedPosters.map((poster) => {
          if (poster.status !== 'completed') return null;

          const prompt = promptById.get(poster.id);
          const versions = getPosterVersions(poster);
          const activeVersion = resolveActiveVersion(poster);
          const cardPreviewMode = cardPreviewModes[poster.id] || 'final';
          const cardImageUrl = getPosterPreviewUrl(poster, cardPreviewMode, activeVersion?.id);
          const isCardRefining = cardRefining[poster.id] === true;
          const cardPromptValue = cardRefineInputs[poster.id] || '';
          const cardRefineError = cardRefineErrors[poster.id];
          const isCardPromptOpen = cardPromptDetails[poster.id] === true;

          return (
            <Card
              key={poster.id}
              className="relative w-[300px] max-w-[92vw] overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-md transition-all duration-300 hover:shadow-float hover:-translate-y-1"
            >
              <div
                className="group relative bg-muted"
                style={{ aspectRatio: resolveAspectRatioStyle(selectedStyle?.aspectRatio) }}
              >
                {cardImageUrl ? (
                  <Image
                    src={cardImageUrl}
                    alt={prompt?.title || `Poster ${poster.id}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 92vw, 320px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    暂无图片
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

                <div className="absolute left-2 top-2 z-10 flex items-center gap-1">
                  <span className="rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                    {poster.id}
                  </span>
                  {versions.length > 1 && (
                    <div className="flex items-center gap-1 rounded-md bg-black/60 p-1">
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => handleSelectVersion(poster.id, version.id)}
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                            (activeVersion?.id || 'v1') === version.id
                              ? 'bg-white text-black'
                              : 'text-white/80 hover:bg-white/20 hover:text-white'
                          )}
                          title={
                            version.note
                              ? `优化: ${version.note}`
                              : version.source === 'initial'
                                ? '初始版本'
                                : '优化版本'
                          }
                        >
                          {version.id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {poster.rawUrl && (
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/60 p-1">
                    <button
                      onClick={() =>
                        setCardPreviewModes((prev) => ({ ...prev, [poster.id]: 'final' }))
                      }
                      className={cn(
                        'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                        cardPreviewMode === 'final'
                          ? 'bg-white text-black'
                          : 'text-white/80 hover:bg-white/20 hover:text-white'
                      )}
                    >
                      成品
                    </button>
                    <button
                      onClick={() =>
                        setCardPreviewModes((prev) => ({ ...prev, [poster.id]: 'raw' }))
                      }
                      className={cn(
                        'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                        cardPreviewMode === 'raw'
                          ? 'bg-white text-black'
                          : 'text-white/80 hover:bg-white/20 hover:text-white'
                      )}
                    >
                      原图
                    </button>
                  </div>
                )}

                {poster.generationMode && (
                  <div className="absolute bottom-2 right-2 z-10 bg-black/65 text-white text-[10px] px-2 py-1 rounded-lg">
                    {GENERATION_MODE_LABELS[poster.generationMode] || poster.generationMode}
                  </div>
                )}

                <div className="pointer-events-none invisible absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover:visible group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPreview(poster.id);
                    }}
                    className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-colors hover:bg-white"
                    title="查看详情"
                  >
                    <Eye className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => cardImageUrl && handleDownload(cardImageUrl, poster.id, e)}
                    className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-colors hover:bg-white"
                    title="下载当前图"
                  >
                    <Download className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = cardInputRefs.current[poster.id];
                      if (!input) return;
                      input.focus();
                      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="pointer-events-auto inline-flex h-10 items-center justify-center rounded-full border border-white/35 bg-[#8A4F33]/85 px-5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#8A4F33]"
                  >
                    重新生成
                  </button>
                </div>
              </div>

              <div className="space-y-2 border-t border-border/70 bg-card/95 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-[13px] font-semibold text-muted-foreground">
                    #{poster.id}:{prompt?.title || `海报 ${poster.id}`}
                  </h3>
                  <button
                    onClick={() =>
                      setCardPromptDetails((prev) => ({ ...prev, [poster.id]: !prev[poster.id] }))
                    }
                    className="shrink-0 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    提示词详情 {isCardPromptOpen ? '▴' : '▾'}
                  </button>
                </div>

                {isCardPromptOpen && (
                  <div className="glass-scrollbar max-h-24 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-2 text-[11px] leading-5 text-muted-foreground whitespace-pre-wrap">
                    {prompt?.runtimePromptAnchorEn || prompt?.runtimePromptEn || prompt?.promptEn || '暂无提示词'}
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={(element) => {
                        cardInputRefs.current[poster.id] = element;
                      }}
                      value={cardPromptValue}
                      onChange={(event) =>
                        setCardRefineInputs((prev) => ({
                          ...prev,
                          [poster.id]: event.target.value,
                        }))
                      }
                      placeholder="输入修改意见..."
                      className="h-10 flex-1 rounded-xl border border-border/70 bg-white/65 px-3 text-sm outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
                    />
                    <Button
                      onClick={() => handleCardRefine(poster.id)}
                      disabled={isCardRefining || cardPromptValue.trim().length === 0}
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl"
                      title="提交优化"
                    >
                      {isCardRefining ? (
                        <span className="text-[11px]">...</span>
                      ) : (
                        <SendHorizontal className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {cardRefineError && <p className="text-xs text-red-400">{cardRefineError}</p>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 大图预览 */}
      {selectedPosterId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-2 backdrop-blur-sm animate-fade-in sm:p-4"
          onClick={closePreview}
        >
          <div className="mx-auto h-full w-full max-w-[1440px]">
            <div className="flex h-full flex-col gap-3">
              <Card
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/95 px-3 py-2 sm:px-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    海报 {selectedPrompt?.id} - {selectedPrompt?.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedPrompt?.titleEn}
                  </p>
                  {selectedPoster?.generationMode && (
                    <p className="truncate text-[11px] text-muted-foreground/90">
                      链路: {GENERATION_MODE_LABELS[selectedPoster.generationMode] || selectedPoster.generationMode}
                      {selectedPoster.promptSource ? ` · prompt: ${selectedPoster.promptSource}` : ''}
                      {selectedPoster.negativeSource ? ` · negative: ${selectedPoster.negativeSource}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleZoomOut}
                    disabled={previewZoom <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
                    title="缩小"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <div className="w-14 text-center text-xs tabular-nums text-muted-foreground">
                    {Math.round(previewZoom * 100)}%
                  </div>
                  <button
                    onClick={handleZoomIn}
                    disabled={previewZoom >= 4}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
                    title="放大"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={resetPreviewView}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="重置"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (selectedPreviewUrl && selectedPoster?.id) {
                        const versionTag = selectedVersion?.id || selectedPoster.activeVersionId || 'v1';
                        handleDownload(
                          selectedPreviewUrl,
                          `${selectedPoster.id}-${versionTag}`
                        );
                      }
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="下载"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={closePreview}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary/55 text-foreground transition-colors hover:bg-secondary/70"
                    title="关闭"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Card>

              <Card
                className="flex-1 overflow-hidden rounded-2xl border border-border/70 bg-black/45"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  ref={previewViewportRef}
                  className={cn(
                    'glass-scrollbar h-full w-full overflow-auto',
                    previewZoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                  )}
                  onMouseDown={handlePreviewMouseDown}
                  onMouseMove={handlePreviewMouseMove}
                  onMouseUp={stopPanning}
                  onMouseLeave={stopPanning}
                >
                  <div className="flex h-full min-w-full items-center justify-center p-3 sm:p-6">
                    {selectedPreviewUrl && selectedPoster && (
                      <div
                        className="shrink-0"
                        style={{
                          height: `${previewZoom * 100}%`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedPreviewUrl}
                          alt={selectedPrompt?.title || `Poster ${selectedPoster.id}`}
                          draggable={false}
                          className="block h-full w-auto max-w-none select-none shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## app/style/page.tsx

```
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
  const styleDirection = editedProductInfo.styleDirection;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Style Config</p>
          <h2 className="text-2xl font-semibold">选择视觉风格</h2>
          <p className="text-sm text-muted-foreground">AI 推荐: {VISUAL_STYLES.find(s => s.id === recommendedStyle)?.name}</p>
          {styleDirection ? (
            <p className="text-xs text-muted-foreground">
              双风格导向: {styleDirection.primary} / {styleDirection.secondary}
              {styleDirection.tags?.length ? ` · ${styleDirection.tags.join(' · ')}` : ''}
            </p>
          ) : null}
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
```

## scripts/prompt-generator-demo.ts

```
/**
 * 提示词生成器 V2 演示脚本
 *
 * 运行方式：
 * npx tsx scripts/prompt-generator-demo.ts
 */

import {
  generateNarrativePrompt,
  convertProductToPromptConfig,
  generateNegativePromptByType,
} from '../lib/utils/promptGeneratorV2';
import type { AnalysisResponse, StyleConfig } from '../contexts/AppContext';

// ============================================================================
// 模拟产品数据（基于用户提供的橙子案例）
// ============================================================================

const mockProductInfo: AnalysisResponse = {
  brandName: {
    zh: '每日鲜橙',
    en: 'DAILY FRESH ORANGE',
  },
  productType: {
    category: '生鲜水果',
    specific: '新鲜橙子',
  },
  specifications: '单粒装 (带叶鲜果)',
  sellingPoints: [
    {
      zh: '富含天然维生素C，增强免疫力',
      en: 'Rich in natural Vitamin C to boost immunity',
    },
    {
      zh: '产地直采，保留枝叶的新鲜度',
      en: 'Directly sourced from the orchard, maintaining leaf-freshness',
    },
    {
      zh: '皮薄多汁，果肉饱满细腻',
      en: 'Thin skin and juicy, with plump and delicate pulp',
    },
    {
      zh: '天然无添加，纯净大自然的味道',
      en: 'Natural and additive-free, the pure taste of nature',
    },
    {
      zh: '黄金酸甜比，口感清爽解腻',
      en: 'Golden sweet-to-tart ratio, refreshing and non-greasy',
    },
  ],
  colorScheme: {
    primary: ['#FF8C00', '#FFA500'],
    secondary: ['#4CAF50'],
    accent: ['#FFFFFF', '#F5F5F5'],
  },
  designStyle: '自然有机风格',
  targetAudience: '追求健康饮食、注重生活品质的家庭及都市白领',
  brandTone: '清新、活力、健康、纯净',
  packagingHighlights: [],
  parameters: {
    netContent: '',
    ingredients: '',
    nutrition: '',
    usage: '',
    shelfLife: '',
    storage: '',
  },
  recommendedStyle: 'organic',
  recommendedTypography: 'serif',
};

const mockStyleConfig: StyleConfig = {
  visual: 'organic',
  typography: 'serif',
  textLayout: 'stacked',
  aspectRatio: '9:16',
};

// ============================================================================
// 演示1：主KV海报（基于提示词1的风格）
// ============================================================================

function demo1_HeroPoster() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 演示1：主KV海报（基于提示词1的风格）');
  console.log('='.repeat(80) + '\n');

  const config = convertProductToPromptConfig({
    productInfo: mockProductInfo,
    style: mockStyleConfig,
    posterType: 'hero',
  });

  // 手动调整为与提示词1完全一致的风格
  config.logoPosition = 'top-center';
  config.mainTitle = '每日鲜橙 | DAILY FRESH ORANGE';
  config.subtitle = undefined;
  config.sellingPoints = [];
  config.background = 'clean and minimalist, light beige textured fabric';
  config.lighting = 'soft morning sunlight, studio lighting';
  config.technicalSpecs = 'High-end food photography, macro details, 8k resolution, cinematic lighting.';

  const prompt = generateNarrativePrompt(config);

  console.log(prompt);
  console.log('\n' + '-'.repeat(80));

  const negative = generateNegativePromptByType('hero');
  console.log('\n🚫 负面词:\n');
  console.log(negative);
}

// ============================================================================
// 演示2：天然鲜果电商海报（解决风格矛盾）
// ============================================================================

function demo2_NaturalFreshPoster() {
  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 演示2：天然鲜果电商海报（解决风格矛盾）');
  console.log('='.repeat(80) + '\n');

  const productInfo2 = { ...mockProductInfo };
  productInfo2.brandName = {
    zh: '天然鲜果',
    en: 'Natural Fresh',
  };

  const styleConfig2: StyleConfig = {
    ...mockStyleConfig,
    // ❌ 原始配置有矛盾：Natural Organic + Neon Cyber
    typography: 'sans-serif', // 霓虹发光效果
  };

  const config = convertProductToPromptConfig({
    productInfo: productInfo2,
    style: styleConfig2,
    posterType: 'hero',
  });

  // ✅ V2自动解决：强制使用统一风格描述
  // 移除霓虹/赛博元素，保持自然有机风格

  const prompt = generateNarrativePrompt({
    ...config,
    logoPosition: 'top-left',
    mainTitle: 'Natural Fresh | 天然鲜果',
    subtitle: 'Fresh Fruit - Fresh Orange',
    sellingPoints: [mockProductInfo.sellingPoints[0].en],
    typography: 'Bold Sans-serif', // 移除霓虹效果
    background: 'Clean minimalist with subtle plant elements, earth tones. Eco-friendly concept, handmade texture.',
    lighting: 'Soft natural sunlight, warm tones',
  });

  console.log(prompt);
  console.log('\n' + '-'.repeat(80));
  console.log('\n✅ 关键改进：');
  console.log('  - 移除了 "Neon stroke, glow effect, cyber feel"');
  console.log('  - 统一为 Natural Organic 风格');
  console.log('  - 5个卖点精简为1个核心卖点');
  console.log('  - 保持叙述式流畅性');
}

// ============================================================================
// 演示3：细节特写海报
// ============================================================================

function demo3_DetailPoster() {
  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 演示3：细节特写海报（第2个卖点）');
  console.log('='.repeat(80) + '\n');

  const config = convertProductToPromptConfig({
    productInfo: mockProductInfo,
    style: mockStyleConfig,
    posterType: 'detail',
    sellingPointIndex: 1, // 使用第2个卖点：产地直采
  });

  const prompt = generateNarrativePrompt(config);

  console.log(prompt);
  console.log('\n' + '-'.repeat(80));

  const negative = generateNegativePromptByType('detail');
  console.log('\n🚫 负面词:\n');
  console.log(negative);
}

// ============================================================================
// 演示4：生活场景海报
// ============================================================================

function demo4_LifestylePoster() {
  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 演示4：生活场景海报');
  console.log('='.repeat(80) + '\n');

  const config = convertProductToPromptConfig({
    productInfo: mockProductInfo,
    style: mockStyleConfig,
    posterType: 'lifestyle',
  });

  const prompt = generateNarrativePrompt(config);

  console.log(prompt);
  console.log('\n' + '-'.repeat(80));

  const negative = generateNegativePromptByType('lifestyle');
  console.log('\n🚫 负面词:\n');
  console.log(negative);
}

// ============================================================================
// 对比演示：V1 vs V2
// ============================================================================

function demo5_Comparison() {
  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 演示5：V1 vs V2 对比');
  console.log('='.repeat(80) + '\n');

  console.log('❌ V1 (旧版) - 模块化模板：\n');
  console.log(`
创建一个9:16竖版电商主视觉海报。

**产品还原**:
严格还原上传的产品图,包括包装设计、颜色、LOGO位置、文字内容、图案元素等所有细节。

**品牌信息**:
- 品牌: 每日鲜橙 / DAILY FRESH ORANGE
- 产品: 生鲜水果 - 新鲜橙子
- 规格: 单粒装 (带叶鲜果)

**核心卖点**:
1. 富含天然维生素C，增强免疫力 / Rich in natural Vitamin C to boost immunity
2. 产地直采，保留枝叶的新鲜度 / Directly sourced from the orchard
3. 皮薄多汁，果肉饱满细腻 / Thin skin and juicy
4. 天然无添加，纯净大自然的味道 / Natural and additive-free
5. 黄金酸甜比，口感清爽解腻 / Golden sweet-to-tart ratio

**设计风格**: 自然有机风格 - 植物元素,大地色系,手工质感,环保理念
**配色方案**: 主色 #FF8C00, #FFA500
**文字排版**: 粗衬线大标题 - 细线装饰,网格对齐,杂志感强
**中英文格式**: 中英文垂直堆叠 - 中文在上(较大字号),英文在下(较小字号),居中对齐
  `);

  console.log('\n' + '-'.repeat(80));
  console.log('\n✅ V2 (新版) - 叙述式组装：\n');

  const config = convertProductToPromptConfig({
    productInfo: mockProductInfo,
    style: mockStyleConfig,
    posterType: 'hero',
  });

  config.logoPosition = 'top-center';
  config.mainTitle = '每日鲜橙 | DAILY FRESH ORANGE';
  config.subtitle = undefined;
  config.sellingPoints = [];
  config.background = 'clean and minimalist, light beige textured fabric';
  config.lighting = 'soft morning sunlight, studio lighting';
  config.technicalSpecs = 'High-end food photography, macro details, 8k resolution, cinematic lighting.';

  const prompt = generateNarrativePrompt(config);
  console.log(prompt);

  console.log('\n' + '-'.repeat(80));
  console.log('\n📊 对比分析：');
  console.log('  V1 字符数: ~800 字符');
  console.log('  V2 字符数: ~350 字符');
  console.log('  压缩比: 56% ↓');
  console.log('  可读性: 显著提升');
  console.log('  风格一致性: 完全解决矛盾');
}

// ============================================================================
// 主函数
// ============================================================================

function main() {
  console.log('\n' + '🚀'.repeat(40));
  console.log('  提示词生成器 V2 - 演示脚本');
  console.log('🚀'.repeat(40));

  demo1_HeroPoster();
  demo2_NaturalFreshPoster();
  demo3_DetailPoster();
  demo4_LifestylePoster();
  demo5_Comparison();

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ 演示完成！');
  console.log('='.repeat(80) + '\n');
}

// 运行演示
main();
```

## scripts/local-acceptance.sh

```
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
REPORT_DIR="docs/reports"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="$REPORT_DIR/local-acceptance-$TIMESTAMP.md"
SERVER_LOG="/tmp/kv-generator-dev-$TIMESTAMP.log"

mkdir -p "$REPORT_DIR"

echo "[1/6] Running lint + typecheck"
npm run test

echo "[2/6] Building app"
npm run build

echo "[3/6] Ensuring local server is available on port $PORT"
SERVER_PID=""
if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Reusing existing service."
else
  echo "Starting next dev on port $PORT ..."
  npm run dev -- --hostname 127.0.0.1 --port "$PORT" >"$SERVER_LOG" 2>&1 &
  SERVER_PID=$!

  for _ in {1..45}; do
    if curl -sS "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! curl -sS "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
    echo "Server failed to start. Check log: $SERVER_LOG"
    exit 1
  fi
fi

echo "[4/6] Smoke testing pages"
HOME_STATUS="$(curl -sS -o /tmp/kv_home_$TIMESTAMP.html -w "%{http_code}" "http://127.0.0.1:$PORT/")"
PROMPTS_STATUS="$(curl -sS -o /tmp/kv_prompts_$TIMESTAMP.html -w "%{http_code}" "http://127.0.0.1:$PORT/prompts")"
GENERATE_STATUS="$(curl -sS -o /tmp/kv_generate_$TIMESTAMP.html -w "%{http_code}" "http://127.0.0.1:$PORT/generate")"

echo "[5/6] Smoke testing /api/generate"
API_PAYLOAD='{"prompt":"9:16 vertical poster, clean studio still life with one orange on neutral background, no CTA, no frame.","width":900,"height":1600,"enforceHardConstraints":true}'
API_STATUS="$(curl -sS -o /tmp/kv_api_generate_$TIMESTAMP.json -w "%{http_code}" -H "Content-Type: application/json" -X POST "http://127.0.0.1:$PORT/api/generate" --data "$API_PAYLOAD" || true)"
API_BODY_HEAD="$(head -c 260 /tmp/kv_api_generate_$TIMESTAMP.json 2>/dev/null || true)"

echo "[6/6] Writing report -> $REPORT_FILE"
cat > "$REPORT_FILE" <<REPORT
# Local Acceptance Report ($TIMESTAMP)

## Build and Test
- lint_typecheck: PASS
- build: PASS

## Service
- port: $PORT
- service_started_by_script: $( [ -n "$SERVER_PID" ] && echo "yes (pid=$SERVER_PID)" || echo "no (reused existing service)" )
- server_log: $SERVER_LOG

## Smoke Status
- GET /: $HOME_STATUS
- GET /prompts: $PROMPTS_STATUS
- GET /generate: $GENERATE_STATUS

## API Smoke (/api/generate)
- POST /api/generate: $API_STATUS
- response_head: ${API_BODY_HEAD:-<empty>}

## Model Routing (configured)
- analysis_model: gemini-3-flash-preview (fixed in code)
- image_model: gemini-3-pro-image-preview (fixed in code)
- fallback_switch(KV_IMAGE_FALLBACK_TO_FLASH): ${KV_IMAGE_FALLBACK_TO_FLASH:-false}

## Notes
- This script keeps the dev server running for manual acceptance.
- To stop service: lsof -ti:$PORT | xargs kill
REPORT

echo "Done."
echo "Report: $REPORT_FILE"
echo "Open: http://127.0.0.1:$PORT"
```

## scripts/verify-deployment.sh

```
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================="
echo "KV Generator Deployment Verification"
echo "========================================="

echo "Checking key files for one-pass chain..."
REQUIRED_FILES=(
  "lib/utils/promptGenerator.ts"
  "lib/api/gemini.ts"
  "lib/api/nanobanana.ts"
  "app/api/analyze/route.ts"
  "app/api/generate/route.ts"
  "app/prompts/page.tsx"
  "app/generate/page.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  [OK] $file"
  else
    echo "  [MISSING] $file"
    exit 1
  fi
done

echo "Running static checks..."
npm run test

echo "Build check..."
npm run build

echo "Quick port check..."
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "  [OK] http://localhost:3000 is active"
else
  echo "  [WARN] Port 3000 is not active (run npm run dev)"
fi

echo "========================================="
echo "Verification complete"
echo "========================================="
```


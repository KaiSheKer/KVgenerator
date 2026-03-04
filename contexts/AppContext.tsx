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
  promptStyle?: 'concise' | 'detailed'; // 提示词风格：简洁型(150-250字) 或 详细型(600-1000字)
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
  usedFlashFallback?: boolean;
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

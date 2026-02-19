'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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
}

export interface StyleConfig {
  visual: string;
  typography: string;
  textLayout: 'stacked' | 'parallel' | 'separated';
}

export interface PosterPrompt {
  id: string;
  title: string;
  titleEn: string;
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  promptZh: string;
  promptEn: string;
  negative: string;
}

export interface PromptsSystem {
  logo: string;
  posters: PosterPrompt[];
}

export interface GeneratedPoster {
  id: string;
  url: string;
  status: 'completed' | 'failed';
}

interface AppState {
  currentStep: number;
  uploadedImage: UploadedImage | null;
  productInfo: AnalysisResponse | null;
  editedProductInfo: AnalysisResponse | null;
  selectedStyle: StyleConfig | null;
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
  setGeneratedPrompts: (prompts: PromptsSystem) => void;
  setGeneratedPosters: (posters: GeneratedPoster[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 创建 Context
const AppContext = createContext<AppState & AppActions | undefined>(undefined);

// Provider 组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentStep: 0,
    uploadedImage: null,
    productInfo: null,
    editedProductInfo: null,
    selectedStyle: null,
    generatedPrompts: null,
    generatedPosters: null,
    isLoading: false,
    error: null,
  });

  const actions: AppActions = {
    setCurrentStep: (step) => setState((prev) => ({ ...prev, currentStep: step })),
    setUploadedImage: (image) => setState((prev) => ({ ...prev, uploadedImage: image })),
    setProductInfo: (info) => setState((prev) => ({ ...prev, productInfo: info, editedProductInfo: info })),
    updateProductInfo: (info) => setState((prev) => ({
      ...prev,
      editedProductInfo: prev.editedProductInfo ? { ...prev.editedProductInfo, ...info } : null
    })),
    setSelectedStyle: (style) => setState((prev) => ({ ...prev, selectedStyle: style })),
    setGeneratedPrompts: (prompts) => setState((prev) => ({ ...prev, generatedPrompts: prompts })),
    setGeneratedPosters: (posters) => setState((prev) => ({ ...prev, generatedPosters: posters })),
    setLoading: (loading) => setState((prev) => ({ ...prev, isLoading: loading })),
    setError: (error) => setState((prev) => ({ ...prev, error })),
    reset: () => setState({
      currentStep: 0,
      uploadedImage: null,
      productInfo: null,
      editedProductInfo: null,
      selectedStyle: null,
      generatedPrompts: null,
      generatedPosters: null,
      isLoading: false,
      error: null,
    }),
  };

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

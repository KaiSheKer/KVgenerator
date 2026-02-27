// lib/utils/promptGenerator.ts

import { AnalysisResponse, StyleConfig, PosterOverlaySpec } from '@/contexts/AppContext';
import { generateConcisePrompt } from './concisePromptGenerator';
import { generateDetailedPrompt } from './detailedPromptGenerator';
import { optimizeCopy } from './copyOptimizer';
import { buildDetailedLayout } from './layoutBuilder';

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

/**
 * 生成提示词系统（支持双风格）
 *
 * @param productInfo - 产品分析结果
 * @param style - 风格配置
 * @param promptStyle - 提示词风格：'concise' | 'detailed' (默认: 'concise')
 */
export function generatePrompts(
  productInfo: AnalysisResponse,
  style: StyleConfig,
  promptStyle: 'concise' | 'detailed' = 'concise'
): PromptsSystem {

  const posters = generateAllPosters(productInfo, style, promptStyle);

  return {
    logo: `${productInfo.brandName.en} | ${productInfo.brandName.zh}`,
    posters,
  };
}

/**
 * 生成所有10张海报的提示词
 */
function generateAllPosters(
  productInfo: AnalysisResponse,
  style: StyleConfig,
  promptStyle: 'concise' | 'detailed'
): PosterPrompt[] {

  const posterTypes: Array<'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage'> = [
    'hero',
    'lifestyle',
    'process',
    'detail',
    'detail',
    'detail',
    'detail',
    'brand',
    'specs',
    'usage',
  ];

  const posterTitles = [
    { id: '01', title: '主KV视觉', titleEn: 'Hero Visual' },
    { id: '02', title: '生活场景', titleEn: 'Lifestyle Scene' },
    { id: '03', title: '工艺概念', titleEn: 'Process Concept' },
    { id: '04', title: '细节特写01', titleEn: 'Detail Focus 01' },
    { id: '05', title: '细节特写02', titleEn: 'Detail Focus 02' },
    { id: '06', title: '细节特写03', titleEn: 'Detail Focus 03' },
    { id: '07', title: '细节特写04', titleEn: 'Detail Focus 04' },
    { id: '08', title: '品牌故事', titleEn: 'Brand Story' },
    { id: '09', title: '产品参数', titleEn: 'Specifications' },
    { id: '10', title: '使用指南', titleEn: 'Usage Guide' },
  ];

  return posterTypes.map((type, index) => {
    const { id, title, titleEn } = posterTitles[index];
    return generateSinglePoster(
      id,
      title,
      titleEn,
      type,
      index,
      productInfo,
      style,
      promptStyle
    );
  });
}

/**
 * 生成单张海报的提示词
 */
function generateSinglePoster(
  id: string,
  title: string,
  titleEn: string,
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage',
  index: number,
  productInfo: AnalysisResponse,
  style: StyleConfig,
  promptStyle: 'concise' | 'detailed'
): PosterPrompt {

  // 优化文案
  const originalCopy = productInfo.sellingPoints[index] || productInfo.sellingPoints[0];
  const optimizedCopy = optimizeCopy(originalCopy, {
    posterType: type,
    brandTone: productInfo.brandTone,
    targetAudience: productInfo.targetAudience,
    designStyle: productInfo.designStyle,
    parameters: productInfo.parameters,
  });

  // 构建标题
  const posterTitle = {
    zh: optimizedCopy.zh || productInfo.productType.specific,
    en: optimizedCopy.en || productInfo.productType.specific,
  };

  const posterSubtitle = optimizedCopy.subtitle ? {
    zh: optimizedCopy.subtitle.zh,
    en: optimizedCopy.subtitle.en,
  } : undefined;

  // 根据风格生成提示词
  let promptResult;
  if (promptStyle === 'concise') {
    promptResult = generateConcisePrompt({
      productInfo,
      style,
      posterType: type,
      title: posterTitle,
      subtitle: posterSubtitle,
    });
  } else {
    promptResult = generateDetailedPrompt({
      productInfo,
      style,
      posterType: type,
      title: posterTitle,
      subtitle: posterSubtitle,
    });
  }

  // 构建overlaySpec（保持向后兼容）
  const overlaySpec = buildOverlaySpec({
    type,
    title: posterTitle,
    subtitle: posterSubtitle,
    productInfo,
  });

  return {
    id,
    title,
    titleEn,
    type,
    promptZh: promptResult.promptZh,
    promptEn: promptResult.promptEn,
    negative: promptResult.negative,
    runtimePromptEn: promptResult.promptEn,
    runtimePromptAnchorEn: promptResult.promptEn,
    runtimeMainPromptEn: promptResult.promptEn,
    runtimeLayoutPromptEn: promptResult.layoutConfig,
    runtimeNegative: promptResult.negative,
    overlaySpec,
  };
}

/**
 * 构建overlaySpec（向后兼容）
 */
function buildOverlaySpec(args: {
  type: string;
  title: { zh: string; en: string };
  subtitle?: { zh: string; en: string };
  productInfo: AnalysisResponse;
}): PosterOverlaySpec {
  const { type, title, subtitle, productInfo } = args;

  const palette = {
    primary: productInfo.colorScheme.primary[0] || '#5F77FF',
    secondary: productInfo.colorScheme.secondary[0] || '#8CA2FF',
    accent: productInfo.colorScheme.accent[0] || '#C248FF',
    textOnDark: '#F7F8FF',
  };

  const layoutMap: Record<string, PosterOverlaySpec['layout']> = {
    hero: 'hero',
    lifestyle: 'lifestyle',
    specs: 'specs',
    detail: 'generic',
    process: 'generic',
    brand: 'generic',
    usage: 'generic',
  };

  return {
    layout: layoutMap[type] || 'generic',
    titleZh: title.zh,
    titleEn: title.en,
    subtitleZh: subtitle?.zh || '',
    subtitleEn: subtitle?.en || '',
    bullets: [],
    logoText: `${productInfo.brandName.en} | ${productInfo.brandName.zh}`,
    palette,
  };
}

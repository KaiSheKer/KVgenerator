// lib/utils/concisePromptGenerator.ts

import { AnalysisResponse, StyleConfig } from '@/contexts/AppContext';
import { getSceneKeywords, getLightingHint, getPhotographyStyle } from './posterTypeConfig';

/**
 * 简洁型提示词生成器
 * 参考：阳光鲜橙示例文档
 * 特点：150-250字，一段话+版式配置，密集精准
 */

export interface ConcisePromptConfig {
  productInfo: AnalysisResponse;
  style: StyleConfig;
  posterType: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  title: { zh: string; en: string };
  subtitle?: { zh: string; en: string };
}

/**
 * 生成简洁型提示词（中英双语）
 */
export function generateConcisePrompt(
  config: ConcisePromptConfig
): { promptZh: string; promptEn: string; negative: string; layoutConfig: string } {

  const { productInfo, style, posterType, title, subtitle } = config;

  // 英文提示词
  const promptEn = buildConcisePromptEn(config);

  // 中文提示词（对应翻译）
  const promptZh = buildConcisePromptZh(config);

  // 负面词
  const negative = buildConciseNegative(posterType);

  // 版式配置
  const layoutConfig = buildConciseLayoutConfig(config);

  return {
    promptZh,
    promptEn,
    negative,
    layoutConfig,
  };
}

/**
 * 构建简洁型英文提示词
 * 参考阳光鲜橙示例的结构
 */
function buildConcisePromptEn(config: ConcisePromptConfig): string {
  const { productInfo, style, posterType, title, subtitle } = config;

  const aspectRatio = style.aspectRatio || '9:16';
  const orientation = aspectRatio === '9:16' ? 'vertical' : 'horizontal';
  const sceneKeywords = getSceneKeywords(posterType);
  const lighting = getLightingHint(posterType);
  const photographyStyle = getPhotographyStyle(posterType);

  // 视觉风格描述
  const visualStyle = resolveVisualStyle(style.visual);

  // 背景建议
  const background = buildBackgroundSuggestion(posterType, productInfo.colorScheme.primary[0]);

  // 产品描述
  const productName = productInfo.productType.specific || productInfo.productType.category;

  // 组装提示词
  const parts = [
    // 开头：比例+风格+光影
    `${aspectRatio} ${orientation} poster, ${visualStyle}, ${lighting}.`,

    // 背景
    `${background}`,

    // 主体描述
    `The central focus is ${buildMainSubject(productName, posterType)}.`,

    // 文案元素
    `Text elements: ${buildTextElements(title, subtitle, style.textLayout)}.`,

    // 产品还原要求
    `Please strictly restore the product from the uploaded image.`,

    // 摄影质量
    `${photographyStyle}, 8k resolution, commercial quality.`,
  ];

  return parts.join(' ');
}

/**
 * 构建简洁型中文提示词
 */
function buildConcisePromptZh(config: ConcisePromptConfig): string {
  const { productInfo, style, posterType, title, subtitle } = config;

  const aspectRatio = style.aspectRatio || '9:16';
  const orientation = aspectRatio === '9:16' ? '竖版' : '横版';
  const sceneKeywords = getSceneKeywords(posterType);
  const lighting = getLightingHint(posterType);

  const visualStyle = resolveVisualStyleZh(style.visual);
  const background = buildBackgroundSuggestionZh(posterType);
  const productName = productInfo.productType.specific || productInfo.productType.category;

  const parts = [
    `${aspectRatio}${orientation}海报，${visualStyle}风格，${lighting}。`,
    `${background}。`,
    `画面中心：${buildMainSubjectZh(productName, posterType)}。`,
    `文案元素：${buildTextElementsZh(title, subtitle, style.textLayout)}。`,
    `请严格还原上传的产品图。`,
    `商业级品质，8k分辨率。`,
  ];

  return parts.join('');
}

/**
 * 构建版式配置（简洁型）
 */
function buildConciseLayoutConfig(config: ConcisePromptConfig): string {
  const { posterType, title, subtitle } = config;

  const lines: string[] = [];

  // Logo位置
  lines.push('Top Center: Brand Logo.');

  // 根据海报类型配置版式
  switch (posterType) {
    case 'hero':
      lines.push('Center: Main Product Hero Shot.');
      lines.push(`Bottom: Main Title '${title.zh}' / '${title.en}' (Large CN, Small EN).`);
      if (subtitle) {
        lines.push(`Bottom-Left: Subtitle '${subtitle.zh}' / '${subtitle.en}'.`);
      }
      break;

    case 'lifestyle':
      lines.push('Middle-Right: Slogan vertically aligned.');
      lines.push('Bottom Center: Glassmorphism bar with lifestyle text.');
      break;

    case 'detail':
      lines.push('Center-focused composition.');
      lines.push(`Top: Large Bold CN '${title.zh}' with smaller EN '${title.en}' below it.`);
      break;

    default:
      lines.push(`Center: Main Title '${title.zh}' (Large CN) / '${title.en}' (Small EN).`);
  }

  return lines.join('\n');
}

/**
 * 构建简洁型负面词
 */
function buildConciseNegative(posterType: string): string {
  const base = [
    'cluttered',
    'busy',
    'messy',
    'blurry',
    'low quality',
    'watermark',
    'extra unrelated logo',
    'cta button',
    'qr code',
  ];

  const typeSpecific: Record<string, string[]> = {
    hero: ['subject too small', 'busy background'],
    lifestyle: ['overcrowded scene', 'staged pose'],
    detail: ['soft focus', 'over-sharpen halos'],
    process: ['confusing layout', 'too much text'],
  };

  const specifics = typeSpecific[posterType] || [];
  return [...base, ...specifics].join(', ');
}

// ============================================================================
// 辅助构建函数
// ============================================================================

function resolveVisualStyle(visual: string): string {
  const styleMap: Record<string, string> = {
    magazine: 'Modern Luxury Photo Editorial',
    watercolor: 'Soft Natural Photo Editorial',
    tech: 'Futuristic Product Photography',
    vintage: 'Filmic Product Photography',
    minimal: 'Minimalist Studio Photography',
    cyber: 'Neon Urban Photo Editorial',
    organic: 'Natural Organic Product Photography',
  };
  return styleMap[visual] || styleMap.magazine;
}

function resolveVisualStyleZh(visual: string): string {
  const styleMap: Record<string, string> = {
    magazine: '现代奢华杂志编辑',
    watercolor: '柔和自然艺术',
    tech: '未来科技摄影',
    vintage: '复古胶片摄影',
    minimal: '极简工作室摄影',
    cyber: '霓虹都市编辑',
    organic: '自然有机产品摄影',
  };
  return styleMap[visual] || styleMap.magazine;
}

function buildBackgroundSuggestion(posterType: string, primaryColor?: string): string {
  const backgrounds: Record<string, string> = {
    hero: `minimalist gradient background with ${primaryColor || 'soft'} tones`,
    lifestyle: 'natural environment background',
    detail: 'blurred background with bokeh effect',
    process: 'clean studio background',
    brand: 'cinematic atmospheric background',
    specs: 'clean neutral background',
    usage: 'clean background with guide elements',
  };
  return backgrounds[posterType] || backgrounds.hero;
}

function buildBackgroundSuggestionZh(posterType: string): string {
  const backgrounds: Record<string, string> = {
    hero: '极简渐变背景',
    lifestyle: '自然环境背景',
    detail: '虚化背景（散景效果）',
    process: '干净的工作室背景',
    brand: '电影感氛围背景',
    specs: '干净的中性背景',
    usage: '带有指导元素的干净背景',
  };
  return backgrounds[posterType] || backgrounds.hero;
}

function buildMainSubject(productName: string, posterType: string): string {
  const subjects: Record<string, string> = {
    hero: `a single, perfect ${productName}, exactly as shown in the original product image`,
    lifestyle: `${productName} in natural daily life context`,
    detail: `extreme close-up of ${productName} details`,
    process: `${productName} with technical visualization`,
    brand: `${productName} in brand storytelling scene`,
    specs: `top-down view of ${productName}`,
    usage: `${productName} with instructional flow`,
  };
  return subjects[posterType] || subjects.hero;
}

function buildMainSubjectZh(productName: string, posterType: string): string {
  const subjects: Record<string, string> = {
    hero: `单个完美的${productName}，与原图完全一致`,
    lifestyle: `在日常生活场景中的${productName}`,
    detail: `${productName}的极端特写细节`,
    process: `${productName}的技术可视化`,
    brand: `品牌故事场景中的${productName}`,
    specs: `${productName}的俯视图`,
    usage: `带有指导流程的${productName}`,
  };
  return subjects[posterType] || subjects.hero;
}

function buildTextElements(
  title: { zh: string; en: string },
  subtitle?: { zh: string; en: string },
  textLayout?: string
): string {
  const layoutFormat = textLayout === 'stacked'
    ? `Large Chinese '${title.zh}' stacked over English '${title.en}'`
    : textLayout === 'parallel'
    ? `Chinese '${title.zh}' and English '${title.en}' side by side`
    : `Large '${title.zh}' / '${title.en}'`;

  if (subtitle) {
    return `${layoutFormat}. Subtitle: '${subtitle.zh}' / '${subtitle.en}'`;
  }

  return layoutFormat;
}

function buildTextElementsZh(
  title: { zh: string; en: string },
  subtitle?: { zh: string; en: string },
  textLayout?: string
): string {
  const layoutFormat = textLayout === 'stacked'
    ? `大号中文'${title.zh}'堆叠在小号英文'${title.en}'上方`
    : textLayout === 'parallel'
    ? `中文'${title.zh}'和英文'${title.en}'并列`
    : `大号'${title.zh}' / '${title.en}'`;

  if (subtitle) {
    return `${layoutFormat}。副标题：'${subtitle.zh}' / '${subtitle.en}'`;
  }

  return layoutFormat;
}

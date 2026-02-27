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
 * 参考提示词说明.md的逻辑：分部分描述，使用所有AI分析字段
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

  // 产品名称
  const productName = productInfo.productType.specific || productInfo.productType.category;

  // 组装提示词 - 分部分结构
  const parts = [
    // 第1部分：基础信息
    `${aspectRatio} ${orientation} poster, ${visualStyle}, ${lighting}.`,

    // 第2部分：场景描述
    buildSceneDescription(productInfo, posterType),

    // 第3部分：产品展示（独立部分，用bullet points）
    buildProductDisplay(productInfo),

    // 第4部分：文案元素
    `Text: ${buildTextElements(title, subtitle, style.textLayout)}.`,

    // 第5部分：产品还原要求
    `Please strictly restore the product from the uploaded image, including all packaging details.`,
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
    `${background}。${sceneKeywords.join('，')}。`,
    `画面中心：${buildMainSubjectZh(productName, posterType)}`,
    `文案元素：${buildTextElementsZh(title, subtitle, style.textLayout)}。`,
    `产品还原：请严格还原上传的产品图。`,
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
    lifestyle: 'natural environment background suggesting authentic daily life setting',
    detail: 'blurred background with soft bokeh effect',
    process: 'clean studio background suitable for technical visualization',
    brand: 'cinematic atmospheric background that conveys brand mood',
    specs: 'clean neutral background with minimalist styling',
    usage: 'clean background with instructional elements',
  };
  return backgrounds[posterType] || backgrounds.hero;
}

function buildBackgroundSuggestionZh(posterType: string): string {
  const backgrounds: Record<string, string> = {
    hero: '极简渐变背景',
    lifestyle: '自然环境背景，暗示真实日常生活场景',
    detail: '虚化背景，柔和散景效果',
    process: '干净工作室背景，适合技术可视化',
    brand: '电影感氛围背景，传达品牌情绪',
    specs: '干净中性背景，极简风格',
    usage: '干净背景，带指导元素',
  };
  return backgrounds[posterType] || backgrounds.hero;
}

function buildMainSubject(productName: string, posterType: string): string {
  const subjects: Record<string, string> = {
    hero: `A single, perfect ${productName}, exactly as shown in the original product image. The texture and details are crisp and well-defined.`,

    lifestyle: `On a table or counter, the ${productName} is shown in natural daily life context. Surrounding elements suggest authentic everyday use. Warm, inviting atmosphere.`,

    detail: `Extreme close-up of ${productName} texture and details. The microscopic surface, material grain, and craftsmanship are highly visible. Shallow depth of field with smooth bokeh background.`,

    process: `${productName} with technical visualization showing internal structure or key features. Conceptual illustration style with floating elements or x-ray views revealing product details.`,

    brand: `${productName} in brand storytelling scene. Cinematic atmosphere conveys brand values and heritage. Background elements tell the brand story - origin, craftsmanship, or philosophy.`,

    specs: `Top-down flat lay view of ${productName}. Clean, organized arrangement showing product proportions. Minimalist styling with clear visibility.`,

    usage: `${productName} with step-by-step usage demonstration. Clear instructional flow showing how to use the product. Simple icons or numbered steps. Clean layout.`,
  };
  return subjects[posterType] || subjects.hero;
}

function buildMainSubjectZh(productName: string, posterType: string): string {
  const subjects: Record<string, string> = {
    hero: `单个完美的${productName}，与原图完全一致。纹理和细节清晰锐利，质感细腻。`,

    lifestyle: `${productName}在桌子或台面上，自然日常生活场景。周围元素暗示真实日常使用。温暖、亲切的氛围。`,

    detail: `${productName}的极端微距特写，聚焦纹理和细节。微观表面、材质颗粒和工艺高度可见。浅景深，背景虚化。`,

    process: `${productName}的技术可视化，展示内部结构或核心特点。概念插图风格，带有浮动元素或透视效果，展现产品细节。`,

    brand: `${productName}在品牌故事场景中。电影感氛围传达品牌价值和传承。背景元素讲述品牌故事——产地、工艺或理念。`,

    specs: `${productName}的俯视平铺视图。干净有序的排列，展示产品比例。极简风格，清晰可见。`,

    usage: `${productName}的分步使用演示。清晰的教学流程，展示如何使用产品。简单图标或编号步骤。干净布局。`,
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

// ============================================================================
// 新增：使用所有AI分析字段的辅助函数
// ============================================================================

/**
 * 构建场景描述（使用designStyle, brandTone, packagingHighlights）
 */
function buildSceneDescription(productInfo: AnalysisResponse, posterType: string): string {
  const designStyle = productInfo.designStyle || '';
  const brandTone = productInfo.brandTone || '';

  const scenes: Record<string, string> = {
    hero: `Minimalist ${designStyle} style, ${brandTone} atmosphere. Clean composition with negative space.`,

    lifestyle: `${designStyle} lifestyle photography showing ${productInfo.productType.specific} in authentic daily life context. ${brandTone} mood. Surrounding elements suggest everyday use.`,

    detail: `Macro photography focus on ${productInfo.productType.specific} details. ${designStyle} aesthetic with controlled lighting to emphasize texture and craftsmanship.`,

    process: `Technical visualization showing ${productInfo.productType.specific} features. ${designStyle} illustration style with floating elements or annotations.`,

    brand: `${brandTone} brand storytelling scene. Cinematic atmosphere with ${designStyle} aesthetics. Background elements convey brand values.`,

    specs: `Technical infographic style, clean ${designStyle} layout. Top-down view showing product proportions with minimal annotations.`,

    usage: `Instructional demonstration style, clear ${designStyle} aesthetics. Step-by-step flow showing how to use ${productInfo.productType.specific}.`,
  };

  return scenes[posterType] || scenes.hero;
}

/**
 * 构建产品展示部分（使用所有AI分析字段，bullet points格式）
 */
function buildProductDisplay(productInfo: AnalysisResponse): string {
  const parts: string[] = [];

  const productName = productInfo.productType.specific || productInfo.productType.category;
  parts.push(`${productInfo.brandName.en} ${productInfo.brandName.zh} ${productName} packaging design.`);

  if (productInfo.colorScheme.primary && productInfo.colorScheme.primary.length > 0) {
    parts.push(`Primary colors: ${productInfo.colorScheme.primary.join(', ')}`);
  }
  if (productInfo.colorScheme.secondary && productInfo.colorScheme.secondary.length > 0) {
    parts.push(`Secondary colors: ${productInfo.colorScheme.secondary.join(', ')}`);
  }
  if (productInfo.colorScheme.accent && productInfo.colorScheme.accent.length > 0) {
    parts.push(`Accent colors: ${productInfo.colorScheme.accent.join(', ')}`);
  }

  if (productInfo.designStyle) {
    parts.push(`Design style: ${productInfo.designStyle}`);
  }

  if (productInfo.packagingHighlights && productInfo.packagingHighlights.length > 0) {
    productInfo.packagingHighlights.forEach(highlight => {
      if (highlight) parts.push(`- ${highlight}`);
    });
  }

  if (productInfo.specifications) {
    parts.push(`Specifications: ${productInfo.specifications}`);
  }

  const params = productInfo.parameters;
  if (params.netContent) parts.push(`Net content: ${params.netContent}`);
  if (params.ingredients) parts.push(`Ingredients: ${params.ingredients}`);
  if (params.nutrition) parts.push(`Nutrition: ${params.nutrition}`);
  if (params.usage) parts.push(`Usage: ${params.usage}`);
  if (params.shelfLife) parts.push(`Shelf life: ${params.shelfLife}`);
  if (params.storage) parts.push(`Storage: ${params.storage}`);

  return parts.join('. ');
}

/**
 * 构建场景描述（中文版）
 */
function buildSceneDescriptionZh(productInfo: AnalysisResponse, posterType: string): string {
  const designStyle = productInfo.designStyle || '';
  const brandTone = productInfo.brandTone || '';

  const scenes: Record<string, string> = {
    hero: `极简${designStyle}风格，${brandTone}氛围。干净构图，大量留白。`,

    lifestyle: `${designStyle}生活摄影风格，展示${productInfo.productType.specific}在真实日常生活场景中。${brandTone}情绪。周围元素暗示日常使用。`,

    detail: `微距摄影聚焦${productInfo.productType.specific}细节。${designStyle}美学，受控光照强调纹理和工艺。`,

    process: `技术可视化展示${productInfo.productType.specific}特点。${designStyle}插图风格，带有浮动元素或注释。`,

    brand: `${brandTone}品牌故事场景。电影感氛围，${designStyle}美学。背景元素传达品牌价值。`,

    specs: `技术信息图表风格，干净${designStyle}布局。俯视图展示产品比例，极简注释。`,

    usage: `教学演示风格，清晰${designStyle}美学。分步流程展示如何使用${productInfo.productType.specific}。`,
  };

  return scenes[posterType] || scenes.hero;
}

/**
 * 构建产品展示部分（中文版）
 */
function buildProductDisplayZh(productInfo: AnalysisResponse): string {
  const parts: string[] = [];

  const productName = productInfo.productType.specific || productInfo.productType.category;
  parts.push(`${productInfo.brandName.zh}${productInfo.brandName.en}${productName}包装设计。`);

  if (productInfo.colorScheme.primary && productInfo.colorScheme.primary.length > 0) {
    parts.push(`主色：${productInfo.colorScheme.primary.join('、')}`);
  }
  if (productInfo.colorScheme.secondary && productInfo.colorScheme.secondary.length > 0) {
    parts.push(`辅助色：${productInfo.colorScheme.secondary.join('、')}`);
  }
  if (productInfo.colorScheme.accent && productInfo.colorScheme.accent.length > 0) {
    parts.push(`点缀色：${productInfo.colorScheme.accent.join('、')}`);
  }

  if (productInfo.designStyle) {
    parts.push(`设计风格：${productInfo.designStyle}`);
  }

  if (productInfo.packagingHighlights && productInfo.packagingHighlights.length > 0) {
    productInfo.packagingHighlights.forEach(highlight => {
      if (highlight) parts.push(`- ${highlight}`);
    });
  }

  if (productInfo.specifications) {
    parts.push(`规格：${productInfo.specifications}`);
  }

  const params = productInfo.parameters;
  if (params.netContent) parts.push(`净含量：${params.netContent}`);
  if (params.ingredients) parts.push(`成分：${params.ingredients}`);
  if (params.nutrition) parts.push(`营养成分：${params.nutrition}`);
  if (params.usage) parts.push(`用法：${params.usage}`);
  if (params.shelfLife) parts.push(`保质期：${params.shelfLife}`);
  if (params.storage) parts.push(`储存：${params.storage}`);

  return parts.join('。');
}



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

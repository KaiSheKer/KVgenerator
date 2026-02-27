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

    // 第4部分：文案元素（如果用户没提供subtitle，让AI根据产品信息自己提炼）
    `Text: ${buildTextElements(title, subtitle, style.textLayout, productInfo)}.`,

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
    `文案元素：${buildTextElementsZh(title, subtitle, style.textLayout, productInfo)}。`,
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
  textLayout?: string,
  productInfo?: AnalysisResponse
): string {
  const layoutFormat = textLayout === 'stacked'
    ? `Large Chinese '${title.zh}' stacked over English '${title.en}'`
    : textLayout === 'parallel'
    ? `Chinese '${title.zh}' and English '${title.en}' side by side`
    : `Large '${title.zh}' / '${title.en}'`;

  if (subtitle) {
    return `${layoutFormat}. Subtitle: '${subtitle.zh}' / '${subtitle.en}'`;
  }

  // 如果用户没提供subtitle，让AI根据产品信息自己提炼一个核心卖点
  if (productInfo) {
    const sellingPointsHint = productInfo.sellingPoints && productInfo.sellingPoints.length > 0
      ? productInfo.sellingPoints.map(sp => sp.zh).join('、')
      : productInfo.specifications || productInfo.designStyle || '';

    return `${layoutFormat}. Generate a compelling 2-6 character subtitle in Chinese and English based on the product's key selling points: ${sellingPointsHint}`;
  }

  return layoutFormat;
}

function buildTextElementsZh(
  title: { zh: string; en: string },
  subtitle?: { zh: string; en: string },
  textLayout?: string,
  productInfo?: AnalysisResponse
): string {
  const layoutFormat = textLayout === 'stacked'
    ? `大号中文'${title.zh}'堆叠在小号英文'${title.en}'上方`
    : textLayout === 'parallel'
    ? `中文'${title.zh}'和英文'${title.en}'并列`
    : `大号'${title.zh}' / '${title.en}'`;

  if (subtitle) {
    return `${layoutFormat}。副标题：'${subtitle.zh}' / '${subtitle.en}'`;
  }

  // 如果用户没提供subtitle，让AI根据产品信息自己提炼一个核心卖点
  if (productInfo) {
    const sellingPointsHint = productInfo.sellingPoints && productInfo.sellingPoints.length > 0
      ? productInfo.sellingPoints.map(sp => sp.zh).join('、')
      : productInfo.specifications || productInfo.designStyle || '';

    return `${layoutFormat}。请根据产品核心卖点（${sellingPointsHint}）自主生成2-6个字的吸引人的中文副标题和英文副标题`;
  }

  return layoutFormat;
}

// ============================================================================
// 新增：使用所有AI分析字段的辅助函数
// ============================================================================

/**
 * 构建场景描述（根据海报类型关键词决定核心逻辑）
 * 关键词是场景描述的核心指令，决定了产品展示方式、视角、构图
 */
function buildSceneDescription(productInfo: AnalysisResponse, posterType: string): string {
  const productName = productInfo.productType.specific || productInfo.productType.category;
  const designStyle = productInfo.designStyle || '';
  const brandTone = productInfo.brandTone || '';

  // 根据海报类型的关键词决定场景描述的核心逻辑
  switch (posterType) {
    case 'hero':
      // 关键词: single hero object, center composition, clean gradient backdrop
      // → 场景核心：单个、居中、完美展示、严格还原
      return `The central focus is a single, perfect ${productName}. Center composition with clean gradient backdrop. ${productName} is shown exactly as in the uploaded product image. ${designStyle} style, ${brandTone} atmosphere. Clean composition with negative space.`;

    case 'lifestyle':
      // 关键词: daily life scene, natural usage context, authentic atmosphere
      // → 场景核心：产品在使用状态、日常生活环境、真实氛围
      return `${designStyle} lifestyle photography showing ${productName} in authentic daily life context. The product is shown in its natural usage state within a realistic setting - on a table, counter, or in hand. ${brandTone} mood. Surrounding elements suggest everyday use without cluttering the scene.`;

    case 'detail':
      // 关键词: macro close-up, texture focus, shallow depth of field, detail emphasis
      // → 场景核心：极端微距、聚焦纹理、浅景深
      return `Macro photography focus on ${productName} details. Extreme close-up showing microscopic texture, material surface, and product craftsmanship. Shallow depth of field with smooth bokeh background. ${designStyle} aesthetic with controlled lighting to emphasize texture and fine details.`;

    case 'process':
      // 关键词: technical visualization, process illustration, conceptual scene
      // → 场景核心：技术可视化、内部结构、概念化场景
      return `Technical visualization of ${productName} features. Conceptual illustration style showing internal structure, manufacturing process, or key selling points. ${designStyle} aesthetic with floating elements or annotations to reveal product details.`;

    case 'brand':
      // 关键词: brand storytelling, emotional atmosphere, cinematic scene
      // → 场景核心：品牌故事、情感氛围、电影感
      return `${brandTone} brand storytelling scene. Cinematic atmosphere with ${designStyle} aesthetics conveying brand values and heritage. Background elements tell the brand story - origin, craftsmanship, or philosophy. Emotional, aspirational mood.`;

    case 'specs':
      // 关键词: technical data, structured information, clean infographic
      // → 场景核心：俯视图、数据可视化、结构化信息
      return `Technical infographic style, clean ${designStyle} layout. Top-down view showing ${productName} with structured information and data. Clean lines pointing to different parts of the product. Minimalist styling with clear data visualization.`;

    case 'usage':
      // 关键词: step-by-step flow, instructional icons, clear process
      // → 场景核心：分步流程、教学图标、清晰过程
      return `Instructional demonstration style showing how to use ${productName}. Clear ${designStyle} aesthetics with step-by-step flow. Simple icons or numbered steps. Clean layout with the product as the focal point, making usage easy to understand.`;

    default:
      return `${productName} in ${designStyle} style. ${brandTone} atmosphere.`;
  }
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
 * 构建场景描述（中文版，根据海报类型关键词决定核心逻辑）
 */
function buildSceneDescriptionZh(productInfo: AnalysisResponse, posterType: string): string {
  const productName = productInfo.productType.specific || productInfo.productType.category;
  const designStyle = productInfo.designStyle || '';
  const brandTone = productInfo.brandTone || '';

  // 根据海报类型的关键词决定场景描述的核心逻辑
  switch (posterType) {
    case 'hero':
      // 关键词: single hero object, center composition
      // → 场景核心：单个、居中、完美展示
      return `画面中心：单个完美的${productName}，居中构图。干净渐变背景。${productName}与上传的产品图完全一致。${designStyle}风格，${brandTone}氛围。干净构图，大量留白。`;

    case 'lifestyle':
      // 关键词: daily life scene, natural usage context
      // → 场景核心：产品在使用状态、日常生活环境
      return `${designStyle}生活摄影风格，展示${productName}在真实日常生活场景中。产品处于自然使用状态，放置在桌子、台面或手中。${brandTone}情绪。周围元素暗示日常使用，不杂乱。`;

    case 'detail':
      // 关键词: macro close-up, texture focus, shallow depth of field
      // → 场景核心：极端微距、聚焦纹理
      return `微距摄影聚焦${productName}细节。极端特写展示微观纹理、材质表面和产品工艺。浅景深，背景虚化。${designStyle}美学，受控光照强调质感和精细细节。`;

    case 'process':
      // 关键词: technical visualization, conceptual scene
      // → 场景核心：技术可视化、内部结构
      return `${productName}的技术可视化。概念插图风格，展示内部结构、制造工艺或核心卖点。${designStyle}美学，带有浮动元素或注释，展现产品细节。`;

    case 'brand':
      // 关键词: brand storytelling, emotional atmosphere
      // → 场景核心：品牌故事、情感氛围
      return `${brandTone}品牌故事场景。电影感氛围，${designStyle}美学，传达品牌价值和传承。背景元素讲述品牌故事——产地、工艺或理念。情感化、令人向往的意境。`;

    case 'specs':
      // 关键词: technical data, structured information, clean infographic
      // → 场景核心：俯视图、数据可视化
      return `技术信息图表风格，干净${designStyle}布局。${productName}的俯视图，展示产品比例。结构化信息和数据可视化，清晰的线条指向产品不同部分。极简风格，清晰可见。`;

    case 'usage':
      // 关键词: step-by-step flow, instructional icons
      // → 场景核心：分步流程、教学图标
      return `教学演示风格，展示如何使用${productName}。清晰${designStyle}美学，分步流程。简单图标或编号步骤，干净布局，产品为焦点，让使用方法清晰易懂。`;

    default:
      return `${productName}在${designStyle}风格中，${brandTone}氛围。`;
  }
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


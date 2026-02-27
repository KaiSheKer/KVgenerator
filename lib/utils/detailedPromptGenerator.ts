// lib/utils/detailedPromptGenerator.ts

import { AnalysisResponse, StyleConfig } from '@/contexts/AppContext';
import { getSceneKeywords, getLightingHint } from './posterTypeConfig';
import { refineSellingPoints } from './sellingPointRefiner';

/**
 * 详细型提示词生成器
 * 参考：朗诺示例文档
 * 特点：600-1000字，多段落+详细排版说明，超详细描述
 */

export interface DetailedPromptConfig {
  productInfo: AnalysisResponse;
  style: StyleConfig;
  posterType: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  title: { zh: string; en: string };
  subtitle?: { zh: string; en: string };
}

/**
 * 生成详细型提示词
 */
export function generateDetailedPrompt(
  config: DetailedPromptConfig
): { promptZh: string; promptEn: string; negative: string; layoutConfig: string } {

  const promptEn = buildDetailedPromptEn(config);
  const promptZh = buildDetailedPromptZh(config);
  const negative = buildDetailedNegative(config.posterType);
  const layoutConfig = buildDetailedLayoutConfig(config);

  return {
    promptZh,
    promptEn,
    negative,
    layoutConfig,
  };
}

/**
 * 构建详细型英文提示词
 */
function buildDetailedPromptEn(config: DetailedPromptConfig): string {
  const { productInfo, style, posterType, title, subtitle } = config;

  const aspectRatio = style.aspectRatio || '9:16';
  const orientation = aspectRatio === '9:16' ? 'vertical' : 'horizontal';
  const visualStyle = resolveVisualStyle(style.visual);
  const sceneKeywords = getSceneKeywords(posterType);
  const lighting = getLightingHint(posterType);
  const productName = productInfo.productType.specific || productInfo.productType.category;

  // 提取或选择卖点
  const effectiveSubtitle = subtitle || extractSellingPointForPosterTypeDetailed(productInfo, posterType);
  const effectiveSellingPoints = effectiveSubtitle ? [effectiveSubtitle] : undefined;

  const sections: string[] = [];

  // 第一部分：开头定义
  sections.push(
    `${aspectRatio} ${orientation} premium artistic poster, ${visualStyle} style. ` +
    `${lighting}.`
  );

  // 第二部分：场景描述（详细）
  sections.push(buildDetailedScene(posterType, productName, productInfo));

  // 第三部分：产品展示（严格还原）
  sections.push(buildDetailedProductRestore(productInfo, productName));

  // 第四部分：排版布局（详细）
  sections.push(buildDetailedLayout(title, effectiveSubtitle, effectiveSellingPoints, style));

  // 第五部分：质感与光影
  sections.push(buildDetailedTextureAndLighting(style.visual, posterType));

  // 第六部分：技术规格
  sections.push('Professional commercial photography, 8k resolution, cinematic quality.');

  return sections.join('\n\n');
}

/**
 * 构建详细型中文提示词
 */
function buildDetailedPromptZh(config: DetailedPromptConfig): string {
  const { productInfo, style, posterType, title, subtitle } = config;

  const aspectRatio = style.aspectRatio || '9:16';
  const visualStyle = resolveVisualStyleZh(style.visual);
  const lighting = getLightingHint(posterType);
  const productName = productInfo.productType.specific || productInfo.productType.category;

  // 提取或选择卖点
  const effectiveSubtitle = subtitle || extractSellingPointForPosterTypeDetailed(productInfo, posterType);
  const effectiveSellingPoints = effectiveSubtitle ? [effectiveSubtitle] : undefined;

  const sections: string[] = [];

  sections.push(
    `${aspectRatio}竖版高端艺术海报，${visualStyle}风格。` +
    `${lighting}。`
  );

  sections.push(buildDetailedSceneZh(posterType, productName, productInfo));
  sections.push(buildDetailedProductRestoreZh(productInfo, productName));
  sections.push(buildDetailedLayoutZh(title, effectiveSubtitle, effectiveSellingPoints, style));
  sections.push(buildDetailedTextureAndLightingZh(style.visual, posterType));
  sections.push('商业级品质，8k分辨率，电影级光影。');

  return sections.join('\n\n');
}

/**
 * 构建详细场景描述
 */
function buildDetailedScene(
  posterType: string,
  productName: string,
  productInfo: AnalysisResponse
): string {
  const scenes: Record<string, string> = {
    hero: `Soft natural lighting, minimalist gradient background with ${productInfo.colorScheme.primary[0]} tones. ` +
          `Center stage: A single, perfect ${productName}, hyper-realistic detail, exact match to uploaded product image. ` +
          `The texture and details are crisp and well-defined. ` +
          `Clean composition with negative space.`,

    lifestyle: `Warm morning sunlight with dappled shadows creating authentic atmosphere. ` +
               `${productName} shown in natural daily life context - on table, counter, or in hand. ` +
               `Surrounding elements suggest everyday use: a prepared setting, complementary items, or lifestyle props. ` +
               `Soft-focus background elements suggesting home/kitchen/office environment. ` +
               `Natural, inviting, real-world feel.`,

    detail: `Extreme macro photography setup with controlled lighting. ` +
             `Focus on ${productName} microscopic texture, material surface, and craftsmanship details. ` +
             `Controlled studio lighting from side/top to emphasize texture and fine details. ` +
             `Shallow depth of field with smooth bokeh background. ` +
             `Every pore, grain, or texture element is highly detailed and visible.`,
  };

  return scenes[posterType] || scenes.hero;
}

function buildDetailedSceneZh(
  posterType: string,
  productName: string,
  productInfo: AnalysisResponse
): string {
  const scenes: Record<string, string> = {
    hero: `柔和自然光，${productInfo.colorScheme.primary[0]}色调的极简渐变背景。` +
          `画面中心：单个完美的${productName}，超写实细节，与上传的产品图完全一致。` +
          `纹理和细节清晰锐利，质感细腻。` +
          `干净构图，大量留白。`,

    lifestyle: `温暖的晨光，斑驳光影，营造真实氛围。` +
               `${productName}在自然日常生活场景中——放置在桌子、台面或手中。` +
               `周围元素暗示日常使用：准备好的场景、配套物品或生活道具。` +
               `背景虚化元素暗示居家/厨房/办公环境。` +
               `自然、亲切、真实世界的感受。`,

    detail: `极端微距摄影设置，受控光照。` +
             `聚焦${productName}的微观纹理、材质表面和工艺细节。` +
             `受控的工作室侧光/顶光以强调质感和精细细节。` +
             `浅景深，背景平滑虚化。` +
             `每个毛孔、颗粒或纹理元素都高度清晰可见。`,
  };

  return scenes[posterType] || scenes.hero;
}

/**
 * 构建详细产品还原要求
 */
function buildDetailedProductRestore(productInfo: AnalysisResponse, productName: string): string {
  return `**Product Display (Strictly Restore Uploaded Image):**\n\n` +
         `The ${productName} must be restored exactly as shown in the uploaded image:\n\n` +
         `- Packaging design: All colors, logos, text, patterns must match exactly\n` +
         `- Material texture: Maintain original matte/glossy/brushed finish\n` +
         `- Product proportions: Accurate shape and size\n` +
         `- Brand elements: Logo position, text placement, all details must be identical`;
}

function buildDetailedProductRestoreZh(productInfo: AnalysisResponse, productName: string): string {
  return `**产品展示（严格还原上传图片）：**\n\n` +
         `${productName}必须与上传的图片完全一致：\n\n` +
         `- 包装设计：所有颜色、LOGO、文字、图案必须完全匹配\n` +
         `- 材质质感：保持原有的哑光/高光/拉丝质感\n` +
         `- 产品比例：准确的形状和尺寸\n` +
         `- 品牌元素：LOGO位置、文字放置、所有细节必须完全一致`;
}

/**
 * 构建详细排版布局
 */
function buildDetailedLayout(
  title: { zh: string; en: string },
  subtitle?: { zh: string; en: string },
  sellingPoints?: Array<{ zh: string; en: string }>,
  style?: StyleConfig
): string {
  const sections: string[] = ['**Layout (Bilingual Design):**'];

  sections.push(`\n- **Top-Center:**`);
  sections.push(`  - Brand logo (small, ~5% of canvas width)`);

  sections.push(`\n- **Title Area:**`);
  sections.push(`  - Main title: '${title.zh}' (Bold Serif, 30% width)`);
  sections.push(`  - English subtitle: '${title.en}' (Light Serif, 60% of Chinese size)`);

  if (subtitle) {
    sections.push(`\n- **Subtitle:**`);
    sections.push(`  - '${subtitle.zh}' / '${subtitle.en}'`);
    sections.push(`  - Thin line decoration above`);
  }

  if (sellingPoints && sellingPoints.length > 0) {
    sections.push(`\n- **Key Points (Glassmorphism Card):**`);
    sellingPoints.slice(0, 3).forEach((point, index) => {
      sections.push(`  ${index + 1}. ${point.zh} / ${point.en}`);
    });
  }

  return sections.join('\n');
}

function buildDetailedLayoutZh(
  title: { zh: string; en: string },
  subtitle?: { zh: string; en: string },
  sellingPoints?: Array<{ zh: string; en: string }>,
  style?: StyleConfig
): string {
  const sections: string[] = ['**排版布局（中英文双语设计）：**'];

  sections.push(`\n- **顶部居中：**`);
  sections.push(`  - 品牌LOGO（小号，约占画面5%宽度）`);

  sections.push(`\n- **标题区域：**`);
  sections.push(`  - 主标题：'${title.zh}'（粗衬线，占画面30%宽度）`);
  sections.push(`  - 英文副标题：'${title.en}'（细衬线，中文字号的60%）`);

  if (subtitle) {
    sections.push(`\n- **副标题：**`);
    sections.push(`  - '${subtitle.zh}' / '${subtitle.en}'`);
    sections.push(`  - 上方有细线装饰`);
  }

  if (sellingPoints && sellingPoints.length > 0) {
    sections.push(`\n- **关键要点（玻璃拟态卡片）：**`);
    sellingPoints.slice(0, 3).forEach((point, index) => {
      sections.push(`  ${index + 1}. ${point.zh} / ${point.en}`);
    });
  }

  return sections.join('\n');
}

/**
 * 构建详细质感与光影
 */
function buildDetailedTextureAndLighting(visualStyle: string, posterType: string): string {
  const textures: Record<string, string> = {
    magazine: 'High-end magazine editorial quality. Crisp details, professional color grading.',
    watercolor: 'Soft watercolor texture with artistic brush strokes. Dreamy, ethereal quality.',
    minimal: 'Clean, minimalist aesthetic. Precise details, balanced lighting.',
    vintage: 'Warm film grain texture. Nostalgic color palette with soft fade.',
    tech: 'Sharp, futuristic quality. Cool color grading with rim lighting.',
    cyber: 'Neon glow effects. High contrast with vibrant accent colors.',
    organic: 'Natural, organic texture. Warm earth tones with soft natural lighting.',
  };

  return `**Texture & Lighting:**\n\n${textures[visualStyle] || textures.magazine}`;
}

function buildDetailedTextureAndLightingZh(visualStyle: string, posterType: string): string {
  const textures: Record<string, string> = {
    magazine: '高端杂志编辑品质。细节清晰，专业调色。',
    watercolor: '柔和的水彩质感，艺术笔触。梦幻、空灵的质感。',
    minimal: '干净、极简美学。精确细节，平衡光影。',
    vintage: '温暖的胶片颗粒质感。怀旧色调，柔和衰减。',
    tech: '锐利、未来感。冷色调，边缘光。',
    cyber: '霓虹发光效果。高对比度，鲜艳的强调色。',
    organic: '自然、有机质感。温暖的大地色系，柔和自然光。',
  };

  return `**质感与光影：**\n\n${textures[visualStyle] || textures.magazine}`;
}

/**
 * 构建详细型负面词
 */
function buildDetailedNegative(posterType: string): string {
  const base = [
    'cluttered',
    'busy',
    'multiple patterns',
    'harsh shadows',
    'watermark',
    'logo repeated',
    'messy text',
    'low quality',
    'blurry',
    'artificial',
    'plastic-looking',
    'cartoon',
    'anime style',
    'wrong packaging design',
    'different colors',
    'modified logo',
    'changed text',
    'simplified design',
  ];

  const typeSpecific: Record<string, string[]> = {
    hero: ['excessive bloom', 'over-saturated'],
    lifestyle: ['staged', 'artificial smile'],
    detail: ['sharpening artifacts', 'noise'],
    process: ['confusing', 'overloaded'],
  };

  return [...base, ...(typeSpecific[posterType] || [])].join(', ');
}

/**
 * 构建详细型版式配置
 */
function buildDetailedLayoutConfig(config: DetailedPromptConfig): string {
  const { productInfo, posterType, title, subtitle } = config;

  // 提取或选择卖点
  const effectiveSubtitle = subtitle || extractSellingPointForPosterTypeDetailed(productInfo, posterType);

  const lines: string[] = ['\n**版式配置**\n'];

  lines.push('Top Center: Brand Logo (Small).');

  switch (posterType) {
    case 'hero':
      lines.push('Center: Main Product Hero Shot.');
      lines.push(`Bottom: Main Title '${title.zh}' (Large) stacked over '${title.en}' (Small).`);
      if (effectiveSubtitle) {
        lines.push(`Below Title: Subtitle '${effectiveSubtitle.zh}' / '${effectiveSubtitle.en}' with thin line decoration.`);
      }
      break;

    case 'lifestyle':
      lines.push('Middle-Right: Slogan vertically aligned.');
      if (effectiveSubtitle) {
        lines.push(`Bottom Center: Glassmorphism bar with '${effectiveSubtitle.zh}' / '${effectiveSubtitle.en}'.`);
      } else {
        lines.push('Bottom Center: Glassmorphism bar.');
      }
      break;

    case 'detail':
      lines.push('Center-focused composition.');
      lines.push(`Top: Large Bold '${title.zh}' with smaller '${title.en}' below.`);
      if (effectiveSubtitle) {
        lines.push(`Bottom: Subtitle '${effectiveSubtitle.zh}' / '${effectiveSubtitle.en}'.`);
      }
      break;
  }

  return lines.join('\n');
}

// ============================================================================
// 辅助函数（复用）
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

// ============================================================================
// 卖点提取逻辑
// ============================================================================

/**
 * 根据海报类型从AI分析中提取最相关的卖点（详细型）
 * 每张海报最多一个核心卖点词
 * 经过广告化语言精炼
 */
function extractSellingPointForPosterTypeDetailed(
  productInfo: AnalysisResponse,
  posterType: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage'
): { zh: string; en: string } | undefined {
  // 如果没有卖点数据，返回undefined
  if (!productInfo.sellingPoints || productInfo.sellingPoints.length === 0) {
    return undefined;
  }

  // 根据海报类型定义卖点索引选择策略
  const posterTypeIndexMap: Record<string, number> = {
    hero: 0,        // 主KV：第一个卖点（最核心定位）
    lifestyle: 1,   // 生活场景：第二个卖点
    process: 2,     // 工艺技术：第三个卖点
    detail: 3,      // 细节特写：第四个卖点
    brand: 4,       // 品牌故事：第五个卖点
    specs: 5,       // 产品参数：第六个卖点
    usage: 6,       // 使用指南：第七个卖点
  };

  const index = posterTypeIndexMap[posterType] || 0;

  // 使用模运算确保索引不越界
  const rawSellingPoint = productInfo.sellingPoints[index % productInfo.sellingPoints.length];

  // 使用卖点精炼器进行广告化处理
  const refinedSellingPoint = refineSellingPoints(productInfo, posterType, rawSellingPoint);

  return refinedSellingPoint;
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


import { AnalysisResponse, StyleConfig } from '@/contexts/AppContext';

interface PosterPrompt {
  id: string;
  title: string;
  titleEn: string;
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  promptZh: string;
  promptEn: string;
  negative: string;
}

interface PromptsSystem {
  logo: string;
  posters: PosterPrompt[];
}

export function generatePrompts(
  productInfo: AnalysisResponse,
  style: StyleConfig
): PromptsSystem {
  const {
    brandName,
    productType,
    specifications,
    sellingPoints,
    colorScheme,
    designStyle,
    targetAudience,
    brandTone,
    packagingHighlights,
    parameters,
  } = productInfo;

  const { visual, typography, textLayout } = style;

  // 生成排版说明
  const getTypographyDesc = () => {
    const typographyMap: Record<string, string> = {
      glassmorphism: '玻璃拟态效果 - 半透明背景卡片,柔和圆角,现代感强',
      '3d': '3D浮雕效果 - 金属质感文字,光影立体,奢华感强',
      handwritten: '手写体标注 - 水彩笔触,不规则布局,艺术感强',
      serif: '粗衬线大标题 - 细线装饰,网格对齐,杂志感强',
      'sans-serif': '无衬线粗体 - 霓虹描边,发光效果,赛博感强',
      thin: '极细线条字 - 大量留白,精确对齐,极简感强',
    };
    return typographyMap[typography] || typographyMap.glassmorphism;
  };

  // 生成中英文排版格式说明
  const getTextLayoutDesc = () => {
    const layoutMap: Record<string, string> = {
      stacked: '中英文垂直堆叠 - 中文在上(较大字号),英文在下(较小字号),居中对齐',
      parallel: '中英文横向并列 - 用竖线或斜杠分隔,字号相同或中文略大',
      separated: '中英文分离放置 - 中文在左上角,英文在右下角,形成视觉对比',
    };
    return layoutMap[textLayout] || layoutMap.stacked;
  };

  const typographyDesc = getTypographyDesc();
  const textLayoutDesc = getTextLayoutDesc();

  // 生成负面词
  const negativePrompt = `cluttered, busy, messy, blurry, low quality, watermark, text, logo, distorted, ugly, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body, mutated hands and fingers, out of frame, disproportion, gross proportions, bad proportions, low resolution, compression artifacts, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, blurry, bad proportions, extra limbs, cloned face, disfigured, out of frame, ugly, extra limbs, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck`;

  // 生成10张海报的提示词
  const posters: PosterPrompt[] = [
    // 海报01 - 主KV视觉
    {
      id: '01',
      title: '主KV视觉',
      titleEn: 'Hero Shot',
      type: 'hero',
      promptZh: `创建一个9:16竖版电商主视觉海报。

**产品还原**:
严格还原上传的产品图,包括包装设计、颜色、LOGO位置、文字内容、图案元素等所有细节。

**品牌信息**:
- 品牌: ${brandName.zh} / ${brandName.en}
- 产品: ${productType.category} - ${productType.specific}
- 规格: ${specifications}

**核心卖点**:
${sellingPoints.map((sp, i) => `${i + 1}. ${sp.zh} / ${sp.en}`).join('\n')}

**设计风格**:
${getVisualStyleDesc(visual)}

**配色方案**:
- 主色: ${colorScheme.primary.join(', ')}
- 辅助色: ${colorScheme.secondary.join(', ')}
- 点缀色: ${colorScheme.accent.join(', ')}

**文字排版**:
${typographyDesc}

**中英文格式**:
${textLayoutDesc}

**布局要求**:
- LOGO位置: 左上角,使用品牌名称 ${brandName.zh}
- 主标题: 使用产品名称,大字号,居中或视觉焦点
- 副标题: 展示核心卖点,使用 ${textLayout === 'stacked' ? '上下堆叠' : textLayout === 'parallel' ? '斜杠分隔' : '分离布局'}格式
- CTA按钮: 底部居中,"立即购买" / "Shop Now"

**整体风格**:
${designStyle},适合${targetAudience},品牌调性${brandTone}`,
      promptEn: `Create a 9:16 vertical e-commerce hero poster.

**Product Fidelity**:
Strictly reproduce the uploaded product image, including packaging design, colors, logo position, text content, pattern elements, and all other details.

**Brand Information**:
- Brand: ${brandName.en} / ${brandName.zh}
- Product: ${productType.category} - ${productType.specific}
- Specifications: ${specifications}

**Key Selling Points**:
${sellingPoints.map((sp, i) => `${i + 1}. ${sp.en} / ${sp.zh}`).join('\n')}

**Design Style**:
${getVisualStyleDescEn(visual)}

**Color Scheme**:
- Primary: ${colorScheme.primary.join(', ')}
- Secondary: ${colorScheme.secondary.join(', ')}
- Accent: ${colorScheme.accent.join(', ')}

**Typography**:
${getTypographyDescEn(typography)}

**Text Layout**:
${getTextLayoutDescEn(textLayout)}

**Layout Requirements**:
- Logo position: Top left, use brand name ${brandName.en}
- Main title: Use product name, large font size, centered or visual focal point
- Subtitle: Display key selling points, use ${textLayout === 'stacked' ? 'stacked vertical layout' : textLayout === 'parallel' ? 'side-by-side with separator' : 'separated layout'} format
- CTA button: Bottom center, "立即购买" / "Shop Now"

**Overall Style**:
${designStyle}, suitable for ${targetAudience}, brand tone ${brandTone}`,
      negative: negativePrompt,
    },

    // 海报02 - 生活场景
    {
      id: '02',
      title: '生活场景',
      titleEn: 'Lifestyle',
      type: 'lifestyle',
      promptZh: `创建一个9:16竖版生活场景海报,展示产品在实际使用中的场景。

**场景描述**:
展示${targetAudience}在日常生活中使用${productType.specific}的场景。
背景应该符合${designStyle}风格,营造${brandTone}的氛围。

**产品展示**:
- 产品放置在自然的生活场景中
- 保持产品包装的完整还原
- 光线柔和,突出产品质感

**文字内容**:
- 主标题: "${sellingPoints[0].zh}" / "${sellingPoints[0].en}"
- 副标题: 展示另外2个卖点
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}
**中英文格式**: ${textLayoutDesc}`,
      promptEn: `Create a 9:16 vertical lifestyle poster showing the product in actual use scenarios.

**Scene Description**:
Show ${targetAudience} using ${productType.specific} in daily life.
Background should match ${designStyle} style, creating ${brandTone} atmosphere.

**Product Display**:
- Product placed in natural life scenario
- Maintain complete product packaging fidelity
- Soft lighting highlighting product texture

**Text Content**:
- Main title: "${sellingPoints[0].en}" / "${sellingPoints[0].zh}"
- Subtitle: Display 2 additional selling points
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}
**Text Layout**: ${getTextLayoutDescEn(textLayout)}`,
      negative: negativePrompt,
    },

    // 海报03 - 工艺/技术
    {
      id: '03',
      title: '工艺技术',
      titleEn: 'Process/Concept',
      type: 'process',
      promptZh: `创建一个9:16竖版工艺/技术海报,可视化展示产品技术优势。

**技术亮点**:
基于卖点: ${sellingPoints[0].zh} / ${sellingPoints[0].en}
使用信息图表或示意图展示这个技术特点。

**视觉元素**:
- 使用简洁的图标或插图
- 展示技术流程或原理
- 保持产品作为主体

**文字内容**:
- 主标题: "${sellingPoints[0].zh}" / "${sellingPoints[0].en}"
- 技术说明: 使用${packagingHighlights[0] || '产品亮点'}
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}
**中英文格式**: ${textLayoutDesc}`,
      promptEn: `Create a 9:16 vertical process/concept poster, visualizing product technical advantages.

**Technical Highlights**:
Based on selling point: ${sellingPoints[0].en} / ${sellingPoints[0].zh}
Use infographics or diagrams to show this technical feature.

**Visual Elements**:
- Use clean icons or illustrations
- Show technical process or principle
- Keep product as the main subject

**Text Content**:
- Main title: "${sellingPoints[0].en}" / "${sellingPoints[0].zh}"
- Technical description: Use ${packagingHighlights[0] || 'product highlight'}
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}
**Text Layout**: ${getTextLayoutDescEn(textLayout)}`,
      negative: negativePrompt,
    },

    // 海报04-07 - 细节特写
    {
      id: '04',
      title: '细节特写01',
      titleEn: 'Detail Shot 01',
      type: 'detail',
      promptZh: `创建一个9:16竖版细节特写海报。

**特写内容**:
展示产品的精致细节,突出${sellingPoints[1] || '产品品质'}。
使用微距视角,强调材质和工艺。

**视觉风格**:
- 浅景深,背景虚化
- 侧光或顶光,突出质感
- 产品占据画面70%

**文字内容**:
- 主标题: "${sellingPoints[1]?.zh || '细节之美'}" / "${sellingPoints[1]?.en || 'Details Matter'}"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical detail shot poster.

**Detail Content**:
Show exquisite product details, highlighting ${sellingPoints[1]?.en || 'product quality'}.
Use macro perspective, emphasize texture and craftsmanship.

**Visual Style**:
- Shallow depth of field, blurred background
- Side light or top light, highlight texture
- Product occupies 70% of frame

**Text Content**:
- Main title: "${sellingPoints[1]?.en || 'Details Matter'}" / "${sellingPoints[1]?.zh || '细节之美'}"
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}`,
      negative: negativePrompt,
    },
    {
      id: '05',
      title: '细节特写02',
      titleEn: 'Detail Shot 02',
      type: 'detail',
      promptZh: `创建一个9:16竖版材质特写海报。

**特写内容**:
展示产品材质,突出${sellingPoints[2] || '优质材料'}。
强调材质的纹理和触感。

**视觉风格**:
- 极简背景,突出材质
- 自然光,柔和阴影
- 特写镜头,展示细节

**文字内容**:
- 主标题: "${sellingPoints[2]?.zh || '精选材质'}" / "${sellingPoints[2]?.en || 'Premium Materials'}"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical material close-up poster.

**Detail Content**:
Show product material, highlighting ${sellingPoints[2]?.en || 'premium materials'}.
Emphasize material texture and tactile quality.

**Visual Style**:
- Minimalist background, highlight material
- Natural light, soft shadows
- Close-up shot, show details

**Text Content**:
- Main title: "${sellingPoints[2]?.en || 'Premium Materials'}" / "${sellingPoints[2]?.zh || '精选材质'}"
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}`,
      negative: negativePrompt,
    },
    {
      id: '06',
      title: '细节特写03',
      titleEn: 'Detail Shot 03',
      type: 'detail',
      promptZh: `创建一个9:16竖版功能细节海报。

**特写内容**:
展示产品功能特性,突出${sellingPoints[3] || '功能优势'}。
展示产品使用或操作的部分。

**视觉风格**:
- 动态角度,展示功能
- 清晰对焦,突出重点
- 简洁背景,不干扰主体

**文字内容**:
- 主标题: "${sellingPoints[3]?.zh || '人性化设计'}" / "${sellingPoints[3]?.en || 'Human-Centered Design'}"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical functional detail poster.

**Detail Content**:
Show product functional features, highlighting ${sellingPoints[3]?.en || 'functional advantages'}.
Display parts showing product use or operation.

**Visual Style**:
- Dynamic angle, show functionality
- Clear focus, highlight key points
- Simple background, don't distract from subject

**Text Content**:
- Main title: "${sellingPoints[3]?.en || 'Human-Centered Design'}" / "${sellingPoints[3]?.zh || '人性化设计'}"
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}`,
      negative: negativePrompt,
    },
    {
      id: '07',
      title: '细节特写04',
      titleEn: 'Detail Shot 04',
      type: 'detail',
      promptZh: `创建一个9:16竖版用户体验海报。

**特写内容**:
展示用户体验,突出${sellingPoints[4] || '用户满意度'}。
可以展示产品与用户的互动场景。

**视觉风格**:
- 温暖色调,营造亲和力
- 自然场景,真实感受
- 柔和光线,舒适氛围

**文字内容**:
- 主标题: "${sellingPoints[4]?.zh || '用户之选'}" / "${sellingPoints[4]?.en || 'User Choice'}"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical user experience poster.

**Detail Content**:
Show user experience, highlighting ${sellingPoints[4]?.en || 'user satisfaction'}.
Can show scenarios of product-user interaction.

**Visual Style**:
- Warm tones, create affinity
- Natural scene, authentic feeling
- Soft lighting, comfortable atmosphere

**Text Content**:
- Main title: "${sellingPoints[4]?.en || 'User Choice'}" / "${sellingPoints[4]?.zh || '用户之选'}"
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}`,
      negative: negativePrompt,
    },

    // 海报08 - 品牌故事
    {
      id: '08',
      title: '品牌故事',
      titleEn: 'Brand Story',
      type: 'brand',
      promptZh: `创建一个9:16竖版品牌故事海报。

**品牌信息**:
品牌: ${brandName.zh} / ${brandName.en}
品牌调性: ${brandTone}
设计风格: ${designStyle}

**视觉风格**:
使用品牌配色 ${colorScheme.primary.join(', ')}
营造${brandTone}的氛围
可以包含品牌元素或抽象图形

**文字内容**:
- 主标题: "${brandName.zh}" / "${brandName.en}"
- 副标题: "${designStyle}" / "${designStyle}"
- 品牌理念: 展示2-3个包装亮点
  ${packagingHighlights.slice(0, 3).map(h => `- ${h}`).join('\n  ')}
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}
**中英文格式**: ${textLayoutDesc}`,
      promptEn: `Create a 9:16 vertical brand story poster.

**Brand Information**:
Brand: ${brandName.en} / ${brandName.zh}
Brand tone: ${brandTone}
Design style: ${designStyle}

**Visual Style**:
Use brand colors ${colorScheme.primary.join(', ')}
Create ${brandTone} atmosphere
Can include brand elements or abstract graphics

**Text Content**:
- Main title: "${brandName.en}" / "${brandName.zh}"
- Subtitle: "${designStyle}" / "${designStyle}"
- Brand philosophy: Display 2-3 packaging highlights
  ${packagingHighlights.slice(0, 3).map(h => `- ${h}`).join('\n  ')}
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}
**Text Layout**: ${getTextLayoutDescEn(textLayout)}`,
      negative: negativePrompt,
    },

    // 海报09 - 产品参数
    {
      id: '09',
      title: '产品参数',
      titleEn: 'Specifications',
      type: 'specs',
      promptZh: `创建一个9:16竖版产品参数海报。

**产品参数**:
${Object.entries(parameters)
  .filter(([_, value]) => value)
  .map(([key, value]) => {
    const keyMap: Record<string, string> = {
      netContent: '净含量',
      ingredients: '成分',
      nutrition: '营养信息',
      usage: '使用方法',
      shelfLife: '保质期',
      storage: '储存方法',
    };
    return `${keyMap[key]}: ${value}`;
  })
  .join('\n')}

**视觉风格**:
- 数据可视化呈现
- 清晰的参数表格
- 产品图作为背景或侧边

**文字内容**:
- 主标题: "产品参数" / "Specifications"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical product specifications poster.

**Product Specifications**:
${Object.entries(parameters)
  .filter(([_, value]) => value)
  .map(([key, value]) => {
    const keyMap: Record<string, string> = {
      netContent: 'Net Content',
      ingredients: 'Ingredients',
      nutrition: 'Nutrition Facts',
      usage: 'Usage',
      shelfLife: 'Shelf Life',
      storage: 'Storage',
    };
    return `${keyMap[key]}: ${value}`;
  })
  .join('\n')}

**Visual Style**:
- Data visualization presentation
- Clear specification table
- Product image as background or sidebar

**Text Content**:
- Main title: "Specifications" / "产品参数"
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}`,
      negative: negativePrompt,
    },

    // 海报10 - 使用指南
    {
      id: '10',
      title: '使用指南',
      titleEn: 'Usage Guide',
      type: 'usage',
      promptZh: `创建一个9:16竖版使用指南海报。

**使用说明**:
基于产品类型: ${productType.category}
展示${productType.specific}的使用步骤

**步骤展示**:
1. 打开包装
2. 按照说明使用
3. 享受产品

**视觉风格**:
- 图标化步骤展示
- 箭头指引流程
- 产品配合场景

**文字内容**:
- 主标题: "使用指南" / "Usage Guide"
- 步骤说明: 简洁清晰
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical usage guide poster.

**Usage Instructions**:
Based on product type: ${productType.category}
Show how to use ${productType.specific}

**Step Display**:
1. Open package
2. Follow instructions
3. Enjoy product

**Visual Style**:
- Iconic step display
- Arrows guide flow
- Product with scene

**Text Content**:
- Main title: "Usage Guide" / "使用指南"
- Step instructions: Concise and clear
- Brand logo: Top left

**Design Style**: ${getVisualStyleDescEn(visual)}
**Color Scheme**: Primary ${colorScheme.primary.join(', ')}
**Typography**: ${getTypographyDescEn(typography)}`,
      negative: negativePrompt,
    },
  ];

  return {
    logo: brandName.zh,
    posters,
  };
}

// 辅助函数: 获取视觉风格描述(中文)
function getVisualStyleDesc(style: string): string {
  const styleMap: Record<string, string> = {
    magazine: '杂志编辑风格 - 高级、专业、大片感、粗衬线标题、极简留白',
    watercolor: '水彩艺术风格 - 温暖、柔和、晕染效果、手绘质感',
    tech: '科技未来风格 - 冷色调、几何图形、数据可视化、蓝光效果',
    vintage: '复古胶片风格 - 颗粒质感、暖色调、怀旧氛围、宝丽来边框',
    minimal: '极简北欧风格 - 性冷淡、大留白、几何线条、黑白灰',
    cyber: '霓虹赛博风格 - 荧光色、描边发光、未来都市、暗色背景',
    organic: '自然有机风格 - 植物元素、大地色系、手工质感、环保理念',
  };
  return styleMap[style] || styleMap.magazine;
}

// 辅助函数: 获取视觉风格描述(英文)
function getVisualStyleDescEn(style: string): string {
  const styleMap: Record<string, string> = {
    magazine: 'Magazine Editorial style - High-end, professional, blockbuster feel, bold serif titles, minimalist whitespace',
    watercolor: 'Watercolor Art style - Warm, soft, smudge effects, hand-painted texture',
    tech: 'Tech Future style - Cold tones, geometric shapes, data visualization, blue light effects',
    vintage: 'Vintage Film style - Grain texture, warm tones, nostalgic atmosphere, Polaroid borders',
    minimal: 'Minimal Nordic style - Cold minimalist, large whitespace, geometric lines, black/white/gray',
    cyber: 'Neon Cyberpunk style - Fluorescent colors, stroke glow, futuristic city, dark background',
    organic: 'Natural Organic style - Plant elements, earth tones, handmade texture, eco-friendly concept',
  };
  return styleMap[style] || styleMap.magazine;
}

// 辅助函数: 获取文字排版描述(英文)
function getTypographyDescEn(typography: string): string {
  const typographyMap: Record<string, string> = {
    glassmorphism: 'Glassmorphism - Semi-transparent background cards, soft rounded corners, strong modern feel',
    '3d': '3D Embossed - Metallic text, light/shadow 3D effect, strong luxury feel',
    handwritten: 'Handwritten - Watercolor brush strokes, irregular layout, strong artistic feel',
    serif: 'Bold Serif - Thin line decoration, grid alignment, strong magazine feel',
    'sans-serif': 'Bold Sans-serif - Neon stroke, glow effect, strong cyber feel',
    thin: 'Thin Sans-serif - Large whitespace, precise alignment, strong minimalist feel',
  };
  return typographyMap[typography] || typographyMap.glassmorphism;
}

// 辅助函数: 获取中英文排版格式描述(英文)
function getTextLayoutDescEn(layout: string): string {
  const layoutMap: Record<string, string> = {
    stacked: 'Chinese-English stacked vertically - Chinese on top (larger font), English below (smaller font), centered alignment',
    parallel: 'Chinese-English side-by-side - Separated by vertical line or slash, same font size or Chinese slightly larger',
    separated: 'Chinese-English separated - Chinese in top-left corner, English in bottom-right corner, creating visual contrast',
  };
  return layoutMap[layout] || layoutMap.stacked;
}

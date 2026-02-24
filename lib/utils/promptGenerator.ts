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
  runtimeNegative?: string;
  overlaySpec?: PosterOverlaySpec;
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

  const { visual, typography, textLayout, aspectRatio } = style;
  const normalizedSellingPoints = Array.from({ length: 5 }, (_, index) => {
    const point = sellingPoints[index];
    return {
      zh: point?.zh || `核心卖点${index + 1}`,
      en: point?.en || `Key selling point ${index + 1}`,
    };
  });

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
  const aspectRatioOrientationZh = getAspectRatioOrientationZh(aspectRatio);
  const aspectRatioOrientationEn = getAspectRatioOrientationEn(aspectRatio);

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
${normalizedSellingPoints.map((sp, i) => `${i + 1}. ${sp.zh} / ${sp.en}`).join('\n')}

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
${normalizedSellingPoints.map((sp, i) => `${i + 1}. ${sp.en} / ${sp.zh}`).join('\n')}

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
- 主标题: "${normalizedSellingPoints[0].zh}" / "${normalizedSellingPoints[0].en}"
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
- Main title: "${normalizedSellingPoints[0].en}" / "${normalizedSellingPoints[0].zh}"
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
基于卖点: ${normalizedSellingPoints[0].zh} / ${normalizedSellingPoints[0].en}
使用信息图表或示意图展示这个技术特点。

**视觉元素**:
- 使用简洁的图标或插图
- 展示技术流程或原理
- 保持产品作为主体

**文字内容**:
- 主标题: "${normalizedSellingPoints[0].zh}" / "${normalizedSellingPoints[0].en}"
- 技术说明: 使用${packagingHighlights[0] || '产品亮点'}
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}
**中英文格式**: ${textLayoutDesc}`,
      promptEn: `Create a 9:16 vertical process/concept poster, visualizing product technical advantages.

**Technical Highlights**:
Based on selling point: ${normalizedSellingPoints[0].en} / ${normalizedSellingPoints[0].zh}
Use infographics or diagrams to show this technical feature.

**Visual Elements**:
- Use clean icons or illustrations
- Show technical process or principle
- Keep product as the main subject

**Text Content**:
- Main title: "${normalizedSellingPoints[0].en}" / "${normalizedSellingPoints[0].zh}"
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
展示产品的精致细节,突出${normalizedSellingPoints[1].zh || '产品品质'}。
使用微距视角,强调材质和工艺。

**视觉风格**:
- 浅景深,背景虚化
- 侧光或顶光,突出质感
- 产品占据画面70%

**文字内容**:
- 主标题: "${normalizedSellingPoints[1]?.zh || '细节之美'}" / "${normalizedSellingPoints[1]?.en || 'Details Matter'}"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical detail shot poster.

**Detail Content**:
Show exquisite product details, highlighting ${normalizedSellingPoints[1].en || 'product quality'}.
Use macro perspective, emphasize texture and craftsmanship.

**Visual Style**:
- Shallow depth of field, blurred background
- Side light or top light, highlight texture
- Product occupies 70% of frame

**Text Content**:
- Main title: "${normalizedSellingPoints[1]?.en || 'Details Matter'}" / "${normalizedSellingPoints[1]?.zh || '细节之美'}"
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
展示产品材质,突出${normalizedSellingPoints[2].zh || '优质材料'}。
强调材质的纹理和触感。

**视觉风格**:
- 极简背景,突出材质
- 自然光,柔和阴影
- 特写镜头,展示细节

**文字内容**:
- 主标题: "${normalizedSellingPoints[2]?.zh || '精选材质'}" / "${normalizedSellingPoints[2]?.en || 'Premium Materials'}"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical material close-up poster.

**Detail Content**:
Show product material, highlighting ${normalizedSellingPoints[2].en || 'premium materials'}.
Emphasize material texture and tactile quality.

**Visual Style**:
- Minimalist background, highlight material
- Natural light, soft shadows
- Close-up shot, show details

**Text Content**:
- Main title: "${normalizedSellingPoints[2]?.en || 'Premium Materials'}" / "${normalizedSellingPoints[2]?.zh || '精选材质'}"
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
展示产品功能特性,突出${normalizedSellingPoints[3].zh || '功能优势'}。
展示产品使用或操作的部分。

**视觉风格**:
- 动态角度,展示功能
- 清晰对焦,突出重点
- 简洁背景,不干扰主体

**文字内容**:
- 主标题: "${normalizedSellingPoints[3]?.zh || '人性化设计'}" / "${normalizedSellingPoints[3]?.en || 'Human-Centered Design'}"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical functional detail poster.

**Detail Content**:
Show product functional features, highlighting ${normalizedSellingPoints[3].en || 'functional advantages'}.
Display parts showing product use or operation.

**Visual Style**:
- Dynamic angle, show functionality
- Clear focus, highlight key points
- Simple background, don't distract from subject

**Text Content**:
- Main title: "${normalizedSellingPoints[3]?.en || 'Human-Centered Design'}" / "${normalizedSellingPoints[3]?.zh || '人性化设计'}"
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
展示用户体验,突出${normalizedSellingPoints[4].zh || '用户满意度'}。
可以展示产品与用户的互动场景。

**视觉风格**:
- 温暖色调,营造亲和力
- 自然场景,真实感受
- 柔和光线,舒适氛围
- 场景简单,重点突出

**文字内容**:
- 主标题: "${normalizedSellingPoints[4]?.zh || '用户之选'}" / "${normalizedSellingPoints[4]?.en || 'User Choice'}"
- 品牌LOGO: 左上角

**设计风格**: ${getVisualStyleDesc(visual)}
**配色方案**: 主色 ${colorScheme.primary.join(', ')}
**文字排版**: ${typographyDesc}`,
      promptEn: `Create a 9:16 vertical user experience poster.

**Detail Content**:
Show user experience, highlighting ${normalizedSellingPoints[4].en || 'user satisfaction'}.
Can show scenarios of product-user interaction.

**Visual Style**:
- Warm tones, create affinity
- Natural scene, authentic feeling
- Soft lighting, comfortable atmosphere

**Text Content**:
- Main title: "${normalizedSellingPoints[4]?.en || 'User Choice'}" / "${normalizedSellingPoints[4]?.zh || '用户之选'}"
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
  .filter(([, value]) => value)
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
  .filter(([, value]) => value)
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

  const postersWithAspectRatio = posters.map((poster) => ({
    ...poster,
    promptZh: injectAspectRatioRuleZh(
      poster.promptZh,
      aspectRatio,
      aspectRatioOrientationZh
    ),
    promptEn: injectAspectRatioRuleEn(
      poster.promptEn,
      aspectRatio,
      aspectRatioOrientationEn
    ),
  }));

  const postersWithRuntime = postersWithAspectRatio.map((poster) => {
    const overlaySpec = buildOverlaySpecForPoster({
      poster,
      productInfo,
      normalizedSellingPoints,
    });

    return {
      ...poster,
      runtimePromptEn: buildRuntimePromptEn({
        poster,
        productInfo,
        style,
        aspectRatio,
        aspectRatioOrientationEn,
        normalizedSellingPoints,
        overlaySpec,
      }),
      runtimeNegative: buildRuntimeNegativeByType(poster.type),
      overlaySpec,
    };
  });

  return {
    logo: brandName.zh,
    posters: postersWithRuntime,
  };
}

function injectAspectRatioRuleZh(
  prompt: string,
  aspectRatio: string,
  orientation: string
): string {
  const replaced = prompt.replaceAll('9:16竖版', `${aspectRatio}${orientation}`);
  return `${replaced}\n\n**画面比例要求**:\n- 使用 ${aspectRatio} ${orientation}构图`;
}

function injectAspectRatioRuleEn(
  prompt: string,
  aspectRatio: string,
  orientation: string
): string {
  const replaced = prompt.replaceAll('9:16 vertical', `${aspectRatio} ${orientation}`);
  return `${replaced}\n\n**Aspect Ratio Requirement**:\n- Use ${aspectRatio} ${orientation} composition`;
}

function getAspectRatioOrientationZh(aspectRatio: string): string {
  const verticalRatios = new Set(['9:16', '3:4', '2:3']);
  const squareRatios = new Set(['1:1']);
  if (verticalRatios.has(aspectRatio)) return '竖版';
  if (squareRatios.has(aspectRatio)) return '方版';
  return '横版';
}

function getAspectRatioOrientationEn(aspectRatio: string): string {
  const verticalRatios = new Set(['9:16', '3:4', '2:3']);
  const squareRatios = new Set(['1:1']);
  if (verticalRatios.has(aspectRatio)) return 'vertical';
  if (squareRatios.has(aspectRatio)) return 'square';
  return 'horizontal';
}

function buildRuntimePromptEn(args: {
  poster: PosterPrompt;
  productInfo: AnalysisResponse;
  style: StyleConfig;
  aspectRatio: string;
  aspectRatioOrientationEn: string;
  normalizedSellingPoints: Array<{ zh: string; en: string }>;
  overlaySpec?: PosterOverlaySpec;
}): string {
  const {
    poster,
    productInfo,
    style,
    aspectRatio,
    aspectRatioOrientationEn,
    normalizedSellingPoints,
    overlaySpec,
  } = args;
  const { brandName, productType, specifications, colorScheme, parameters, designStyle, brandTone } = productInfo;
  const styleGrammar = buildRuntimeVisualGrammar(style.visual);
  const typographyGrammar = buildOnePassTypographyGrammar(style.typography, style.textLayout);
  const blueprint = getPosterRuntimeBlueprint(poster.id, poster.type);
  const keyPoints = normalizedSellingPoints
    .map((point) => point.en)
    .filter((value) => Boolean(value && value.trim()))
    .slice(0, 2)
    .join(' / ');
  const compactSpecLines = Object.entries(parameters)
    .filter(([, value]) => Boolean(value))
    .slice(0, 2)
    .map(([key, value]) => `${mapParameterKeyEn(key)}: ${value}`)
    .join(' | ');
  const copyPack = buildOnePassCopyPack(overlaySpec, poster);

  return [
    `TASK: ${blueprint.task}`,
    `REFERENCE LOCK: Use uploaded product image as single source of truth. Keep package silhouette, logo spelling/placement, color palette, icon positions, and label hierarchy unchanged. Do not redesign brand elements.`,
    `PRODUCT FACTS: Brand ${brandName.en || brandName.zh}; Category ${productType.category}; Product ${productType.specific}; Specs ${specifications || 'N/A'}.${keyPoints ? ` Key points: ${keyPoints}.` : ''}`,
    `SHOT BLUEPRINT: ${blueprint.shotBlueprint} Aspect ratio ${aspectRatio} ${aspectRatioOrientationEn}.`,
    `STYLE GRAMMAR: ${styleGrammar}. Typography grammar: ${typographyGrammar}. Palette focus: primary ${joinOrFallback(colorScheme.primary, '#5F77FF')}; secondary ${joinOrFallback(colorScheme.secondary, '#AAB7FF')}; accent ${joinOrFallback(colorScheme.accent, '#C248FF')}. Design tone: ${designStyle || 'premium e-commerce'}; brand tone: ${brandTone || 'confident and clean'}.`,
    `COPY TO RENDER (render exactly, no rewrite):\n${copyPack}`,
    `TEXT LAYOUT POLICY: ${blueprint.textPolicy} Keep all copy clear, complete, and readable. Preserve language, punctuation, line hierarchy, and brand naming.`,
    `TEXT ACCURACY: No gibberish, no random characters, no misspelling, no truncated words, no duplicated letters, no mirrored text, no unrelated logos or watermarks.`,
    `QUALITY TARGET: Commercial ad quality, sharp edges, clear package front, balanced lighting, no subject crop, no distracting clutter.`,
    `OUTPUT CONSTRAINTS: Single package only, no second brand, no wrong symbols, no fake label text, no chaotic background, no unreadable typography. ${compactSpecLines ? `Specs cue: ${compactSpecLines}.` : ''}`,
  ].join('\n\n');
}

function buildRuntimeVisualGrammar(visual: string): string {
  const visualGrammar: Record<string, string> = {
    magazine: 'editorial composition, premium whitespace, clean premium framing',
    watercolor: 'soft gradients, hand-painted wash texture, warm artistic atmosphere',
    tech: 'clean geometry, cool highlights, controlled futuristic accents',
    vintage: 'film grain touch, warm tonality, nostalgic contrast control',
    minimal: 'minimal geometry, neutral background, precision alignment',
    cyber: 'neon edge accents, dark contrast base, crisp glow highlights',
    organic: 'natural fibers, earth-tone layers, gentle handcrafted detail',
  };
  return visualGrammar[visual] || visualGrammar.magazine;
}

function buildOnePassTypographyGrammar(
  typography: string,
  textLayout: StyleConfig['textLayout']
): string {
  const typographyGrammar: Record<string, string> = {
    glassmorphism: 'soft translucent cards, rounded corners, clean modern hierarchy',
    '3d': 'bold display headline, subtle depth, metallic highlight accents',
    handwritten: 'handwritten accent strokes for subtitles, controlled irregular rhythm',
    serif: 'high-contrast serif headline, editorial hierarchy, premium spacing',
    'sans-serif': 'bold sans headline, crisp contrast, high readability',
    thin: 'lightweight sans titles with large whitespace and precise alignment',
  };
  const layoutGrammar: Record<StyleConfig['textLayout'], string> = {
    stacked: 'bilingual stacked layout: Chinese headline first, English support line below',
    parallel: 'bilingual parallel layout: Chinese and English side-by-side with clear divider',
    separated: 'bilingual separated layout: Chinese in primary area, English in secondary anchor',
  };
  return `${typographyGrammar[typography] || typographyGrammar.glassmorphism}; ${layoutGrammar[textLayout]}`;
}

function buildOnePassCopyPack(
  overlaySpec: PosterOverlaySpec | undefined,
  poster: PosterPrompt
): string {
  if (!overlaySpec) {
    return [
      `- headline_zh: ${poster.title}`,
      `- headline_en: ${poster.titleEn}`,
      `- subtitle_zh: 品质之选`,
    ].join('\n');
  }

  const lines: string[] = [];
  if (overlaySpec.logoText) lines.push(`- logo_text: ${overlaySpec.logoText}`);
  if (overlaySpec.titleZh) lines.push(`- headline_zh: ${overlaySpec.titleZh}`);
  if (overlaySpec.titleEn) lines.push(`- headline_en: ${overlaySpec.titleEn}`);
  if (overlaySpec.subtitleZh) lines.push(`- subtitle_zh: ${overlaySpec.subtitleZh}`);
  if (overlaySpec.subtitleEn) lines.push(`- subtitle_en: ${overlaySpec.subtitleEn}`);

  (overlaySpec.bullets || []).slice(0, 3).forEach((bullet, idx) => {
    if (bullet.zh) lines.push(`- bullet_${idx + 1}_zh: ${bullet.zh}`);
    if (bullet.en) lines.push(`- bullet_${idx + 1}_en: ${bullet.en}`);
  });

  if (overlaySpec.ctaZh) lines.push(`- cta_zh: ${overlaySpec.ctaZh}`);
  if (overlaySpec.ctaEn) lines.push(`- cta_en: ${overlaySpec.ctaEn}`);

  return lines.join('\n');
}

function getPosterRuntimeBlueprint(
  posterId: string,
  posterType: PosterPrompt['type']
): { task: string; shotBlueprint: string; textPolicy: string } {
  const mapById: Record<string, { task: string; shotBlueprint: string; textPolicy: string }> = {
    '01': {
      task: 'Create final hero KV poster in one pass (image + copy + layout).',
      shotBlueprint: 'Package front view dominant (50-62% frame), headline in upper free area, supporting bullets below headline, CTA near lower-third with clear margin',
      textPolicy: 'Use strong headline hierarchy, keep text blocks aligned and balanced against product silhouette.',
    },
    '02': {
      task: 'Create final lifestyle poster in one pass (image + copy + layout).',
      shotBlueprint: 'Product in foreground, lifestyle context in background, text group in calm area away from product edge',
      textPolicy: 'Keep bilingual text compact and readable; avoid placing copy on noisy texture.',
    },
    '03': {
      task: 'Create final process/concept poster in one pass (image + copy + layout).',
      shotBlueprint: 'Product anchor plus supportive visual metaphor; reserve concise header and short bullet zone',
      textPolicy: 'Keep information hierarchy: headline first, then 1-2 key bullets with even spacing.',
    },
    '04': {
      task: 'Create final detail close-up poster in one pass (image + copy + layout).',
      shotBlueprint: 'Macro framing with product detail as focus; place short copy near clean negative space',
      textPolicy: 'Text should be concise, high-contrast, and never overlap the key texture detail.',
    },
    '05': {
      task: 'Create final material-detail poster in one pass (image + copy + layout).',
      shotBlueprint: 'Texture-forward composition with simple backdrop and one stable text block',
      textPolicy: 'Maintain compact text group and avoid excessive decorative labels.',
    },
    '06': {
      task: 'Create final function-detail poster in one pass (image + copy + layout).',
      shotBlueprint: 'Feature interaction angle, product recognizable, copy anchored to clear side region',
      textPolicy: 'Prioritize legibility and spacing; keep copy as structured headline + bullets.',
    },
    '07': {
      task: 'Create final trust-detail poster in one pass (image + copy + layout).',
      shotBlueprint: 'Product center with trust-oriented ambience; text block should avoid tiny dense lines',
      textPolicy: 'Use short, confident copy with clear line breaks and moderate leading.',
    },
    '08': {
      task: 'Create final brand-story poster in one pass (image + copy + layout).',
      shotBlueprint: 'Product plus brand ambience, story headline in upper area, supportive line and CTA below',
      textPolicy: 'Keep story copy poetic but concise, with clear hierarchy and alignment.',
    },
    '09': {
      task: 'Create final specification poster in one pass (image + copy + layout).',
      shotBlueprint: 'Product with structured spec area (upper/lower split allowed), parameter bullets aligned in clean column',
      textPolicy: 'Render parameter text as readable short lines; keep spacing regular and consistent.',
    },
    '10': {
      task: 'Create final usage-guide poster in one pass (image + copy + layout).',
      shotBlueprint: 'Usage scene with product anchor and concise step copy arranged from top to bottom',
      textPolicy: 'Keep step text short, sequential, and clearly separated.',
    },
  };

  const fallback = mapById['01'];
  const selected = mapById[posterId] || fallback;
  if (posterType === 'detail' && !mapById[posterId]) {
    return {
      task: 'Create final detail poster in one pass (image + copy + layout).',
      shotBlueprint: 'Detail-first framing with one stable copy block in clean background',
      textPolicy: 'Keep copy concise and legible, with clear visual hierarchy.',
    };
  }
  return selected;
}

function buildRuntimeNegativeByType(type: PosterPrompt['type']): string {
  const globalNegatives = buildGlobalRuntimeNegative();
  const typeNegatives: Record<PosterPrompt['type'], string[]> = {
    hero: ['busy background', 'aggressive perspective distortion', 'cropped headline area'],
    lifestyle: ['face-dominant composition', 'product out of focus', 'scene clutter'],
    process: ['overloaded infographic', 'too many icons', 'confusing flow direction'],
    detail: ['plastic fake texture', 'excessive bloom', 'halo sharpening artifacts'],
    brand: ['brand mismatch icons', 'palette inconsistency', 'subject too abstract'],
    specs: ['tiny dense text block', 'crooked bullet alignment', 'irregular column spacing'],
    usage: ['too many steps', 'illegible step text', 'arrow direction confusion'],
  };
  return [...globalNegatives, ...typeNegatives[type]].join(', ');
}

function buildGlobalRuntimeNegative(): string[] {
  return [
    'wrong logo',
    'altered packaging design',
    'different brand text',
    'extra product package',
    'duplicated product',
    'cropped package front',
    'deformed package shape',
    'low resolution',
    'blurry focus',
    'watermark',
    'random characters',
    'gibberish text',
    'misspelled words',
    'broken letters',
    'mirrored text',
    'truncated words',
    'duplicated words',
    'chaotic layout',
    'oversaturated neon cast',
    'muddy shadows',
    'floating unrelated labels',
    'inconsistent typography hierarchy',
    'unbalanced text blocks',
    'unrelated logo',
    'unrelated slogan',
    'fake UI button',
  ];
}

function buildOverlaySpecForPoster(args: {
  poster: PosterPrompt;
  productInfo: AnalysisResponse;
  normalizedSellingPoints: Array<{ zh: string; en: string }>;
}): PosterOverlaySpec | undefined {
  const { poster, productInfo, normalizedSellingPoints } = args;
  const { brandName, colorScheme, parameters, productType } = productInfo;
  const logoText = brandName.zh || brandName.en;
  const palette = {
    primary: colorScheme.primary[0] || '#5F77FF',
    secondary: colorScheme.secondary[0] || '#8CA2FF',
    accent: colorScheme.accent[0] || '#C248FF',
    textOnDark: '#F6F7FF',
  };
  const toZhBullets = (items: Array<{ zh: string; en: string }>, limit: number) =>
    items.slice(0, limit).map((item) => ({
      zh: item.zh,
      en: '',
    }));

  if (poster.id === '01') {
    return {
      layout: 'hero',
      titleZh: normalizedSellingPoints[0]?.zh || poster.title,
      titleEn: normalizedSellingPoints[0]?.en || poster.titleEn,
      subtitleZh: '严选品质，真实可见',
      subtitleEn: '',
      bullets: toZhBullets(normalizedSellingPoints, 2),
      logoText,
      palette,
      ctaZh: '立即选购',
      ctaEn: 'SHOP NOW',
    };
  }

  if (poster.id === '02') {
    return {
      layout: 'lifestyle',
      titleZh: '真实场景体验',
      titleEn: 'LIFESTYLE EXPERIENCE',
      subtitleZh: normalizedSellingPoints[0]?.zh || '日常使用更放心',
      subtitleEn: '',
      bullets: toZhBullets(normalizedSellingPoints.slice(1), 2),
      logoText,
      palette,
      ctaZh: '场景推荐',
      ctaEn: 'LIFESTYLE PICK',
    };
  }

  if (poster.id === '03') {
    return {
      layout: 'generic',
      titleZh: normalizedSellingPoints[0]?.zh || '工艺亮点',
      titleEn: normalizedSellingPoints[0]?.en || 'PROCESS ADVANTAGE',
      subtitleZh: '技术可视化表达',
      subtitleEn: '',
      bullets: toZhBullets(normalizedSellingPoints, 2),
      logoText,
      palette,
      ctaZh: '技术解读',
      ctaEn: 'TECH INSIGHT',
    };
  }

  if (poster.id === '08') {
    return {
      layout: 'generic',
      titleZh: `${brandName.zh || '品牌故事'} · 溯源自然`,
      titleEn: `${(brandName.en || 'BRAND STORY').toUpperCase()} · BACK TO NATURE`,
      subtitleZh: '来自自然灵感的配色与风味',
      subtitleEn: '',
      bullets: toZhBullets(normalizedSellingPoints, 1),
      logoText,
      palette,
      ctaZh: '了解品牌',
      ctaEn: 'DISCOVER BRAND',
    };
  }

  if (poster.id === '09') {
    const specBullets = Object.entries(parameters)
      .filter(([, value]) => Boolean(value))
      .slice(0, 3)
      .map(([key, value]) => {
        const keyZhMap: Record<string, string> = {
          netContent: '净含量',
          ingredients: '核心成分',
          nutrition: '营养信息',
          usage: '使用方式',
          shelfLife: '保质期',
          storage: '储存方式',
        };
        return {
          zh: `${keyZhMap[key] || key}: ${value}`,
          en: '',
        };
      });

    return {
      layout: 'specs',
      titleZh: '产品参数',
      titleEn: 'SPECIFICATIONS',
      subtitleZh: '关键信息一目了然',
      subtitleEn: '',
      bullets: specBullets,
      logoText,
      palette,
      ctaZh: '扫码了解更多',
      ctaEn: 'SCAN FOR DETAILS',
    };
  }

  if (poster.id === '10') {
    return {
      layout: 'generic',
      titleZh: '鲜甜指南',
      titleEn: 'USAGE GUIDE',
      subtitleZh: `3步享用 ${productType.specific || '产品'}`,
      subtitleEn: '',
      bullets: [
        { zh: '步骤1：准备产品', en: '' },
        { zh: '步骤2：按建议食用', en: '' },
      ],
      logoText,
      palette,
      ctaZh: '立即尝鲜',
      ctaEn: 'TRY IT NOW',
    };
  }

  if (poster.type === 'detail') {
    const detailIndexMap: Record<string, number> = {
      '04': 1,
      '05': 2,
      '06': 3,
      '07': 4,
    };
    const pointIndex = detailIndexMap[poster.id] ?? 1;
    const detailPoint = normalizedSellingPoints[pointIndex] || normalizedSellingPoints[0];
    return {
      layout: 'generic',
      titleZh: detailPoint?.zh || '细节之美',
      titleEn: detailPoint?.en || 'DETAIL FOCUS',
      subtitleZh: `${productType.specific || '产品'}细节特写`,
      subtitleEn: '',
      bullets: toZhBullets(
        normalizedSellingPoints.slice(Math.max(0, pointIndex - 1), pointIndex + 1),
        2
      ),
      logoText,
      palette,
      ctaZh: '细节可见',
      ctaEn: 'DETAILS VISIBLE',
    };
  }

  return {
    layout: 'generic',
    titleZh: poster.title,
    titleEn: poster.titleEn.toUpperCase(),
    subtitleZh: normalizedSellingPoints[0]?.zh || '品质之选',
    subtitleEn: '',
    bullets: toZhBullets(normalizedSellingPoints, 1),
    logoText,
    palette,
    ctaZh: '了解更多',
    ctaEn: 'LEARN MORE',
  };
}

function mapParameterKeyEn(key: string): string {
  const map: Record<string, string> = {
    netContent: 'Net Content',
    ingredients: 'Ingredients',
    nutrition: 'Nutrition',
    usage: 'Usage',
    shelfLife: 'Shelf Life',
    storage: 'Storage',
  };
  return map[key] || key;
}

function joinOrFallback(values: string[] | undefined, fallback: string): string {
  if (!values || values.length === 0) return fallback;
  const nonEmpty = values.filter((value) => value && value.trim().length > 0);
  return nonEmpty.length > 0 ? nonEmpty.join(', ') : fallback;
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

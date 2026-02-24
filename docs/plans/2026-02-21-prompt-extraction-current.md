# 2026-02-21 Prompt Extraction (Current Code)

## Scope
提取范围为当前代码中会影响 AI 识别与生图的提示词内容（不含历史设计文档）。

- 识别提示词: `/Users/ericcao/CascadeProjects/kv-generator/lib/api/gemini.ts`
- 海报模板与 runtime 提示词: `/Users/ericcao/CascadeProjects/kv-generator/lib/utils/promptGenerator.ts`
- 生图请求拼接: `/Users/ericcao/CascadeProjects/kv-generator/lib/api/nanobanana.ts`
- 当前实际调用链路: `/Users/ericcao/CascadeProjects/kv-generator/app/generate/page.tsx`

## 1) Analysis Prompt (image -> structured JSON)

Source: `/Users/ericcao/CascadeProjects/kv-generator/lib/api/gemini.ts`

```ts
const ANALYSIS_PROMPT = `
请仔细分析这张产品图片,提取以下信息并以 JSON 格式返回:

1. 品牌名称(中英文)
2. 产品类型(大类和具体产品)
3. 产品规格
4. 核心卖点(5个,中英文双语)
5. 配色方案(主色、辅助色、点缀色的 HEX 值)
6. 设计风格
7. 目标受众
8. 品牌调性
9. 包装亮点
10. 产品参数(净含量、成分、营养、用法、保质期、储存)
11. 推荐的视觉风格(从以下选择: magazine, watercolor, tech, vintage, minimal, cyber, organic)
12. 推荐的文字排版(从以下选择: glassmorphism, 3d, handwritten, serif, sans-serif, thin)

请严格按照以下 JSON 格式返回:
{
  "brandName": {"zh": "", "en": ""},
  "productType": {"category": "", "specific": ""},
  "specifications": "",
  "sellingPoints": [
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""},
    {"zh": "", "en": ""}
  ],
  "colorScheme": {
    "primary": ["#HEX", "#HEX"],
    "secondary": ["#HEX"],
    "accent": ["#HEX", "#HEX"]
  },
  "designStyle": "",
  "targetAudience": "",
  "brandTone": "",
  "packagingHighlights": ["", "", ""],
  "parameters": {
    "netContent": "",
    "ingredients": "",
    "nutrition": "",
    "usage": "",
    "shelfLife": "",
    "storage": ""
  },
  "recommendedStyle": "",
  "recommendedTypography": ""
}
`;
```

## 2) Poster Prompt Templates (display track, 10 posters) + Global Negative

Source: `/Users/ericcao/CascadeProjects/kv-generator/lib/utils/promptGenerator.ts`

### 2.1 Negative Prompt

```ts
  // 生成负面词
  const negativePrompt = `cluttered, busy, messy, blurry, low quality, watermark, text, logo, distorted, ugly, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body, mutated hands and fingers, out of frame, disproportion, gross proportions, bad proportions, low resolution, compression artifacts, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, blurry, bad proportions, extra limbs, cloned face, disfigured, out of frame, ugly, extra limbs, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck`;

```

### 2.2 Poster 01-10 Templates (promptZh / promptEn)

```ts
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
```

### 2.3 Aspect Ratio Injection (appends extra rule)

```ts
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
```

## 3) Runtime Prompt Compiler (execution track, currently generated in data model)

Source: `/Users/ericcao/CascadeProjects/kv-generator/lib/utils/promptGenerator.ts`

### 3.1 Runtime Prompt 8-section builder

```ts
function buildRuntimePromptEn(args: {
  poster: PosterPrompt;
  productInfo: AnalysisResponse;
  style: StyleConfig;
  aspectRatio: string;
  aspectRatioOrientationEn: string;
  normalizedSellingPoints: Array<{ zh: string; en: string }>;
}): string {
  const { poster, productInfo, style, aspectRatio, aspectRatioOrientationEn, normalizedSellingPoints } = args;
  const { brandName, productType, specifications, colorScheme, parameters, designStyle, brandTone } = productInfo;
  const styleGrammar = buildStyleGrammar(style.visual, style.typography, style.textLayout);
  const blueprint = getPosterRuntimeBlueprint(poster.id, poster.type);
  const compactSpecLines = Object.entries(parameters)
    .filter(([, value]) => Boolean(value))
    .slice(0, 4)
    .map(([key, value]) => `${mapParameterKeyEn(key)}: ${value}`)
    .join(' | ');

  return [
    `TASK: ${blueprint.task}`,
    `REFERENCE LOCK: Use uploaded product image as single source of truth. Keep package silhouette, logo spelling/placement, color palette, icon positions, and label hierarchy unchanged. Do not redesign brand elements.`,
    `PRODUCT FACTS: Brand ${brandName.en || brandName.zh}; Category ${productType.category}; Product ${productType.specific}; Specs ${specifications || 'N/A'}. Key points: ${normalizedSellingPoints.map((point) => point.en).join(' / ')}.`,
    `SHOT BLUEPRINT: ${blueprint.shotBlueprint} Aspect ratio ${aspectRatio} ${aspectRatioOrientationEn}. Reserve clean negative-space zones for post-process typography, but render no added poster copy.`,
    `STYLE GRAMMAR: ${styleGrammar}. Palette focus: primary ${joinOrFallback(colorScheme.primary, '#5F77FF')}; secondary ${joinOrFallback(colorScheme.secondary, '#AAB7FF')}; accent ${joinOrFallback(colorScheme.accent, '#C248FF')}. Design tone: ${designStyle || 'premium e-commerce'}; brand tone: ${brandTone || 'confident and clean'}.`,
    `TEXT POLICY: ${blueprint.textPolicy} Strict rule: no generated headline text, no subtitle text, no slogan text, no CTA button text on canvas. Keep only product-native package printing from reference image.`,
    `QUALITY TARGET: Commercial ad quality, sharp edges, clear package front, balanced lighting, no subject crop, no distracting clutter.`,
    `OUTPUT CONSTRAINTS: Single package only, no second brand, no wrong symbols, no fake label text, no chaotic background, no poster typography overlays. ${compactSpecLines ? `Specs cue: ${compactSpecLines}.` : ''}`,
  ].join('\n\n');
}

function buildStyleGrammar(
  visual: string,
  typography: string,
  textLayout: StyleConfig['textLayout']
): string {
  const visualGrammar: Record<string, string> = {
    magazine: 'editorial composition, premium whitespace, strong title hierarchy',
    watercolor: 'soft gradients, hand-painted wash texture, warm artistic atmosphere',
    tech: 'clean geometry, cool highlights, controlled futuristic accents',
    vintage: 'film grain touch, warm tonality, nostalgic contrast control',
    minimal: 'minimal geometry, neutral background, precision alignment',
    cyber: 'neon edge accents, dark contrast base, crisp glow highlights',
    organic: 'natural fibers, earth-tone layers, gentle handcrafted detail',
  };
  const typographyGrammar: Record<string, string> = {
    glassmorphism: 'glass card overlays, soft radius, translucent panels',
    '3d': 'embossed metallic title treatment, depth-controlled highlights',
    handwritten: 'handwritten callout accents, organic stroke rhythm',
    serif: 'bold serif display title with fine divider lines',
    'sans-serif': 'bold sans display, strong readability, modern contrast',
    thin: 'thin sans typography, restrained spacing, minimalist rhythm',
  };
  const layoutGrammar: Record<StyleConfig['textLayout'], string> = {
    stacked: 'bilingual stacked layout: Chinese above English',
    parallel: 'bilingual parallel layout with clean separators',
    separated: 'bilingual separated anchors with visual balance',
  };

  return [
    visualGrammar[visual] || visualGrammar.magazine,
    typographyGrammar[typography] || typographyGrammar.glassmorphism,
    layoutGrammar[textLayout],
  ].join('; ');
}
```

### 3.2 Per-poster Runtime Blueprint (01-10)

```ts
function getPosterRuntimeBlueprint(
  posterId: string,
  posterType: PosterPrompt['type']
): { task: string; shotBlueprint: string; textPolicy: string } {
  const mapById: Record<string, { task: string; shotBlueprint: string; textPolicy: string }> = {
    '01': {
      task: 'Create hero KV visual focused on product package fidelity.',
      shotBlueprint: 'Package front view dominant (55-65% frame), clean gradient backdrop, center-weighted composition',
      textPolicy: `Reserve clean typography-safe zones (top 18%, bottom 14%) for post-process copy. Keep center area uncluttered.`,
    },
    '02': {
      task: 'Create lifestyle scene while keeping product package as main subject.',
      shotBlueprint: 'Product in foreground, lifestyle context in mid/background, natural lighting, no subject occlusion',
      textPolicy: 'Reserve a readable top-left text-safe area and bottom CTA-safe strip for post-process overlay.',
    },
    '03': {
      task: 'Visualize process or concept for one key product advantage.',
      shotBlueprint: 'Product anchor with 1-2 infographic cues, structured spacing, high readability',
      textPolicy: 'Reserve compact header and side-note safe zones; keep background simple for overlay readability.',
    },
    '04': {
      task: 'Create detail close-up emphasizing craftsmanship.',
      shotBlueprint: 'Macro framing, shallow depth of field, package detail area crisp and isolated',
      textPolicy: 'Reserve a narrow top header safe area; avoid visual noise where post-process text will sit.',
    },
    '05': {
      task: 'Create material-focused detail shot.',
      shotBlueprint: 'Texture-forward framing, controlled highlights, simple background',
      textPolicy: 'Reserve small copy-safe zone near bottom-left; keep texture detail clear but not busy.',
    },
    '06': {
      task: 'Create function-focused detail visual.',
      shotBlueprint: 'Feature interaction angle, product still fully recognizable, clean feature emphasis',
      textPolicy: 'Reserve two compact text-safe areas (header and lower-third) for post-process overlay.',
    },
    '07': {
      task: 'Create trust-oriented detail or review style poster.',
      shotBlueprint: 'Product center with light trust badges, avoid clutter and tiny text',
      textPolicy: 'Reserve concise trust-copy space near top; avoid dense graphical elements in overlay zones.',
    },
    '08': {
      task: 'Create brand story mood visual with package consistency.',
      shotBlueprint: 'Product plus branded ambient elements, palette consistency prioritized',
      textPolicy: 'Reserve brand-message safe zones top and bottom while maintaining strong mood visuals.',
    },
    '09': {
      task: 'Create specification-focused poster for key product parameters.',
      shotBlueprint: 'Split layout: product area + compact spec area, high contrast readability',
      textPolicy: 'Reserve a clear parameter panel area for post-process spec overlay, avoid busy micro-details.',
    },
    '10': {
      task: 'Create usage guide poster with clear step flow.',
      shotBlueprint: 'Three-step icon flow with product anchor, directional guidance and spacing',
      textPolicy: 'Reserve three step-caption safe zones; keep guided flow graphics simple and text-free.',
    },
  };

  const fallback = mapById['01'];
  const selected = mapById[posterId] || fallback;
  if (posterType === 'detail' && !mapById[posterId]) {
    return {
      task: 'Create detail poster emphasizing product fidelity and texture.',
      shotBlueprint: 'Detail-first framing, clean background, product features sharp',
      textPolicy: 'Use one short title and avoid dense text.',
    };
  }
  return selected;
}
```

### 3.3 Runtime Negative (global + per type)

```ts
function buildRuntimeNegativeByType(type: PosterPrompt['type']): string {
  const globalNegatives = buildGlobalRuntimeNegative();
  const typeNegatives: Record<PosterPrompt['type'], string[]> = {
    hero: ['busy background', 'aggressive perspective distortion', 'tilted unreadable label'],
    lifestyle: ['face-dominant composition', 'product out of focus', 'scene clutter'],
    process: ['overloaded infographic', 'tiny unreadable labels', 'confusing flow arrows'],
    detail: ['plastic fake texture', 'excessive bloom', 'halo sharpening artifacts'],
    brand: ['brand mismatch icons', 'palette inconsistency', 'overly abstract subject loss'],
    specs: ['handwritten table noise', 'tiny dense text block', 'broken grid alignment'],
    usage: ['too many steps', 'illegible icons', 'arrow direction confusion'],
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
    'chaotic layout',
    'oversaturated neon cast',
    'muddy shadows',
    'floating headline text',
    'marketing slogan overlay',
    'random typography blocks',
    'subtitle banners',
    'cta button text overlay',
    'title typography on background',
    'promotional copy text',
    'large centered headline text',
  ];
}
```

## 4) Final Prompt Assembly Sent to Gemini Image API

Source: `/Users/ericcao/CascadeProjects/kv-generator/lib/api/nanobanana.ts`

### 4.1 prompt + negative 拼接规则

```ts
  return withRetry(async () => {
    const width = request.width || 720;
    const height = request.height || 1280;
    const aspectRatio = getAspectRatio(width, height);
    const prompt = request.negative
      ? `${request.prompt}\n\nAvoid: ${request.negative}`
      : request.prompt;

```

### 4.2 API request payload contents

```ts
  const requestParts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [{ text: args.prompt }];
  const parsedReference = parseDataUrl(args.referenceImage);
  if (parsedReference) {
    requestParts.push({
      inline_data: {
        mime_type: parsedReference.mimeType,
        data: parsedReference.base64,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': args.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: requestParts,
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: args.aspectRatio,
          },
        },
      }),
    },
```

## 5) Active Runtime Path (what is actually used now)

Source: `/Users/ericcao/CascadeProjects/kv-generator/app/generate/page.tsx`

```ts
            const request = {
              // Keep AI-native text rendering; disable frontend post-overlay path.
              prompt: poster.promptEn,
              negative: poster.negative,
              width,
              height,
              referenceImage: uploadedImage?.preview,
            };
```

结论：当前生图实际使用 `poster.promptEn + poster.negative`，不是 `runtimePromptEn/runtimeNegative`。

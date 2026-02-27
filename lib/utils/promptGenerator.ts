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

interface PosterTemplate {
  id: string;
  title: string;
  titleEn: string;
  type: PosterPrompt['type'];
  shotHint: string;
  scenePlan: string;
  sceneKeywords: string[];
}

interface BrandLock {
  enabled: boolean;
  text: string;
}

const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: '01',
    title: '主KV视觉',
    titleEn: 'Hero Shot',
    type: 'hero',
    shotHint: 'Centered hero product shot with clean background and subtle shadow reflection.',
    scenePlan: 'Hero-only composition with product as the sole visual focus on a clean gradient backdrop.',
    sceneKeywords: [
      'single hero object',
      'cream-orange gradient backdrop',
      'center composition',
      'leaf detail visible',
    ],
  },
  {
    id: '02',
    title: '生活场景',
    titleEn: 'Lifestyle Scene',
    type: 'lifestyle',
    shotHint: 'Lifestyle breakfast scene with product foreground and soft kitchen depth.',
    scenePlan: 'Daily-use breakfast setup with tableware and juice props, keeping product as the anchor subject.',
    sceneKeywords: [
      'light wood table',
      'morning window light',
      'white ceramic plate',
      'fresh juice glass',
      'home kitchen bokeh',
    ],
  },
  {
    id: '03',
    title: '工艺概念',
    titleEn: 'Process Concept',
    type: 'process',
    shotHint: 'Concept visual with citrus cross-section, nutrient particles, and controlled splash.',
    scenePlan: 'Technical concept scene visualizing product internals and process cues, not a lifestyle photo.',
    sceneKeywords: [
      'macro pulp cross-section',
      'floating nutrient particles',
      'citrus liquid splash',
      'deep orange radial glow',
    ],
  },
  {
    id: '04',
    title: '细节特写01',
    titleEn: 'Detail Focus 01',
    type: 'detail',
    shotHint: 'Macro close-up emphasizing peel pores, droplets, and leaf veins.',
    scenePlan: 'Extreme macro detail scene focused on tactile freshness signals in a shallow-depth frame.',
    sceneKeywords: [
      'water droplet on peel',
      'leaf veins macro',
      'extreme close-up',
      'orchard bokeh',
    ],
  },
  {
    id: '05',
    title: '细节特写02',
    titleEn: 'Detail Focus 02',
    type: 'detail',
    shotHint: 'Material detail angle highlighting slice translucency and juicy texture.',
    scenePlan: 'Food-texture detail scene with appetizing high-key look and translucent pulp focus.',
    sceneKeywords: [
      'orange slice translucency',
      'visible juice droplets',
      'high-key food light',
      'saturated citrus tone',
    ],
  },
  {
    id: '06',
    title: '细节特写03',
    titleEn: 'Detail Focus 03',
    type: 'detail',
    shotHint: 'Functional close-up showing half-peeled structure and intact segments.',
    scenePlan: 'Functional detail scene demonstrating peel performance in a minimal studio setup.',
    sceneKeywords: [
      'half-peeled reveal',
      'thin peel texture',
      'clean white studio',
      'soft tabletop shadow',
    ],
  },
  {
    id: '07',
    title: '细节特写04',
    titleEn: 'Detail Focus 04',
    type: 'detail',
    shotHint: 'Trust-focused social-proof scene with quote-card foreground and product anchor.',
    scenePlan: 'Review and trust scene with social-proof collage elements and one clear product anchor.',
    sceneKeywords: [
      'blurry customer photo grid',
      'glass quote card',
      'star-rating icon set',
      'product anchor bottom-right',
    ],
  },
  {
    id: '08',
    title: '品牌故事',
    titleEn: 'Brand Story',
    type: 'brand',
    shotHint: 'Brand-story orchard scene at golden hour with warm cinematic mood.',
    scenePlan: 'Storytelling scene combining orchard atmosphere, palette inspiration, and foreground product anchor.',
    sceneKeywords: [
      'golden hour orchard',
      'sun flare haze',
      'wooden post foreground',
      'palette-strip accent',
    ],
  },
  {
    id: '09',
    title: '产品参数',
    titleEn: 'Specifications',
    type: 'specs',
    shotHint: 'Clean specs poster with top-down product and structured data zone.',
    scenePlan: 'Technical infographic scene with annotation lines and a dedicated lower data-table area.',
    sceneKeywords: [
      'top-down product view',
      'minimal grid lines',
      'annotation callouts',
      'data-table lower area',
    ],
  },
  {
    id: '10',
    title: '使用指南',
    titleEn: 'Usage Guide',
    type: 'usage',
    shotHint: 'Usage guide scene with clear three-step icon workflow.',
    scenePlan: 'Instructional scene with vertical step flow and warm orange-white guide blocks.',
    sceneKeywords: [
      'three-step icon flow',
      'orange-white guide blocks',
      'pictogram instructions',
      'vertical process layout',
    ],
  },
];

export function generatePrompts(
  productInfo: AnalysisResponse,
  style: StyleConfig
): PromptsSystem {
  const sellingPoints = normalizeSellingPoints(productInfo.sellingPoints);
  const styleDirection = resolveStyleDirection(productInfo, style.visual);
  const aspectRatio = style.aspectRatio || '9:16';
  const orientation = getAspectRatioOrientationEn(aspectRatio);
  const brandLock = resolveBrandLock();

  const posters = POSTER_TEMPLATES.map((template, index) => {
    const overlaySpec = buildOverlaySpec({
      template,
      productInfo,
      sellingPoints,
      templateIndex: index,
      brandLock,
    });
    const runtimeMainPromptEn = buildRuntimeMainPrompt({
      template,
      productInfo,
      style,
      styleDirection,
      aspectRatio,
      orientation,
      brandLock,
    });
    const runtimeLayoutPromptEn = buildRuntimeLayoutPrompt({
      template,
      overlaySpec,
    });
    const runtimePromptAnchorEn = `${runtimeMainPromptEn}\n\n${runtimeLayoutPromptEn}`;
    const runtimeNegative = buildRuntimeNegative(template.type);

    return {
      id: template.id,
      title: template.title,
      titleEn: template.titleEn,
      type: template.type,
      promptZh: buildDisplayPromptZh(runtimeMainPromptEn, runtimeLayoutPromptEn),
      promptEn: runtimePromptAnchorEn,
      negative: runtimeNegative,
      runtimePromptEn: runtimePromptAnchorEn,
      runtimePromptAnchorEn,
      runtimeMainPromptEn,
      runtimeLayoutPromptEn,
      runtimeNegative,
      overlaySpec,
    } satisfies PosterPrompt;
  });

  return {
    logo: brandLock.enabled ? brandLock.text : '',
    posters,
  };
}

function normalizeSellingPoints(
  points: Array<{ zh: string; en: string }> | undefined
): Array<{ zh: string; en: string }> {
  const normalized = Array.isArray(points) ? points : [];
  const cleaned = normalized
    .map((point) => ({
      zh: sanitizeCopy(point?.zh),
      en: sanitizeCopy(point?.en),
    }))
    .filter((point) => point.zh || point.en);
  const fallbackZh = cleaned[0]?.zh || '';
  const fallbackEn = cleaned[0]?.en || '';

  return Array.from({ length: 5 }, (_, index) => {
    const point = cleaned[index];
    return {
      zh: point?.zh || point?.en || fallbackZh,
      en: point?.en || point?.zh || fallbackEn,
    };
  });
}

function buildOverlaySpec(args: {
  template: PosterTemplate;
  productInfo: AnalysisResponse;
  sellingPoints: Array<{ zh: string; en: string }>;
  templateIndex: number;
  brandLock: BrandLock;
}): PosterOverlaySpec {
  const { template, productInfo, sellingPoints, templateIndex, brandLock } = args;
  const logoText = brandLock.enabled ? brandLock.text : '';
  const defaultTitleZh = sanitizeCopy(productInfo.productType.specific || productInfo.productType.category);
  const defaultTitleEn = sanitizeCopy(productInfo.productType.specific || productInfo.productType.category);
  const palette = {
    primary: productInfo.colorScheme.primary[0] || '#5F77FF',
    secondary: productInfo.colorScheme.secondary[0] || '#8CA2FF',
    accent: productInfo.colorScheme.accent[0] || '#C248FF',
    textOnDark: '#F7F8FF',
  };

  if (template.id === '09') {
    const specBullets = Object.entries(productInfo.parameters || {})
      .filter(([, value]) => Boolean(value && String(value).trim()))
      .slice(0, 2)
      .map(([key, value]) => ({
        zh: `${mapParameterKeyZh(key)}：${String(value).trim()}`,
        en: '',
      }));

    return {
      layout: 'specs',
      titleZh: '产品参数',
      titleEn: 'SPECIFICATIONS',
      subtitleZh: '',
      subtitleEn: '',
      bullets: specBullets,
      logoText,
      palette,
    };
  }

  if (template.id === '10') {
    return {
      layout: 'generic',
      titleZh: '使用指南',
      titleEn: 'USAGE GUIDE',
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.id === '08') {
    return {
      layout: 'generic',
      titleZh: '品牌故事',
      titleEn: 'BRAND STORY',
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.type === 'lifestyle') {
    return {
      layout: 'lifestyle',
      titleZh: pickText(sellingPoints[0]?.zh, defaultTitleZh),
      titleEn: pickText(sellingPoints[0]?.en, defaultTitleEn),
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.type === 'hero') {
    return {
      layout: 'hero',
      titleZh: pickText(sellingPoints[0]?.zh, defaultTitleZh),
      titleEn: pickText(sellingPoints[0]?.en, defaultTitleEn),
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.type === 'detail') {
    const pick = sellingPoints[Math.min(4, Math.max(1, templateIndex))] || sellingPoints[0];
    return {
      layout: 'generic',
      titleZh: pickText(pick?.zh, defaultTitleZh),
      titleEn: pickText(pick?.en, defaultTitleEn),
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  if (template.type === 'process') {
    return {
      layout: 'generic',
      titleZh: pickText(sellingPoints[0]?.zh, defaultTitleZh),
      titleEn: pickText(sellingPoints[0]?.en, defaultTitleEn),
      subtitleZh: '',
      subtitleEn: '',
      bullets: [],
      logoText,
      palette,
    };
  }

  return {
    layout: 'generic',
    titleZh: pickText(sellingPoints[0]?.zh, defaultTitleZh),
    titleEn: pickText(sellingPoints[0]?.en, defaultTitleEn),
    subtitleZh: '',
    subtitleEn: '',
    bullets: [],
    logoText,
    palette,
  };
}

function buildRuntimeMainPrompt(args: {
  template: PosterTemplate;
  productInfo: AnalysisResponse;
  style: StyleConfig;
  styleDirection: { primary: string; secondary: string; tags: string[] };
  aspectRatio: string;
  orientation: string;
  brandLock: BrandLock;
}): string {
  const { template, productInfo, style, styleDirection, aspectRatio, orientation, brandLock } = args;
  const lightingHint = resolveLightingHint(template.type, style.visual);
  const productName = sanitizeCopy(productInfo.productType.specific) || sanitizeCopy(productInfo.productType.category) || 'product';
  const sceneKeywords = buildSceneKeywords(template, productInfo);
  const styleLabel = resolveTemplateStyleLabel(styleDirection.primary, template);
  const realismRule = isPhotoCriticalTemplate(template)
    ? 'Realism: ultra-photorealistic commercial product photography, real lens optics, physically plausible lighting/material response, no illustration or CGI look.'
    : '';
  const antiSimilarityHint =
    template.id === '01'
      ? ''
      : 'Avoid repeating hero-style plain centered product-only composition.';
  const brandRule = brandLock.enabled
    ? `Brand rule: if logo/brand text appears, it must be exactly '${brandLock.text}' and identical across all posters.`
    : 'Brand rule: no standalone logo or brand-name text overlays.';
  const restoreLine = brandLock.enabled
    ? `Strictly restore uploaded product image (${brandLock.text} ${productName}); keep package, logo, and texture unchanged.`
    : `Strictly restore uploaded product image (${productName}); keep package and texture unchanged.`;

  return [
    `${aspectRatio} ${orientation} poster, ${styleLabel} style, ${lightingHint}.`,
    template.shotHint,
    `Scene: ${template.scenePlan}.`,
    `Keywords: ${sceneKeywords.join(', ')}.`,
    antiSimilarityHint,
    realismRule,
    brandRule,
    restoreLine,
    'Commercial quality, 8k resolution.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildSceneKeywords(
  template: PosterTemplate,
  productInfo: AnalysisResponse
): string[] {
  const productKeyword = sanitizeCopy(productInfo.productType.specific || productInfo.productType.category)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const productAnchor = productKeyword ? `${productKeyword} anchor subject` : 'product anchor subject';
  const paletteKeyword = derivePaletteKeyword(productInfo.colorScheme.primary);
  const keywords = [...template.sceneKeywords];

  if (!keywords.includes(productAnchor)) {
    keywords.push(productAnchor);
  }
  if (paletteKeyword && !keywords.includes(paletteKeyword)) {
    keywords.push(paletteKeyword);
  }

  return keywords.slice(0, 6);
}

function derivePaletteKeyword(primary: string[] | undefined): string {
  const value = (primary || []).find((item) => typeof item === 'string' && item.trim().length > 0);
  if (!value) return '';
  return `palette accent ${value.trim()}`;
}

function buildRuntimeLayoutPrompt(args: {
  template: PosterTemplate;
  overlaySpec: PosterOverlaySpec;
}): string {
  const { template, overlaySpec } = args;
  const anchors = buildLayoutAnchors(template, overlaySpec);

  return [
    'Layout anchors (instruction only, do not render label words):',
    ...anchors,
    'Constraints: safe margins; no subtitle; no CTA; no border/frame; no filler captions.',
  ].join('\n');
}

function buildLayoutAnchors(
  template: PosterTemplate,
  overlaySpec: PosterOverlaySpec
): string[] {
  const logoText = composeLogo(overlaySpec);
  const title = composeTitle(overlaySpec);
  const logoTopCenter = logoText ? [`Top-Center: Logo '${logoText}'.`] : [];
  const logoTopLeft = logoText ? [`Top-Left: Logo '${logoText}'.`] : [];

  if (template.id === '09') {
    return [...logoTopCenter, `Upper-Center: Main Title '${title}'.`];
  }

  if (template.type === 'hero') {
    return [...logoTopCenter, `Center: Main Title '${title}'.`];
  }

  if (template.type === 'lifestyle') {
    return [...logoTopLeft, `Middle: Main Title '${title}'.`];
  }

  return [...logoTopLeft, `Upper-Left: Main Title '${title}'.`];
}

function composeLogo(overlaySpec: PosterOverlaySpec): string {
  return compactLayoutText(sanitizeCopy(overlaySpec.logoText), 18);
}

function composeTitle(overlaySpec: PosterOverlaySpec): string {
  const zh = compactLayoutText(sanitizeCopy(overlaySpec.titleZh), 12);
  const en = compactLayoutText(sanitizeCopy(overlaySpec.titleEn), 22);
  return zh || en || 'Headline';
}

function pickText(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

function buildRuntimeNegative(type: PosterPrompt['type']): string {
  const photoOnlyNegatives = [
    'cartoon style',
    'anime style',
    'illustration style',
    'watercolor painting',
    'oil painting',
    'flat vector art',
    '3d render',
    'cgi look',
    'synthetic ai look',
  ];
  const common = [
    'extra unrelated logo',
    'watermark',
    'cta button',
    'shop now',
    'learn more',
    'scan for details',
    'qr code',
    'decorative border frame',
    'poster frame',
    'floating translucent full-screen text panel',
    'gibberish text',
    'random characters',
    'misspelled words',
    'broken letters',
    'duplicated words',
    'mirrored text',
    'wrong brand spelling',
    'inconsistent brand text',
    'random logo text',
    'altered packaging design',
    'extra product package',
    'deformed package shape',
    'cropped package front',
    'low resolution',
    'blurry focus',
  ];

  const byType: Record<PosterPrompt['type'], string[]> = {
    hero: ['busy background', 'subject too small', ...photoOnlyNegatives],
    lifestyle: ['overcrowded scene', 'face-dominant composition', ...photoOnlyNegatives],
    process: ['overloaded infographic', 'too many icon layers'],
    detail: ['fake plastic texture', 'over-sharpen halos', ...photoOnlyNegatives],
    brand: ['brand mismatch style', 'inconsistent palette', ...photoOnlyNegatives],
    specs: ['tiny unreadable specs', 'crooked bullet alignment'],
    usage: ['too many instruction steps', 'confusing step order'],
  };

  return [...common, ...byType[type]].join(', ');
}

function buildDisplayPromptZh(mainPrompt: string, layoutPrompt: string): string {
  return ['主提示词:', mainPrompt, '', '版式配置:', layoutPrompt].join('\n');
}

function resolveStyleDirection(
  productInfo: AnalysisResponse,
  selectedVisual: string
): { primary: string; secondary: string; tags: string[] } {
  const fallbackPrimary = mapStyleIdToDirection(selectedVisual || productInfo.recommendedStyle);
  const primary = sanitizeCopy(productInfo.styleDirection?.primary) || fallbackPrimary;
  let secondary = sanitizeCopy(productInfo.styleDirection?.secondary) || inferSecondaryDirection(primary);

  if (!secondary || secondary.toLowerCase() === primary.toLowerCase()) {
    secondary = inferSecondaryDirection(primary);
  }

  const tags = dedupe(
    [
      ...(productInfo.styleDirection?.tags || []),
      ...tokenize(productInfo.brandTone),
      ...tokenize(productInfo.designStyle),
    ].map((item) => sanitizeCopy(item))
  ).slice(0, 4);

  return {
    primary,
    secondary,
    tags: tags.length > 0 ? tags : ['premium', 'clean', 'commercial'],
  };
}

function mapStyleIdToDirection(styleId: string): string {
  const styleMap: Record<string, string> = {
    magazine: 'Modern Luxury Photo Editorial',
    watercolor: 'Soft Natural Photo Editorial',
    tech: 'Futuristic Product Photography',
    vintage: 'Filmic Product Photography',
    minimal: 'Minimalist Studio Photography',
    cyber: 'Neon Urban Photo Editorial',
    organic: 'Natural Organic Product Photography',
  };
  const normalized = (styleId || '').trim().toLowerCase();
  return styleMap[normalized] || styleMap.magazine;
}

function inferSecondaryDirection(primary: string): string {
  const lower = primary.toLowerCase();
  if (lower.includes('luxury') || lower.includes('editorial')) return 'Neon Urban Photo Editorial';
  if (lower.includes('cyber') || lower.includes('tech')) return 'Modern Luxury Photo Editorial';
  if (lower.includes('organic') || lower.includes('watercolor')) return 'Minimalist Studio Photography';
  if (lower.includes('vintage')) return 'Modern Luxury Photo Editorial';
  return 'Minimalist Studio Photography';
}

function isPhotoCriticalTemplate(template: PosterTemplate): boolean {
  return template.type === 'hero' || template.type === 'detail' || template.type === 'lifestyle';
}

function resolveTemplateStyleLabel(baseStyle: string, template: PosterTemplate): string {
  if (!isPhotoCriticalTemplate(template)) {
    return baseStyle;
  }
  if (/photo|photography|editorial|filmic|studio/i.test(baseStyle)) {
    return baseStyle;
  }
  return `${baseStyle} Product Photography`;
}

function resolveLightingHint(type: PosterPrompt['type'], visual: string): string {
  if (visual === 'cyber') return 'neon-edged contrast lighting';
  if (visual === 'minimal') return 'soft neutral lighting';
  if (visual === 'vintage') return 'warm filmic lighting';

  const byType: Record<PosterPrompt['type'], string> = {
    hero: 'dramatic rim lighting',
    lifestyle: 'soft natural side lighting',
    process: 'controlled studio highlights',
    detail: 'macro contrast lighting',
    brand: 'cinematic ambient lighting',
    specs: 'clean neutral front lighting',
    usage: 'bright practical lighting',
  };

  return byType[type] || byType.hero;
}

function getAspectRatioOrientationEn(aspectRatio: string): string {
  const vertical = new Set(['9:16', '3:4', '2:3']);
  const square = new Set(['1:1']);
  if (vertical.has(aspectRatio)) return 'vertical';
  if (square.has(aspectRatio)) return 'square';
  return 'horizontal';
}

function mapParameterKeyZh(key: string): string {
  const map: Record<string, string> = {
    netContent: '净含量',
    ingredients: '核心成分',
    nutrition: '营养信息',
    usage: '使用方式',
    shelfLife: '保质期',
    storage: '储存方式',
  };
  return map[key] || key;
}

function tokenize(input?: string): string[] {
  if (!input) return [];
  return input
    .split(/[\\/|,+，、；;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupe(values: Array<string | undefined>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  values.forEach((value) => {
    const cleaned = (value || '').trim();
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  });

  return result;
}

function sanitizeCopy(input?: string): string {
  const text = (input || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const blockedPatterns: RegExp[] = [
    /shop now/i,
    /learn more/i,
    /scan for details/i,
    /details visible/i,
    /lifestyle pick/i,
    /tech insight/i,
    /try it now/i,
    /discover brand/i,
    /立即选购/,
    /了解更多/,
    /扫码了解更多/,
    /细节可见/,
    /关键信息一目了然/,
    /细节特写/,
    /真实场景体验/,
    /技术可视化表达/,
    /可视化呈现/,
    /视觉化呈现/,
    /呈现新鲜度/,
    /freshness visualization/i,
    /visual(?:ized|izing)? freshness/i,
    /visual representation/i,
    /品质之选/,
    /富含天然维生素c/i,
    /增强免疫力/,
    /vitamin c.*immunity/i,
  ];

  const chunks = text
    .split(/[|/｜、，,。.;；:：]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const filteredChunks = chunks.filter(
    (chunk) => !blockedPatterns.some((pattern) => pattern.test(chunk))
  );

  if (filteredChunks.length > 0 && filteredChunks.length < chunks.length) {
    return filteredChunks.join(' / ');
  }

  if (blockedPatterns.some((pattern) => pattern.test(text))) {
    return '';
  }
  return text;
}

function compactLayoutText(value: string, maxLength: number): string {
  if (!value) return '';
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;

  const firstChunk = normalized
    .split(/[|/｜、，,。.;；:：]/)
    .map((item) => item.trim())
    .find((item) => item.length > 0);

  if (firstChunk && firstChunk.length <= maxLength) return firstChunk;
  return normalized.slice(0, maxLength).trim();
}

function resolveBrandLock(): BrandLock {
  // Current flow has no dedicated user-uploaded logo asset.
  // Keep logo overlay optional and off by default to avoid forced brand text.
  return { enabled: false, text: '' };
}

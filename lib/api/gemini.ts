import 'server-only';
import { withRetry } from '@/lib/errors/errorHandler';

interface AnalysisResponse {
  brandName: {
    zh: string;
    en: string;
  };
  productType: {
    category: string;
    specific: string;
  };
  specifications: string;
  sellingPoints: Array<{
    zh: string;
    en: string;
  }>;
  colorScheme: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  designStyle: string;
  targetAudience: string;
  brandTone: string;
  packagingHighlights: string[];
  parameters: {
    netContent: string;
    ingredients: string;
    nutrition: string;
    usage: string;
    shelfLife: string;
    storage: string;
  };
  recommendedStyle: string;
  recommendedTypography: string;
  styleDirection?: {
    primary: string;
    secondary: string;
    tags: string[];
  };
}

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
12. 推荐的文字排版(根据产品特征选择最合适的):
    - glassmorphism: 适合科技、现代、未来感产品
    - 3d: 适合奢华、高端、金属质感产品
    - handwritten: 适合艺术、手作、温暖、自然产品
    - serif: 适合杂志、编辑、专业、经典产品
    - sans-serif: 适合现代、简洁、商务产品
    - thin: 适合极简、高端、优雅产品
    请根据产品的品牌调性、设计风格和目标受众，选择最匹配的排版风格
13. 双风格导向(主风格 + 副风格 + 3个风格关键词,用于生图时混合控制)

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
  "recommendedTypography": "",
  "styleDirection": {
    "primary": "",
    "secondary": "",
    "tags": ["", "", ""]
  }
}

重要提示：
- 如果产品是食品、饮料、日用品等，推荐 serif 或 handwritten
- 如果产品是电子产品、科技产品，推荐 glassmorphism 或 thin
- 如果产品是奢侈品、高端产品，推荐 3d 或 serif
- 如果产品是时尚、潮流产品，推荐 sans-serif
- 根据产品的实际特征选择，不要总是推荐同一种
`;

const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const ANALYSIS_TIMEOUT_MS = 20000;
const ANALYSIS_MAX_RETRIES = 2;
const ANALYSIS_RETRY_DELAY_MS = 1200;

export async function analyzeProduct(imageBase64: string): Promise<AnalysisResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // 移除 base64 前缀
  const base64Data = imageBase64.split(',')[1] || imageBase64;

  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${ANALYSIS_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: ANALYSIS_PROMPT
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 8192,
            }
          })
        }
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gemini API timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutTimer);
    }

    if (!response.ok) {
      const rawError = await response.text();
      const parsedError = tryParseJson(rawError);
      const errorBody = parsedError ? JSON.stringify(parsedError) : rawError;
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return normalizeAnalysisResponse(result as Partial<AnalysisResponse>);
  }, ANALYSIS_MAX_RETRIES, ANALYSIS_RETRY_DELAY_MS);
}

function normalizeAnalysisResponse(
  input: Partial<AnalysisResponse>
): AnalysisResponse {
  const normalizedRecommendedStyle = normalizeRecommendedStyle(
    input.recommendedStyle
  );
  const normalizedStyleDirection = normalizeStyleDirection({
    recommendedStyle: normalizedRecommendedStyle,
    designStyle: input.designStyle,
    brandTone: input.brandTone,
    styleDirection: input.styleDirection,
  });

  return {
    brandName: input.brandName || { zh: '', en: '' },
    productType: input.productType || { category: '', specific: '' },
    specifications: input.specifications || '',
    sellingPoints: Array.isArray(input.sellingPoints) ? input.sellingPoints : [],
    colorScheme: input.colorScheme || {
      primary: ['#5F77FF'],
      secondary: ['#AAB7FF'],
      accent: ['#C248FF'],
    },
    designStyle: input.designStyle || '',
    targetAudience: input.targetAudience || '',
    brandTone: input.brandTone || '',
    packagingHighlights: Array.isArray(input.packagingHighlights)
      ? input.packagingHighlights
      : [],
    parameters: input.parameters || {
      netContent: '',
      ingredients: '',
      nutrition: '',
      usage: '',
      shelfLife: '',
      storage: '',
    },
    recommendedStyle: normalizedRecommendedStyle,
    recommendedTypography: input.recommendedTypography || 'glassmorphism',
    styleDirection: normalizedStyleDirection,
  };
}

function normalizeRecommendedStyle(input?: string): string {
  const allowed = new Set([
    'magazine',
    'watercolor',
    'tech',
    'vintage',
    'minimal',
    'cyber',
    'organic',
  ]);
  const normalized = (input || '').trim().toLowerCase();
  if (allowed.has(normalized)) {
    return normalized;
  }
  return 'magazine';
}

function normalizeStyleDirection(args: {
  recommendedStyle: string;
  designStyle?: string;
  brandTone?: string;
  styleDirection?: {
    primary?: string;
    secondary?: string;
    tags?: string[];
  };
}): { primary: string; secondary: string; tags: string[] } {
  const primaryFallback = mapStyleIdToDirection(args.recommendedStyle);
  const parsedDesignTokens = tokenizeStyleText(args.designStyle || '');
  const rawPrimary = cleanStyleDirectionText(
    args.styleDirection?.primary || parsedDesignTokens[0] || primaryFallback
  );
  let rawSecondary = cleanStyleDirectionText(
    args.styleDirection?.secondary || parsedDesignTokens[1] || getSecondaryFallback(rawPrimary)
  );

  if (!rawSecondary || rawSecondary.toLowerCase() === rawPrimary.toLowerCase()) {
    rawSecondary = getSecondaryFallback(rawPrimary);
  }

  const tagsSource = [
    ...(Array.isArray(args.styleDirection?.tags) ? args.styleDirection?.tags : []),
    ...tokenizeStyleText(args.brandTone || ''),
    ...parsedDesignTokens,
  ];
  const tags = uniqueNonEmpty(tagsSource.map((tag) => cleanStyleDirectionText(tag))).slice(0, 4);

  return {
    primary: rawPrimary || primaryFallback,
    secondary: rawSecondary || getSecondaryFallback(rawPrimary || primaryFallback),
    tags: tags.length > 0 ? tags : ['premium', 'clean', 'commercial'],
  };
}

function mapStyleIdToDirection(styleId: string): string {
  const map: Record<string, string> = {
    magazine: 'Modern Luxury Editorial',
    watercolor: 'Artistic Watercolor',
    tech: 'Futuristic Tech',
    vintage: 'Vintage Film',
    minimal: 'Minimalist Clean',
    cyber: 'Cyberpunk Minimalist',
    organic: 'Natural Organic',
  };
  return map[styleId] || map.magazine;
}

function getSecondaryFallback(primary: string): string {
  const lower = primary.toLowerCase();
  if (lower.includes('luxury') || lower.includes('editorial')) return 'Cyberpunk Minimalist';
  if (lower.includes('cyber') || lower.includes('tech')) return 'Modern Luxury Editorial';
  if (lower.includes('organic') || lower.includes('watercolor')) return 'Minimalist Clean';
  if (lower.includes('vintage')) return 'Modern Luxury Editorial';
  return 'Minimalist Clean';
}

function tokenizeStyleText(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[\\/|,+，、；;]+/)
    .map((item) => cleanStyleDirectionText(item))
    .filter(Boolean);
}

function cleanStyleDirectionText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result;
}

function tryParseJson(text: string): unknown | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

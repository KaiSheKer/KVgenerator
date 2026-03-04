// 测试橙子提示词生成
import { generatePrompts } from './lib/utils/promptGenerator';

// 模拟橙子产品的AI分析数据
const mockOrangeProduct = {
  brandName: { zh: '阳光鲜橙', en: 'SUNSHINE ORANGE' },
  productType: { category: '水果', specific: '脐橙' },
  colorScheme: {
    primary: ['#FF6B35', '#FF8C42'],
    secondary: ['#FFF8E7', '#FFE5B4'],
    accent: ['#4CAF50', '#FFD700']
  },
  designStyle: '自然有机风格',
  targetAudience: '注重健康的年轻家庭',
  brandTone: '新鲜、自然、活力',
  packagingHighlights: [
    '带绿叶的新鲜脐橙',
    '果皮纹理清晰可见',
    '色泽鲜艳诱人'
  ],
  specifications: '果径75-80mm，糖度14+',
  parameters: {
    netContent: '500g/盒',
    ingredients: '新鲜脐橙',
    nutrition: '维生素C 50mg/100g',
    usage: '开袋即食，可榨汁',
    shelfLife: '7天',
    storage: '阴凉干燥处'
  },
  recommendedStyle: '有机自然风格',
  recommendedTypography: '圆润无衬线字体',
  sellingPoints: [
    { zh: '富含天然维生素C', en: 'Rich in natural Vitamin C' },
    { zh: '产地直采', en: 'Directly Sourced' },
    { zh: '皮薄多汁', en: 'Thin Skin & Juicy' },
    { zh: '新鲜采摘', en: 'Freshly Picked' },
    { zh: '口感极佳', en: 'Excellent Taste' }
  ]
};

// 风格配置
const mockStyle = {
  visual: 'organic',
  typography: 'sans-serif',
  textLayout: 'stacked' as const,
  aspectRatio: '9:16' as const,
  promptStyle: 'concise' as const
};

// 标题配置（用户提供了）
const mockTitles = {
  hero: { zh: '阳光鲜橙', en: 'SUNSHINE ORANGE' },
  lifestyle: { zh: '活力每一天', en: 'Vitality Every Day' },
  detail: { zh: '新鲜之源', en: 'Source of Freshness' }
};

// 生成提示词
const prompts = generatePrompts(mockOrangeProduct, mockStyle, 'concise');

// 输出三种海报的提示词
console.log('=== 主KV海报 ===');
const heroPrompt = prompts.posters[0]; // 01 hero
console.log('英文提示词:');
console.log(heroPrompt.promptEn);
console.log('\n中文提示词:');
console.log(heroPrompt.promptZh);

console.log('\n\n=== 生活场景海报 ===');
const lifestylePrompt = prompts.posters[1]; // 02 lifestyle
console.log('英文提示词:');
console.log(lifestylePrompt.promptEn);
console.log('\n中文提示词:');
console.log(lifestylePrompt.promptZh);

console.log('\n\n=== 材质特写海报 ===');
const detailPrompt = prompts.posters[3]; // 04 detail (01是hero, 02是lifestyle, 03是process, 04是detail)
console.log('英文提示词:');
console.log(detailPrompt.promptEn);
console.log('\n中文提示词:');
console.log(detailPrompt.promptZh);

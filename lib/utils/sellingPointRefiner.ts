// lib/utils/sellingPointRefiner.ts

import { AnalysisResponse } from '@/contexts/AppContext';

/**
 * 卖点精炼器
 * 将平淡的大白话转化为广告性质的语言词汇
 */

export interface SellingPointRefineConfig {
  originalSellingPoint: { zh: string; en: string };
  posterType: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  brandTone?: string;
  designStyle?: string;
}

/**
 * 广告语言策略映射
 * 根据海报类型和卖点内容应用不同的广告化策略
 */
const AD_STRATEGIES = {
  // 主KV：强调核心价值，使用震撼力词汇
  hero: {
    keywords: ['维生素', '营养', '健康', 'VC'],
    transforms: [
      '{original}，源头滋养',
      '{original}，自然之力',
      '{original}，焕发活力',
    ],
    enhancements: ['臻选', '尊享', '奢宠', '极致', '纯粹', '原生']
  },

  // 生活场景：强调体验和情感共鸣
  lifestyle: {
    keywords: ['产地', '直采', '新鲜', '天然'],
    transforms: [
      '{original}，触手可及',
      '{original}，生活本真',
      '{original}，日常奢享',
    ],
    enhancements: ['甄选', '源头', '一手', '当季', '限时', '鲜活']
  },

  // 工艺技术：强调专业和匠心
  process: {
    keywords: ['工艺', '技术', '制作', '生产'],
    transforms: [
      '{original}，匠心独运',
      '{original}，技艺传承',
      '{original}，精益求精',
    ],
    enhancements: ['严选', '匠心', '传承', '精湛', '独特', '专利']
  },

  // 细节特写：强调质感和品质
  detail: {
    keywords: ['纹理', '材质', '质感', '细节'],
    transforms: [
      '{original}，触感非凡',
      '{original}，细腻入微',
      '{original}，品质见证',
    ],
    enhancements: ['精致', '考究', '细腻', '卓越', '非凡', '独具']
  },

  // 品牌故事：强调情感和价值主张
  brand: {
    keywords: ['品牌', '故事', '理念', '传承'],
    transforms: [
      '{original}，初心不改',
      '{original}，价值共鸣',
      '{original}，信仰所在',
    ],
    enhancements: ['坚守', '笃行', '真诚', '纯粹', '信仰', '使命']
  },

  // 产品参数：强调数据和权威
  specs: {
    keywords: ['规格', '参数', '标准', '认证'],
    transforms: [
      '{original}，权威认证',
      '{original}，品质保证',
      '{original}，实力见证',
    ],
    enhancements: ['严苛', '专业', '权威', '领先', '标准', '认证']
  },

  // 使用指南：强调便捷和效果
  usage: {
    keywords: ['使用', '用法', '步骤', '方法'],
    transforms: [
      '{original}，轻松掌握',
      '{original}，即刻体验',
      '{original}，简便高效',
    ],
    enhancements: ['便捷', '快速', '简单', '轻松', '即享', '立显']
  },
};

/**
 * 广告化词汇映射表
 * 将常见词汇转化为更具感染力的广告语言
 */
const AD_VOCABULARY_MAP: Record<string, { zh: string; en: string }> = {
  // 好/很好 → 卓越/非凡
  '好': { zh: '卓越', en: 'Exceptional' },
  '很好': { zh: '非凡', en: 'Extraordinary' },
  '优质': { zh: '臻选', en: 'Premium Selection' },

  // 多/丰富 → 丰沛/充沛
  '多': { zh: '丰沛', en: 'Abundant' },
  '丰富': { zh: '充沛', en: 'Rich' },
  '含有': { zh: '蕴含', en: 'Infused with' },

  // 新鲜 → 鲜活/当季
  '新鲜': { zh: '鲜活', en: 'Fresh & Vibrant' },
  '新': { zh: '当季', en: 'Seasonal' },

  // 真/真实 → 纯粹/本真
  '真实': { zh: '纯粹', en: 'Pure' },
  '真': { zh: '本真', en: 'Authentic' },

  // 大 → 卓越/极致
  '大': { zh: '卓然', en: 'Remarkable' },
  '很大': { zh: '极致', en: 'Ultimate' },

  // 好/优秀 → 优异/杰出
  '优秀': { zh: '优异', en: 'Outstanding' },
  '特别好': { zh: '杰出', en: 'Exceptional' },

  // 常见形容词升级
  '健康': { zh: '康健', en: 'Wellness' },
  '美味': { zh: '饕餮', en: 'Feast' },
};

/**
 * 卖点精炼主函数
 */
export function refineSellingPoint(
  config: SellingPointRefineConfig
): { zh: string; en: string } {
  const { originalSellingPoint, posterType, brandTone, designStyle } = config;

  // 1. 提取广告化策略
  const strategy = AD_STRATEGIES[posterType];

  // 2. 应用词汇升级
  const vocabularyUpgraded = upgradeVocabulary(originalSellingPoint);

  // 3. 根据品牌调性调整语气
  const toneAdjusted = adjustTone(vocabularyUpgraded, brandTone, designStyle);

  // 4. 应用海报类型的广告策略
  const strategyApplied = applyStrategy(toneAdjusted, posterType, strategy);

  // 5. 精炼到最核心的2-6个字
  const refined = shortenToCore(strategyApplied);

  return refined;
}

/**
 * 词汇升级：将平淡词汇替换为广告化词汇
 */
function upgradeVocabulary(
  sellingPoint: { zh: string; en: string }
): { zh: string; en: string } {
  let upgradedZh = sellingPoint.zh;
  let upgradedEn = sellingPoint.en;

  // 遍历词汇映射表进行替换
  for (const [plain, adWord] of Object.entries(AD_VOCABULARY_MAP)) {
    const regex = new RegExp(plain, 'g');
    upgradedZh = upgradedZh.replace(regex, adWord.zh);
    upgradedEn = upgradedEn.replace(new RegExp(plain, 'gi'), adWord.en);
  }

  return { zh: upgradedZh, en: upgradedEn };
}

/**
 * 语气调整：根据品牌调性调整语言风格
 */
function adjustTone(
  sellingPoint: { zh: string; en: string },
  brandTone?: string,
  designStyle?: string
): { zh: string; en: string } {
  if (!brandTone && !designStyle) {
    return sellingPoint;
  }

  // 品牌调性关键词映射
  const toneMap: Record<string, { prefix?: { zh: string; en: string }; suffix?: { zh: string; en: string } }> = {
    '高端': {
      prefix: { zh: '奢享', en: 'Luxurious' },
      suffix: { zh: '臻品', en: 'Masterpiece' }
    },
    '年轻': {
      prefix: { zh: '潮玩', en: 'Trendy' },
      suffix: { zh: '必备', en: 'Essential' }
    },
    '自然': {
      prefix: { zh: '原生', en: 'Natural' },
      suffix: { zh: '之选', en: 'Choice' }
    },
    '专业': {
      prefix: { zh: '专业', en: 'Professional' },
      suffix: { zh: '品质', en: 'Quality' }
    },
  };

  // 设计风格映射
  const styleMap: Record<string, { prefix?: { zh: string; en: string }; suffix?: { zh: string; en: string } }> = {
    'magazine': {
      prefix: { zh: '臻', en: 'Premium' },
      suffix: { zh: '呈现', en: 'Presentation' }
    },
    'minimal': {
      prefix: { zh: '纯粹', en: 'Pure' },
      suffix: { zh: '之美', en: 'Aesthetics' }
    },
    'tech': {
      prefix: { zh: '科技', en: 'Tech' },
      suffix: { zh: '之力', en: 'Power' }
    },
  };

  // 尝试匹配品牌调性
  for (const [toneKey, toneValue] of Object.entries(toneMap)) {
    if (brandTone && brandTone.includes(toneKey)) {
      if (toneValue.prefix) {
        return {
          zh: `${toneValue.prefix.zh}${sellingPoint.zh}`,
          en: `${toneValue.prefix.en} ${sellingPoint.en}`
        };
      }
    }
  }

  // 尝试匹配设计风格
  for (const [styleKey, styleValue] of Object.entries(styleMap)) {
    if (designStyle && designStyle.includes(styleKey)) {
      if (styleValue.suffix) {
        return {
          zh: `${sellingPoint.zh}${styleValue.suffix.zh}`,
          en: `${sellingPoint.en} ${styleValue.suffix.en}`
        };
      }
    }
  }

  return sellingPoint;
}

/**
 * 策略应用：根据海报类型添加广告化前缀/后缀
 */
function applyStrategy(
  sellingPoint: { zh: string; en: string },
  posterType: string,
  strategy: any
): { zh: string; en: string } {
  // 检查是否包含关键词
  const hasKeyword = strategy.keywords.some((keyword: string) =>
    sellingPoint.zh.includes(keyword) || sellingPoint.en.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasKeyword) {
    return sellingPoint;
  }

  // 随机选择一个转换模板
  const template = strategy.transforms[Math.floor(Math.random() * strategy.transforms.length)];

  // 应用模板
  const result = {
    zh: template.replace('{original}', sellingPoint.zh),
    en: template.replace('{original}', sellingPoint.en),
  };

  return result;
}

/**
 * 精炼核心：缩短到2-6个字的广告语
 * 提取最核心的广告化表达
 */
function shortenToCore(
  sellingPoint: { zh: string; en: string }
): { zh: string; en: string } {
  // 中文：提取2-6个字的核心词
  const zhWords = sellingPoint.zh.split(/[，、，·]/).filter(w => w.trim().length > 0);
  const coreZh = zhWords[0]?.trim().slice(0, 6) || sellingPoint.zh.slice(0, 6);

  // 英文：提取1-3个词的核心词
  const enWords = sellingPoint.en.split(/\s+/).filter(w => w.trim().length > 0);
  let coreEn = enWords.slice(0, 3).join(' ');

  // 英文如果太长，取前两个词
  if (coreEn.length > 25) {
    coreEn = enWords.slice(0, 2).join(' ');
  }

  return {
    zh: coreZh,
    en: coreEn
  };
}

/**
 * 批量精炼卖点
 * 为多个海报类型精炼卖点
 */
export function refineSellingPoints(
  productInfo: AnalysisResponse,
  posterType: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage',
  rawSellingPoint: { zh: string; en: string }
): { zh: string; en: string } {
  return refineSellingPoint({
    originalSellingPoint: rawSellingPoint,
    posterType,
    brandTone: productInfo.brandTone,
    designStyle: productInfo.designStyle,
  });
}

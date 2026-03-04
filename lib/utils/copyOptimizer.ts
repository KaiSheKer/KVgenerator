// lib/utils/copyOptimizer.ts

import { AnalysisResponse } from '@/contexts/AppContext';

/**
 * 文案优化器 - 将原始卖点文案转化为场景化、情感化、数据化的优质文案
 * 参考示例文档中的文案策略
 */

export interface CopyOptimizationConfig {
  posterType: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  brandTone: string;
  targetAudience: string;
  designStyle: string;
  parameters?: AnalysisResponse['parameters'];
}

/**
 * 主优化函数 - 根据海报类型和品牌调性优化文案
 */
export function optimizeCopy(
  originalCopy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string; subtitle?: { zh: string; en: string } } {
  const { posterType, brandTone, targetAudience } = config;

  // 根据海报类型选择优化策略
  switch (posterType) {
    case 'hero':
      return optimizeForHero(originalCopy, config);
    case 'lifestyle':
      return optimizeForLifestyle(originalCopy, config);
    case 'process':
      return optimizeForProcess(originalCopy, config);
    case 'detail':
      return optimizeForDetail(originalCopy, config);
    case 'brand':
      return optimizeForBrand(originalCopy, config);
    case 'specs':
      return optimizeForSpecs(originalCopy, config);
    case 'usage':
      return optimizeForUsage(originalCopy, config);
    default:
      return originalCopy;
  }
}

/**
 * 主KV海报文案优化 - 极简聚焦
 * 策略：保持简洁，突出核心
 */
function optimizeForHero(
  copy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string; subtitle?: { zh: string; en: string } } {
  // 简化文案，提取核心关键词
  const simplifiedZh = simplifyChinese(copy.zh);
  const simplifiedEn = simplifyEnglish(copy.en);

  return {
    zh: simplifiedZh,
    en: simplifiedEn,
  };
}

/**
 * 生活场景文案优化 - 场景化包装
 * 策略：融入使用场景，增加情感共鸣
 */
function optimizeForLifestyle(
  copy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string; subtitle?: { zh: string; en: string } } {
  const sceneCopy = wrapWithScene(copy, config);

  return {
    zh: sceneCopy.zh,
    en: sceneCopy.en,
    subtitle: {
      zh: '开启活力每一天',
      en: 'Start Your Day with Vitality',
    },
  };
}

/**
 * 工艺技术文案优化 - 数据化表达
 * 策略：用具体数据增强说服力
 */
function optimizeForProcess(
  copy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string; subtitle?: { zh: string; en: string } } {
  return {
    zh: copy.zh,
    en: copy.en,
    subtitle: {
      zh: '科技锁鲜',
      en: 'Freshness Technology',
    },
  };
}

/**
 * 细节特写文案优化 - 单点突出
 * 策略：聚焦一个细节，深度描述
 */
function optimizeForDetail(
  copy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string; subtitle?: { zh: string; en: string } } {
  return {
    zh: copy.zh,
    en: copy.en,
  };
}

/**
 * 品牌故事文案优化 - 情感化表达
 * 策略：传递品牌理念和价值
 */
function optimizeForBrand(
  copy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string; subtitle?: { zh: string; en: string } } {
  return {
    zh: copy.zh,
    en: copy.en,
    subtitle: {
      zh: '品牌故事',
      en: 'Brand Story',
    },
  };
}

/**
 * 产品参数文案优化 - 精准表达
 */
function optimizeForSpecs(
  copy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string; subtitle?: { zh: string; en: string } } {
  return {
    zh: '产品参数',
    en: 'Specifications',
  };
}

/**
 * 使用指南文案优化 - 友好引导
 */
function optimizeForUsage(
  copy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string; subtitle?: { zh: string; en: string } } {
  return {
    zh: '使用指南',
    en: 'Usage Guide',
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

function simplifyChinese(text: string): string {
  // 移除常见的营销词汇，保留核心
  const stopWords = ['精选', '优质', '纯正', '天然', '进口'];
  let result = text;
  stopWords.forEach(word => {
    result = result.replace(word, '');
  });
  return result.trim();
}

function simplifyEnglish(text: string): string {
  const stopWords = ['Premium', 'Selected', 'Pure', 'Natural', 'Imported'];
  let result = text;
  stopWords.forEach(word => {
    result = result.replace(new RegExp(word, 'gi'), '');
  });
  return result.trim();
}

function wrapWithScene(
  copy: { zh: string; en: string },
  config: CopyOptimizationConfig
): { zh: string; en: string } {
  // 为文案添加场景感
  return {
    zh: copy.zh,
    en: copy.en,
  };
}

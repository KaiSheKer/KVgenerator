// lib/utils/posterTypeConfig.ts

/**
 * 海报类型差异化配置
 * 为10种海报类型定义独特的场景、光影、文案策略
 */

export interface PosterTypeConfig {
  type: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  sceneKeywords: string[];
  lighting: string;
  copyStrategy: 'minimal-focus' | 'scene-integrated' | 'single-highlight' | 'emotional' | 'technical' | 'data-driven' | 'instructional';
  photographyStyle: string;
  backgroundSuggestion: string;
}

export const POSTER_TYPE_CONFIGS: Record<string, PosterTypeConfig> = {
  // 海报01 - 主KV视觉
  hero: {
    type: 'hero',
    sceneKeywords: [
      'single hero object',
      'center composition',
      'clean gradient backdrop',
      'minimalist',
    ],
    lighting: 'dramatic rim lighting',
    copyStrategy: 'minimal-focus',
    photographyStyle: 'high-end product photography',
    backgroundSuggestion: 'clean gradient background',
  },

  // 海报02 - 生活场景
  lifestyle: {
    type: 'lifestyle',
    sceneKeywords: [
      'daily life scene',
      'natural usage context',
      'authentic atmosphere',
      'lifestyle photography',
    ],
    lighting: 'soft natural side lighting',
    copyStrategy: 'scene-integrated',
    photographyStyle: 'lifestyle photography',
    backgroundSuggestion: 'home/kitchen/office environment',
  },

  // 海报03 - 工艺技术
  process: {
    type: 'process',
    sceneKeywords: [
      'technical visualization',
      'process illustration',
      'conceptual scene',
      'infographic elements',
    ],
    lighting: 'controlled studio highlights',
    copyStrategy: 'technical',
    photographyStyle: 'technical illustration',
    backgroundSuggestion: 'studio or gradient background',
  },

  // 海报04-07 - 细节特写
  detail: {
    type: 'detail',
    sceneKeywords: [
      'macro close-up',
      'texture focus',
      'shallow depth of field',
      'detail emphasis',
    ],
    lighting: 'macro contrast lighting',
    copyStrategy: 'single-highlight',
    photographyStyle: 'macro photography',
    backgroundSuggestion: 'blurred background (bokeh)',
  },

  // 海报08 - 品牌故事
  brand: {
    type: 'brand',
    sceneKeywords: [
      'brand storytelling',
      'emotional atmosphere',
      'brand environment',
      'cinematic scene',
    ],
    lighting: 'cinematic ambient lighting',
    copyStrategy: 'emotional',
    photographyStyle: 'brand photography',
    backgroundSuggestion: 'brand-related environment',
  },

  // 海报09 - 产品参数
  specs: {
    type: 'specs',
    sceneKeywords: [
      'technical data',
      'structured information',
      'clean infographic',
      'specification focus',
    ],
    lighting: 'clean neutral front lighting',
    copyStrategy: 'data-driven',
    photographyStyle: 'technical infographic',
    backgroundSuggestion: 'clean studio or gradient',
  },

  // 海报10 - 使用指南
  usage: {
    type: 'usage',
    sceneKeywords: [
      'step-by-step flow',
      'instructional icons',
      'clear process',
      'easy to follow',
    ],
    lighting: 'bright practical lighting',
    copyStrategy: 'instructional',
    photographyStyle: 'instructional design',
    backgroundSuggestion: 'clean background with guide blocks',
  },
};

/**
 * 根据海报类型获取配置
 */
export function getPosterTypeConfig(
  posterType: string
): PosterTypeConfig {
  return POSTER_TYPE_CONFIGS[posterType] || POSTER_TYPE_CONFIGS.hero;
}

/**
 * 根据海报类型获取场景关键词
 */
export function getSceneKeywords(posterType: string): string[] {
  return getPosterTypeConfig(posterType).sceneKeywords;
}

/**
 * 根据海报类型获取光影方案
 */
export function getLightingHint(posterType: string): string {
  return getPosterTypeConfig(posterType).lighting;
}

/**
 * 根据海报类型获取摄影风格
 */
export function getPhotographyStyle(posterType: string): string {
  return getPosterTypeConfig(posterType).photographyStyle;
}

// lib/utils/layoutBuilder.ts

import { AnalysisResponse, StyleConfig } from '@/contexts/AppContext';

/**
 * 版式构建器 - 生成详细的版式配置
 * 参考示例文档的详细排版说明
 */

export interface LayoutBuildConfig {
  posterType: 'hero' | 'lifestyle' | 'process' | 'detail' | 'brand' | 'specs' | 'usage';
  productInfo: AnalysisResponse;
  style: StyleConfig;
  title: { zh: string; en: string };
  subtitle?: { zh: string; en: string };
  sellingPoints?: Array<{ zh: string; en: string }>;
}

export interface DetailedLayoutSpec {
  layout: 'hero' | 'lifestyle' | 'generic' | 'specs';
  titleZh: string;
  titleEn: string;
  subtitleZh?: string;
  subtitleEn?: string;
  bullets?: Array<{ zh: string; en: string }>;
  logoText: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    textOnDark: string;
  };

  // 详细版式配置
  detailedLayout?: {
    logoPosition: LogoPosition;
    titlePosition: TitlePosition;
    subtitlePosition?: SubtitlePosition;
    sellingPoints?: SellingPointsLayout;
    ctaButton?: CTAButton;
  };
}

export interface LogoPosition {
  position: 'top-left' | 'top-center' | 'top-right';
  size: string;
  alignment: string;
}

export interface TitlePosition {
  position: string;
  fontSize: string;
  color: string;
  font: string;
  layout: 'stacked' | 'parallel' | 'separated';
}

export interface SubtitlePosition {
  position: string;
  fontSize: string;
  color: string;
  font: string;
}

export interface SellingPointsLayout {
  layout: 'card' | 'list' | 'grid';
  position: string;
  items: Array<{
    icon: string;
    zh: string;
    en: string;
    format: 'slash' | 'stacked';
  }>;
}

export interface CTAButton {
  text: string;
  position: string;
  size: string;
  bgColor: string;
  textColor: string;
  borderRadius: string;
}

/**
 * 构建详细版式配置
 */
export function buildDetailedLayout(config: LayoutBuildConfig): DetailedLayoutSpec {
  const { posterType, productInfo, style, title, subtitle, sellingPoints } = config;

  const palette = {
    primary: productInfo.colorScheme.primary[0] || '#5F77FF',
    secondary: productInfo.colorScheme.secondary[0] || '#8CA2FF',
    accent: productInfo.colorScheme.accent[0] || '#C248FF',
    textOnDark: '#F7F8FF',
  };

  const baseLayout: DetailedLayoutSpec = {
    layout: posterType === 'specs' ? 'specs' : posterType,
    titleZh: title.zh,
    titleEn: title.en,
    subtitleZh: subtitle?.zh,
    subtitleEn: subtitle?.en,
    logoText: `${productInfo.brandName.en} | ${productInfo.brandName.zh}`,
    palette,
  };

  // 根据海报类型构建不同的详细版式
  switch (posterType) {
    case 'hero':
      return buildHeroLayout(baseLayout, config);
    case 'lifestyle':
      return buildLifestyleLayout(baseLayout, config);
    case 'detail':
      return buildDetailLayout(baseLayout, config);
    default:
      return baseLayout;
  }
}

/**
 * 主KV海报版式
 */
function buildHeroLayout(
  base: DetailedLayoutSpec,
  config: LayoutBuildConfig
): DetailedLayoutSpec {
  return {
    ...base,
    layout: 'hero',
    detailedLayout: {
      logoPosition: {
        position: 'top-center',
        size: '占画面5%宽度',
        alignment: '居中对齐',
      },
      titlePosition: {
        position: '顶部居中',
        fontSize: '占画面30%宽度',
        color: config.productInfo.colorScheme.accent[0],
        font: '粗衬线字体',
        layout: 'stacked', // 中文在上，英文在下
      },
      subtitlePosition: {
        position: '主标题下方，细线装饰后',
        fontSize: '主标题的50%',
        color: config.productInfo.colorScheme.secondary[0],
        font: '细无衬线字体',
      },
    },
  };
}

/**
 * 生活场景海报版式
 */
function buildLifestyleLayout(
  base: DetailedLayoutSpec,
  config: LayoutBuildConfig
): DetailedLayoutSpec {
  return {
    ...base,
    layout: 'lifestyle',
    detailedLayout: {
      logoPosition: {
        position: 'top-left',
        size: '占画面4%宽度',
        alignment: '左对齐',
      },
      titlePosition: {
        position: '左侧中部',
        fontSize: '占画面25%宽度',
        color: config.productInfo.colorScheme.primary[0],
        font: '无衬线字体',
        layout: 'parallel', // 中英并列
      },
    },
  };
}

/**
 * 细节特写海报版式
 */
function buildDetailLayout(
  base: DetailedLayoutSpec,
  config: LayoutBuildConfig
): DetailedLayoutSpec {
  return {
    ...base,
    layout: 'generic',
    detailedLayout: {
      logoPosition: {
        position: 'top-left',
        size: '占画面4%宽度',
        alignment: '左对齐',
      },
      titlePosition: {
        position: '左上角',
        fontSize: '占画面20%宽度',
        color: config.productInfo.colorScheme.primary[0],
        font: '细无衬线字体',
        layout: 'stacked',
      },
    },
  };
}

import { PosterOverlaySpec } from '@/contexts/AppContext';

export interface ComposePosterArgs {
  imageUrl: string;
  width: number;
  height: number;
  spec?: PosterOverlaySpec;
}

export interface ComposePosterResult {
  dataUrl: string;
  applied: boolean;
}

const ZH_FONT_FAMILY = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
const EN_FONT_FAMILY = '"Inter","Helvetica Neue","Arial",sans-serif';

interface OverlayArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SubjectRegion extends OverlayArea {
  centerX: number;
  centerY: number;
}

interface ScoredOverlayArea extends OverlayArea {
  score: number;
}

interface ScoredAreaWithPlan {
  area: ScoredOverlayArea;
  plan: ResolvedLayoutPlan;
}

interface OverlayTone {
  primary: string;
  secondary: string;
  tertiary: string;
  logo: string;
  stroke: string;
  ctaText: string;
}

interface TypographyScale {
  logo: number;
  titleZh: number;
  titleEn: number;
  subtitleZh: number;
  subtitleEn: number;
  bulletZh: number;
  bulletEn: number;
  cta: number;
}

interface BulletLineGroup {
  zhLines: string[];
  enLines: string[];
}

interface PreparedTextBlocks {
  titleZhLines: string[];
  titleEnLines: string[];
  subtitleZhLines: string[];
  subtitleEnLines: string[];
  bullets: BulletLineGroup[];
  ctaText: string;
}

interface LayoutMetrics {
  logoBlockHeight: number;
  bodyHeight: number;
  bulletLeadingGap: number;
  bulletLineGap: number;
  ctaGap: number;
  ctaHeight: number;
  totalHeight: number;
}

interface ResolvedLayoutPlan {
  textMaxWidth: number;
  textX: number;
  typography: TypographyScale;
  blocks: PreparedTextBlocks;
  metrics: LayoutMetrics;
}

export async function composePosterWithOverlay(
  args: ComposePosterArgs
): Promise<ComposePosterResult> {
  const { imageUrl, width, height, spec } = args;
  if (!spec) {
    return { dataUrl: imageUrl, applied: false };
  }
  if (typeof document === 'undefined') {
    return { dataUrl: imageUrl, applied: false };
  }

  try {
    const img = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width || img.naturalWidth || 900));
    canvas.height = Math.max(1, Math.round(height || img.naturalHeight || 1600));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { dataUrl: imageUrl, applied: false };
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawOverlay(ctx, canvas.width, canvas.height, spec);

    return {
      dataUrl: canvas.toDataURL('image/png'),
      applied: true,
    };
  } catch (error) {
    console.warn('Poster overlay composition failed, fallback to raw image.', error);
    return { dataUrl: imageUrl, applied: false };
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 128)}`));
    img.src = src;
  });
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spec: PosterOverlaySpec
) {
  const palette = {
    primary: spec.palette?.primary || '#5F77FF',
    secondary: spec.palette?.secondary || '#8CA2FF',
    accent: spec.palette?.accent || '#C248FF',
  };

  const subjectRegion = detectSubjectRegion(ctx, width, height);
  const selected = pickBestOverlayArea(
    ctx,
    width,
    height,
    spec,
    subjectRegion
  );
  const tone = resolveOverlayTone(ctx, selected.area);

  if (shouldDrawOverlayDebug()) {
    drawOverlayDebug(ctx, subjectRegion, selected.area, selected.area.score);
  }

  drawOverlayContent(
    ctx,
    spec,
    selected.plan,
    selected.area,
    tone,
    palette,
    height
  );
}

function detectSubjectRegion(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): SubjectRegion {
  const fallback = {
    x: width * 0.26,
    y: height * 0.18,
    width: width * 0.48,
    height: height * 0.64,
    centerX: width * 0.5,
    centerY: height * 0.5,
  };

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return fallback;
  }

  const step = Math.max(6, Math.round(Math.min(width, height) / 95));
  const points: Array<{ x: number; y: number; energy: number }> = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.hypot(centerX, centerY);

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const idx = (y * width + x) * 4;
      const idxRight = (y * width + (x + step)) * 4;
      const idxDown = ((y + step) * width + x) * 4;

      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const lumRight =
        0.2126 * pixels[idxRight] +
        0.7152 * pixels[idxRight + 1] +
        0.0722 * pixels[idxRight + 2];
      const lumDown =
        0.2126 * pixels[idxDown] +
        0.7152 * pixels[idxDown + 1] +
        0.0722 * pixels[idxDown + 2];

      const edge = Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
      const maxRgb = Math.max(r, g, b);
      const minRgb = Math.min(r, g, b);
      const sat = maxRgb - minRgb;

      const dist = Math.hypot(x - centerX, y - centerY);
      const centerBias = 1 - Math.min(1, dist / maxDist) * 0.46;
      const energy = (edge * 0.72 + sat * 0.28) * centerBias;

      points.push({ x, y, energy });
    }
  }

  if (points.length < 20) {
    return fallback;
  }

  const threshold = quantile(points.map((point) => point.energy), 0.72);
  const salient = points.filter((point) => point.energy >= threshold);
  if (salient.length < 10) {
    return fallback;
  }

  let sumWeight = 0;
  let sumX = 0;
  let sumY = 0;
  for (const point of salient) {
    const w = Math.max(0.001, point.energy);
    sumWeight += w;
    sumX += point.x * w;
    sumY += point.y * w;
  }
  const meanX = sumX / sumWeight;
  const meanY = sumY / sumWeight;

  let varX = 0;
  let varY = 0;
  for (const point of salient) {
    const w = Math.max(0.001, point.energy);
    varX += (point.x - meanX) ** 2 * w;
    varY += (point.y - meanY) ** 2 * w;
  }
  varX /= sumWeight;
  varY /= sumWeight;

  const stdX = Math.sqrt(varX);
  const stdY = Math.sqrt(varY);
  const boxWidth = clamp(stdX * 3.2, width * 0.2, width * 0.82);
  const boxHeight = clamp(stdY * 3.5, height * 0.26, height * 0.9);

  const x = clamp(meanX - boxWidth / 2, width * 0.02, width - boxWidth - width * 0.02);
  const y = clamp(meanY - boxHeight / 2, height * 0.02, height - boxHeight - height * 0.02);

  return {
    x,
    y,
    width: boxWidth,
    height: boxHeight,
    centerX: meanX,
    centerY: meanY,
  };
}

function pickBestOverlayArea(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spec: PosterOverlaySpec,
  subjectRegion: SubjectRegion
): ScoredAreaWithPlan {
  const candidates = buildCandidateAreas(width, height, spec.layout, subjectRegion);
  let best: ScoredAreaWithPlan | null = null;

  for (const candidate of candidates) {
    const plan = resolveLayoutPlan(ctx, spec, candidate);
    const score = scoreOverlayCandidate(
      ctx,
      candidate,
      plan,
      subjectRegion,
      width,
      height,
      spec.layout
    );

    if (!best || score < best.area.score) {
      best = { area: { ...candidate, score }, plan };
    }
  }

  if (best) return best;

  const fallbackArea: OverlayArea = {
    x: width * 0.05,
    y: height * 0.08,
    width: width * 0.5,
    height: height * 0.36,
  };
  return {
    area: { ...fallbackArea, score: 999 },
    plan: resolveLayoutPlan(ctx, spec, fallbackArea),
  };
}

function buildCandidateAreas(
  width: number,
  height: number,
  layout: PosterOverlaySpec['layout'],
  subject: SubjectRegion
): OverlayArea[] {
  const marginX = width * 0.04;
  const marginY = height * 0.04;
  const candidates: OverlayArea[] = [];
  const seen = new Set<string>();

  const addCandidate = (area: OverlayArea) => {
    const x = clamp(area.x, marginX, width - marginX - area.width);
    const y = clamp(area.y, marginY, height - marginY - area.height);
    const normalized: OverlayArea = {
      x,
      y,
      width: clamp(area.width, width * 0.28, width * 0.7),
      height: clamp(area.height, height * 0.18, height * 0.56),
    };

    if (
      normalized.width < width * 0.26 ||
      normalized.height < height * 0.16 ||
      normalized.x + normalized.width > width - marginX + 1 ||
      normalized.y + normalized.height > height - marginY + 1
    ) {
      return;
    }

    const key = [
      Math.round(normalized.x),
      Math.round(normalized.y),
      Math.round(normalized.width),
      Math.round(normalized.height),
    ].join(':');
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(normalized);
  };

  const freeRects = buildSubjectAwareRectangles(width, height, subject);

  for (const rect of freeRects) {
    if (layout === 'specs') {
      const areaW = clamp(rect.width * 0.92, width * 0.36, width * 0.58);
      const areaH = clamp(rect.height * 0.86, height * 0.2, height * 0.36);
      pushAnchoredCandidates(addCandidate, rect, areaW, areaH, [
        [0, 0],
        [0.5, 0],
        [1, 0],
        [0, 1],
        [0.5, 1],
        [1, 1],
      ]);
      continue;
    }

    const areaW = clamp(rect.width * 0.9, width * 0.34, width * 0.56);
    const areaH = clamp(rect.height * 0.84, height * 0.2, height * 0.42);
    pushAnchoredCandidates(addCandidate, rect, areaW, areaH, [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0.5, 0],
      [0.5, 1],
      [0.5, 0.5],
    ]);
  }

  addCandidate({
    x: width * 0.05,
    y: layout === 'specs' ? height * 0.56 : height * 0.1,
    width: width * (layout === 'specs' ? 0.48 : 0.46),
    height: height * (layout === 'specs' ? 0.28 : 0.34),
  });
  addCandidate({
    x: width * 0.49,
    y: layout === 'specs' ? height * 0.56 : height * 0.1,
    width: width * (layout === 'specs' ? 0.46 : 0.44),
    height: height * (layout === 'specs' ? 0.28 : 0.34),
  });

  return candidates;
}

function buildSubjectAwareRectangles(
  width: number,
  height: number,
  subject: SubjectRegion
): OverlayArea[] {
  const marginX = width * 0.04;
  const marginY = height * 0.04;
  const gapX = width * 0.03;
  const gapY = height * 0.03;

  const safeSubject: OverlayArea = {
    x: clamp(subject.x, marginX, width - marginX),
    y: clamp(subject.y, marginY, height - marginY),
    width: clamp(subject.width, width * 0.2, width * 0.9),
    height: clamp(subject.height, height * 0.2, height * 0.9),
  };

  const rects: OverlayArea[] = [];

  const topH = safeSubject.y - gapY - marginY;
  if (topH > height * 0.1) {
    rects.push({
      x: marginX,
      y: marginY,
      width: width - marginX * 2,
      height: topH,
    });
  }

  const bottomY = safeSubject.y + safeSubject.height + gapY;
  const bottomH = height - marginY - bottomY;
  if (bottomH > height * 0.1) {
    rects.push({
      x: marginX,
      y: bottomY,
      width: width - marginX * 2,
      height: bottomH,
    });
  }

  const leftW = safeSubject.x - gapX - marginX;
  if (leftW > width * 0.1) {
    rects.push({
      x: marginX,
      y: marginY,
      width: leftW,
      height: height - marginY * 2,
    });
  }

  const rightX = safeSubject.x + safeSubject.width + gapX;
  const rightW = width - marginX - rightX;
  if (rightW > width * 0.1) {
    rects.push({
      x: rightX,
      y: marginY,
      width: rightW,
      height: height - marginY * 2,
    });
  }

  return rects;
}

function pushAnchoredCandidates(
  addCandidate: (area: OverlayArea) => void,
  container: OverlayArea,
  areaWidth: number,
  areaHeight: number,
  anchors: Array<[number, number]>
) {
  const usableW = Math.max(0, container.width - areaWidth);
  const usableH = Math.max(0, container.height - areaHeight);

  for (const [ax, ay] of anchors) {
    addCandidate({
      x: container.x + usableW * ax,
      y: container.y + usableH * ay,
      width: areaWidth,
      height: areaHeight,
    });
  }
}

function scoreOverlayCandidate(
  ctx: CanvasRenderingContext2D,
  area: OverlayArea,
  plan: ResolvedLayoutPlan,
  subject: SubjectRegion,
  width: number,
  height: number,
  layout: PosterOverlaySpec['layout']
): number {
  const clutterScore = scoreAreaClutter(ctx, area);
  const overlap = overlapRatio(area, subject);
  const overlapPenalty = overlap * 360;
  const distanceToSubject = rectDistance(area, subject);
  const minPreferredGap = Math.min(width, height) * 0.04;
  const gapPenalty =
    distanceToSubject < minPreferredGap
      ? (minPreferredGap - distanceToSubject) * 1.8
      : 0;
  const overflow = Math.max(0, plan.metrics.totalHeight - area.height * 0.9);
  const overflowPenalty = overflow > 0 ? 180 + overflow * 1.9 : 0;

  const areaRatio = (area.width * area.height) / (width * height);
  const oversizePenalty = areaRatio > 0.26 ? (areaRatio - 0.26) * 320 : 0;
  const undersizePenalty = areaRatio < 0.1 ? (0.1 - areaRatio) * 120 : 0;

  const areaCenterX = area.x + area.width / 2;
  const areaCenterY = area.y + area.height / 2;
  const centerDistance = Math.hypot(areaCenterX - subject.centerX, areaCenterY - subject.centerY);
  const centerDistanceNorm = centerDistance / Math.hypot(width, height);
  const nearSubjectPenalty = centerDistanceNorm < 0.16 ? (0.16 - centerDistanceNorm) * 180 : 0;

  const targetY =
    layout === 'specs'
      ? 0.66
      : subject.centerY / height < 0.5
        ? 0.68
        : 0.16;
  const areaY = (area.y + area.height * 0.2) / height;
  const anchorYPenalty = Math.abs(areaY - targetY) * 14;

  const targetX = layout === 'specs' ? 0.5 : subject.centerX / width < 0.5 ? 0.74 : 0.26;
  const areaX = (area.x + area.width / 2) / width;
  const anchorXPenalty = Math.abs(areaX - targetX) * 10;

  return (
    clutterScore +
    overlapPenalty +
    gapPenalty +
    overflowPenalty +
    oversizePenalty +
    undersizePenalty +
    nearSubjectPenalty +
    anchorYPenalty +
    anchorXPenalty
  );
}

function scoreAreaClutter(
  ctx: CanvasRenderingContext2D,
  area: OverlayArea
): number {
  const x = Math.max(0, Math.round(area.x));
  const y = Math.max(0, Math.round(area.y));
  const w = Math.max(2, Math.round(area.width));
  const h = Math.max(2, Math.round(area.height));

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x, y, w, h).data;
  } catch {
    return 90;
  }

  const step = 20;
  let count = 0;
  let sumLum = 0;
  let sumLumSq = 0;
  let edgeSum = 0;

  for (let py = 0; py < h - 1; py += step) {
    for (let px = 0; px < w - 1; px += step) {
      const idx = (py * w + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sumLum += lum;
      sumLumSq += lum * lum;

      const idxRight = (py * w + (px + 1)) * 4;
      const idxDown = ((py + 1) * w + px) * 4;
      const lumRight =
        0.2126 * data[idxRight] +
        0.7152 * data[idxRight + 1] +
        0.0722 * data[idxRight + 2];
      const lumDown =
        0.2126 * data[idxDown] +
        0.7152 * data[idxDown + 1] +
        0.0722 * data[idxDown + 2];

      edgeSum += Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
      count += 1;
    }
  }

  if (count === 0) return 90;
  const avgLum = sumLum / count;
  const variance = Math.max(0, sumLumSq / count - avgLum * avgLum);
  const edge = edgeSum / count;
  const brightnessPenalty = Math.abs(avgLum - 100) * 0.18;

  return variance * 0.055 + edge * 0.82 + brightnessPenalty;
}

function overlapRatio(a: OverlayArea, b: OverlayArea): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 <= x1 || y2 <= y1) return 0;

  const overlapArea = (x2 - x1) * (y2 - y1);
  const area = a.width * a.height;
  if (area <= 0) return 0;
  return overlapArea / area;
}

function rectDistance(a: OverlayArea, b: OverlayArea): number {
  const dx = Math.max(0, Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width)));
  const dy = Math.max(0, Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height)));
  return Math.hypot(dx, dy);
}

function resolveOverlayTone(
  ctx: CanvasRenderingContext2D,
  area: OverlayArea
): OverlayTone {
  const avgLum = sampleAverageLuminance(ctx, area);

  if (avgLum >= 154) {
    return {
      primary: 'rgba(20,30,45,0.96)',
      secondary: 'rgba(36,50,72,0.9)',
      tertiary: 'rgba(58,76,102,0.88)',
      logo: 'rgba(14,24,40,0.95)',
      stroke: 'rgba(255,255,255,0.82)',
      ctaText: 'rgba(246,249,255,0.98)',
    };
  }

  return {
    primary: 'rgba(246,247,255,0.96)',
    secondary: 'rgba(224,232,255,0.95)',
    tertiary: 'rgba(185,198,235,0.92)',
    logo: 'rgba(246,247,255,0.95)',
    stroke: 'rgba(7,11,25,0.7)',
    ctaText: 'rgba(246,247,255,0.98)',
  };
}

function sampleAverageLuminance(
  ctx: CanvasRenderingContext2D,
  area: OverlayArea
): number {
  const x = Math.max(0, Math.round(area.x));
  const y = Math.max(0, Math.round(area.y));
  const w = Math.max(2, Math.round(area.width));
  const h = Math.max(2, Math.round(area.height));

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x, y, w, h).data;
  } catch {
    return 120;
  }

  const step = 24;
  let sumLum = 0;
  let count = 0;

  for (let py = 0; py < h; py += step) {
    for (let px = 0; px < w; px += step) {
      const idx = (py * w + px) * 4;
      const lum =
        0.2126 * data[idx] +
        0.7152 * data[idx + 1] +
        0.0722 * data[idx + 2];
      sumLum += lum;
      count += 1;
    }
  }

  if (count === 0) return 120;
  return sumLum / count;
}

function resolveLayoutPlan(
  ctx: CanvasRenderingContext2D,
  spec: PosterOverlaySpec,
  area: OverlayArea
): ResolvedLayoutPlan {
  const widthRatioByLayout: Record<PosterOverlaySpec['layout'], number> = {
    hero: 0.84,
    lifestyle: 0.8,
    specs: 0.84,
    generic: 0.8,
  };

  const textMaxWidth = area.width * widthRatioByLayout[spec.layout];
  const textX = area.x + area.width * 0.06;

  const baseTypography = createBaseTypography(area, spec.layout);

  let bestPlan: ResolvedLayoutPlan | null = null;
  let scale = 1;

  for (let i = 0; i < 9; i += 1) {
    const typography = scaleTypography(baseTypography, scale);
    const blocks = prepareTextBlocks(ctx, spec, textMaxWidth, typography);
    const metrics = measureLayout(blocks, typography, area, Boolean(spec.logoText));

    const plan: ResolvedLayoutPlan = {
      textMaxWidth,
      textX,
      typography,
      blocks,
      metrics,
    };

    bestPlan = plan;

    if (metrics.totalHeight <= area.height * 0.9) {
      return plan;
    }

    scale *= 0.9;
  }

  return bestPlan || {
    textMaxWidth,
    textX,
    typography: scaleTypography(baseTypography, 0.72),
    blocks: prepareTextBlocks(ctx, spec, textMaxWidth, scaleTypography(baseTypography, 0.72)),
    metrics: {
      logoBlockHeight: 0,
      bodyHeight: 0,
      bulletLeadingGap: 0,
      bulletLineGap: 0,
      ctaGap: 0,
      ctaHeight: 0,
      totalHeight: 0,
    },
  };
}

function createBaseTypography(
  area: OverlayArea,
  layout: PosterOverlaySpec['layout']
): TypographyScale {
  const ratioBoost = layout === 'specs' ? 0.94 : layout === 'hero' ? 1 : 0.97;

  return {
    logo: Math.round(clamp(area.width * 0.055 * ratioBoost, 12, 28)),
    titleZh: Math.round(clamp(area.width * 0.052 * ratioBoost, 18, 34)),
    titleEn: Math.round(clamp(area.width * 0.023 * ratioBoost, 11, 22)),
    subtitleZh: Math.round(clamp(area.width * 0.028 * ratioBoost, 12, 22)),
    subtitleEn: Math.round(clamp(area.width * 0.021 * ratioBoost, 10, 18)),
    bulletZh: Math.round(clamp(area.width * 0.022 * ratioBoost, 10, 18)),
    bulletEn: Math.round(clamp(area.width * 0.017 * ratioBoost, 9, 15)),
    cta: Math.round(clamp(area.width * 0.038 * ratioBoost, 11, 18)),
  };
}

function scaleTypography(base: TypographyScale, scale: number): TypographyScale {
  return {
    logo: Math.max(11, Math.round(base.logo * scale)),
    titleZh: Math.max(16, Math.round(base.titleZh * scale)),
    titleEn: Math.max(10, Math.round(base.titleEn * scale)),
    subtitleZh: Math.max(11, Math.round(base.subtitleZh * scale)),
    subtitleEn: Math.max(9, Math.round(base.subtitleEn * scale)),
    bulletZh: Math.max(9, Math.round(base.bulletZh * scale)),
    bulletEn: Math.max(8, Math.round(base.bulletEn * scale)),
    cta: Math.max(10, Math.round(base.cta * scale)),
  };
}

function prepareTextBlocks(
  ctx: CanvasRenderingContext2D,
  spec: PosterOverlaySpec,
  maxWidth: number,
  typography: TypographyScale
): PreparedTextBlocks {
  ctx.font = `700 ${typography.titleZh}px ${ZH_FONT_FAMILY}`;
  const titleZhLines = wrapText(ctx, spec.titleZh || '', maxWidth, 2);

  ctx.font = `600 ${typography.titleEn}px ${EN_FONT_FAMILY}`;
  const titleEnLines = wrapText(ctx, spec.titleEn || '', maxWidth, 2);

  ctx.font = `500 ${typography.subtitleZh}px ${ZH_FONT_FAMILY}`;
  const subtitleZhLines = wrapText(ctx, spec.subtitleZh || '', maxWidth, 2);

  ctx.font = `500 ${typography.subtitleEn}px ${EN_FONT_FAMILY}`;
  const subtitleEnLines = wrapText(ctx, spec.subtitleEn || '', maxWidth, 2);

  const bullets: BulletLineGroup[] = [];
  for (const bullet of (spec.bullets || []).slice(0, 2)) {
    ctx.font = `600 ${typography.bulletZh}px ${ZH_FONT_FAMILY}`;
    const zhLines = wrapText(ctx, `• ${bullet.zh || ''}`, maxWidth, 2);

    ctx.font = `500 ${typography.bulletEn}px ${EN_FONT_FAMILY}`;
    const enLines = bullet.en ? wrapText(ctx, `  ${bullet.en}`, maxWidth, 2) : [];

    bullets.push({ zhLines, enLines });
  }

  const ctaText = [spec.ctaZh, spec.ctaEn].filter(Boolean).join('  ').trim();

  return {
    titleZhLines,
    titleEnLines,
    subtitleZhLines,
    subtitleEnLines,
    bullets,
    ctaText,
  };
}

function measureLayout(
  blocks: PreparedTextBlocks,
  typography: TypographyScale,
  area: OverlayArea,
  hasLogo: boolean
): LayoutMetrics {
  const logoBlockHeight = hasLogo ? typography.logo * 1.36 : 0;
  const bulletLeadingGap = blocks.bullets.length > 0 ? Math.max(6, typography.bulletZh * 0.35) : 0;
  const bulletLineGap = Math.max(6, typography.bulletZh * 0.42);

  let bodyHeight = 0;

  bodyHeight += blocks.titleZhLines.length * typography.titleZh * 1.18;
  if (blocks.titleZhLines.length > 0) {
    bodyHeight += typography.titleZh * 0.24;
  }

  bodyHeight += blocks.titleEnLines.length * typography.titleEn * 1.34;

  if (blocks.subtitleZhLines.length > 0 || blocks.subtitleEnLines.length > 0) {
    bodyHeight += Math.max(6, typography.subtitleZh * 0.52);
    bodyHeight += blocks.subtitleZhLines.length * typography.subtitleZh * 1.28;
    bodyHeight += blocks.subtitleEnLines.length * typography.subtitleEn * 1.32;
  }

  if (blocks.bullets.length > 0) {
    bodyHeight += bulletLeadingGap;
    for (const bullet of blocks.bullets) {
      bodyHeight += bullet.zhLines.length * typography.bulletZh * 1.24;
      if (bullet.enLines.length > 0) {
        bodyHeight += bullet.enLines.length * typography.bulletEn * 1.28;
      }
      bodyHeight += bulletLineGap;
    }
  }

  const hasCta = blocks.ctaText.length > 0;
  const ctaGap = hasCta ? Math.max(8, typography.cta * 0.72) : 0;
  const ctaHeight = hasCta ? Math.max(28, typography.cta * 2.2) : 0;

  const topBottomPadding = Math.max(10, area.height * 0.05) * 2;
  const totalHeight = logoBlockHeight + bodyHeight + ctaGap + ctaHeight + topBottomPadding;

  return {
    logoBlockHeight,
    bodyHeight,
    bulletLeadingGap,
    bulletLineGap,
    ctaGap,
    ctaHeight,
    totalHeight,
  };
}

function drawOverlayContent(
  ctx: CanvasRenderingContext2D,
  spec: PosterOverlaySpec,
  plan: ResolvedLayoutPlan,
  area: OverlayArea,
  tone: OverlayTone,
  palette: { primary: string; secondary: string; accent: string },
  canvasHeight: number
) {
  const { typography, blocks, metrics, textX, textMaxWidth } = plan;
  const topPadding = Math.max(10, area.height * 0.05);
  const usableSlack = Math.max(0, area.height - metrics.totalHeight);
  const areaMidRatio = (area.y + area.height / 2) / Math.max(canvasHeight, 1);
  let y = area.y + topPadding;

  if (usableSlack > 0) {
    if (areaMidRatio <= 0.38) {
      y += usableSlack * 0.08;
    } else if (areaMidRatio >= 0.62) {
      y += usableSlack * 0.9;
    } else {
      y += usableSlack * 0.45;
    }
  }

  if (spec.logoText) {
    ctx.font = `600 ${typography.logo}px ${ZH_FONT_FAMILY}`;
    drawTextWithOutline(ctx, spec.logoText, textX, y + typography.logo, tone.logo, tone.stroke);
    y += metrics.logoBlockHeight;
  }

  ctx.font = `700 ${typography.titleZh}px ${ZH_FONT_FAMILY}`;
  y = drawLines(
    ctx,
    blocks.titleZhLines,
    textX,
    y,
    typography.titleZh,
    1.18,
    tone.primary,
    tone.stroke
  );
  if (blocks.titleZhLines.length > 0) {
    y += typography.titleZh * 0.24;
  }

  ctx.font = `600 ${typography.titleEn}px ${EN_FONT_FAMILY}`;
  y = drawLines(
    ctx,
    blocks.titleEnLines,
    textX,
    y,
    typography.titleEn,
    1.34,
    tone.secondary,
    tone.stroke
  );

  if (blocks.subtitleZhLines.length > 0 || blocks.subtitleEnLines.length > 0) {
    y += Math.max(6, typography.subtitleZh * 0.52);

    ctx.font = `500 ${typography.subtitleZh}px ${ZH_FONT_FAMILY}`;
    y = drawLines(
      ctx,
      blocks.subtitleZhLines,
      textX,
      y,
      typography.subtitleZh,
      1.28,
      tone.secondary,
      tone.stroke
    );

    ctx.font = `500 ${typography.subtitleEn}px ${EN_FONT_FAMILY}`;
    y = drawLines(
      ctx,
      blocks.subtitleEnLines,
      textX,
      y,
      typography.subtitleEn,
      1.32,
      tone.tertiary,
      tone.stroke
    );
  }

  if (blocks.bullets.length > 0) {
    y += metrics.bulletLeadingGap;
    for (const bullet of blocks.bullets) {
      ctx.font = `600 ${typography.bulletZh}px ${ZH_FONT_FAMILY}`;
      y = drawLines(
        ctx,
        bullet.zhLines,
        textX,
        y,
        typography.bulletZh,
        1.24,
        tone.primary,
        tone.stroke
      );

      if (bullet.enLines.length > 0) {
        ctx.font = `500 ${typography.bulletEn}px ${EN_FONT_FAMILY}`;
        y = drawLines(
          ctx,
          bullet.enLines,
          textX,
          y,
          typography.bulletEn,
          1.28,
          tone.tertiary,
          tone.stroke
        );
      }

      y += metrics.bulletLineGap;
    }
  }

  if (blocks.ctaText) {
    y += metrics.ctaGap;

    ctx.font = `600 ${typography.cta}px ${ZH_FONT_FAMILY}`;
    const ctaTextWidth = ctx.measureText(blocks.ctaText).width;
    const ctaWidth = clamp(
      ctaTextWidth + typography.cta * 2.4,
      area.width * 0.34,
      Math.min(area.width * 0.64, textMaxWidth)
    );

    drawCta(
      ctx,
      textX,
      y + metrics.ctaHeight,
      ctaWidth,
      metrics.ctaHeight,
      blocks.ctaText,
      palette,
      tone.ctaText,
      tone.stroke,
      typography.cta
    );
  }
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  fillColor: string,
  strokeColor: string
): number {
  if (lines.length === 0) return y;

  for (let i = 0; i < lines.length; i += 1) {
    const lineY = y + i * fontSize * lineHeight + fontSize;
    drawTextWithOutline(ctx, lines[i], x, lineY, fillColor, strokeColor);
  }

  return y + lines.length * fontSize * lineHeight;
}

function drawCta(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  palette: { primary: string; secondary: string; accent: string },
  textColor: string,
  strokeColor: string,
  fontSize: number
) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, palette.primary);
  gradient.addColorStop(1, palette.accent || palette.secondary);
  ctx.fillStyle = gradient;
  roundRect(ctx, x, y - height, width, height, Math.round(height / 2));
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.font = `600 ${fontSize}px ${ZH_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawTextWithOutline(ctx, text, x + width / 2, y - height / 2 + 1, textColor, strokeColor);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawTextWithOutline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  strokeColor: string
) {
  ctx.strokeStyle = strokeColor;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.2, Math.round((ctx.measureText('M').width || 12) * 0.085));
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  if (!text || !text.trim()) return [];
  const words = text.split(/\s+/);
  if (words.length <= 1) {
    return breakByChars(ctx, text, maxWidth, maxLines);
  }

  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }

    if (line) lines.push(line);
    line = word;
    if (lines.length >= maxLines - 1) break;
  }

  if (line && lines.length < maxLines) lines.push(line);

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth) {
      lines[maxLines - 1] = trimToWidth(ctx, last, maxWidth);
    }
  }

  return lines;
}

function breakByChars(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let line = '';

  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }

    if (line) lines.push(line);
    line = ch;
    if (lines.length >= maxLines - 1) break;
  }

  if (line && lines.length < maxLines) lines.push(line);

  if (lines.length === maxLines) {
    lines[maxLines - 1] = trimToWidth(ctx, lines[maxLines - 1], maxWidth);
  }

  return lines;
}

function trimToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }

  return `${out}…`;
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * q)));
  return sorted[idx];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function shouldDrawOverlayDebug(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('kv_overlay_debug') === '1';
  } catch {
    return false;
  }
}

function drawOverlayDebug(
  ctx: CanvasRenderingContext2D,
  subject: SubjectRegion,
  area: ScoredOverlayArea,
  score: number
) {
  ctx.save();

  ctx.strokeStyle = 'rgba(255,85,51,0.95)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(subject.x, subject.y, subject.width, subject.height);

  ctx.strokeStyle = 'rgba(57,203,95,0.95)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(area.x, area.y, area.width, area.height);

  const label = `score=${score.toFixed(1)}`;
  ctx.setLineDash([]);
  ctx.font = `600 ${Math.max(12, Math.round(area.width * 0.05))}px ${ZH_FONT_FAMILY}`;
  const labelW = ctx.measureText(label).width + 16;
  const labelH = 26;
  const lx = area.x;
  const ly = Math.max(4, area.y - labelH - 4);

  ctx.fillStyle = 'rgba(4,8,20,0.72)';
  roundRect(ctx, lx, ly, labelW, labelH, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(240,248,255,0.96)';
  ctx.fillText(label, lx + 8, ly + 18);

  ctx.restore();
}

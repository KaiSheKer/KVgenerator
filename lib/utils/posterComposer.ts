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
    drawReadabilityMask(ctx, canvas.width, canvas.height, spec.layout);
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
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 128)}`));
    img.src = src;
  });
}

function drawReadabilityMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layout: PosterOverlaySpec['layout']
) {
  const topFade = ctx.createLinearGradient(0, 0, 0, height * 0.36);
  topFade.addColorStop(0, 'rgba(6,10,30,0.84)');
  topFade.addColorStop(1, 'rgba(6,10,30,0)');
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, width, height * 0.42);

  const bottomOpacity = layout === 'specs' ? 0.72 : 0.58;
  const bottomFade = ctx.createLinearGradient(0, height, 0, height * 0.52);
  bottomFade.addColorStop(0, `rgba(5,7,22,${bottomOpacity})`);
  bottomFade.addColorStop(1, 'rgba(5,7,22,0)');
  ctx.fillStyle = bottomFade;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
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
    textOnDark: spec.palette?.textOnDark || '#F6F7FF',
  };

  const marginX = width * 0.06;
  const topY = height * 0.065;

  if (spec.logoText) {
    ctx.font = `600 ${Math.round(width * 0.028)}px ${ZH_FONT_FAMILY}`;
    ctx.fillStyle = 'rgba(246,247,255,0.95)';
    ctx.fillText(spec.logoText, marginX, topY);
  }

  switch (spec.layout) {
    case 'hero':
      drawHeroLayout(ctx, width, height, spec, palette);
      break;
    case 'lifestyle':
      drawLifestyleLayout(ctx, width, height, spec, palette);
      break;
    case 'specs':
      drawSpecsLayout(ctx, width, height, spec, palette);
      break;
    default:
      drawGenericLayout(ctx, width, height, spec, palette);
      break;
  }
}

function drawHeroLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spec: PosterOverlaySpec,
  palette: { primary: string; secondary: string; accent: string; textOnDark: string }
) {
  // Cover the top text area aggressively to avoid AI-generated text ghosting.
  drawOverlayPanel(
    ctx,
    width * 0.04,
    height * 0.11,
    width * 0.9,
    height * 0.33,
    Math.round(width * 0.03),
    'rgba(8,13,34,0.72)'
  );

  const x = width * 0.06;
  let y = height * 0.16;
  y = drawTitleStack(ctx, x, y, width * 0.88, spec, palette.textOnDark, width);

  if (spec.bullets?.length) {
    y += height * 0.04;
    drawBullets(ctx, x, y, width * 0.82, spec.bullets, palette.textOnDark, width);
  }

  drawCta(
    ctx,
    width * 0.06,
    height * 0.88,
    width * 0.42,
    height * 0.055,
    `${spec.ctaZh || '立即选购'}  ${spec.ctaEn || 'SHOP NOW'}`,
    palette
  );
}

function drawLifestyleLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spec: PosterOverlaySpec,
  palette: { primary: string; secondary: string; accent: string; textOnDark: string }
) {
  drawOverlayPanel(
    ctx,
    width * 0.04,
    height * 0.1,
    width * 0.86,
    height * 0.3,
    Math.round(width * 0.028),
    'rgba(8,13,34,0.7)'
  );

  const x = width * 0.06;
  let y = height * 0.14;
  y = drawTitleStack(ctx, x, y, width * 0.84, spec, palette.textOnDark, width);
  if (spec.bullets?.length) {
    y += height * 0.025;
    drawBullets(ctx, x, y, width * 0.78, spec.bullets, palette.textOnDark, width);
  }
  drawCta(
    ctx,
    width * 0.06,
    height * 0.88,
    width * 0.4,
    height * 0.052,
    `${spec.ctaZh || '了解更多'}  ${spec.ctaEn || 'LEARN MORE'}`,
    palette
  );
}

function drawSpecsLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spec: PosterOverlaySpec,
  palette: { primary: string; secondary: string; accent: string; textOnDark: string }
) {
  const panelX = width * 0.05;
  const panelY = height * 0.58;
  const panelW = width * 0.9;
  const panelH = height * 0.35;

  ctx.fillStyle = 'rgba(9,14,33,0.62)';
  roundRect(ctx, panelX, panelY, panelW, panelH, Math.round(width * 0.025));
  ctx.fill();

  const titleX = panelX + panelW * 0.06;
  let y = panelY + panelH * 0.2;
  y = drawTitleStack(ctx, titleX, y, panelW * 0.88, spec, palette.textOnDark, width);
  if (spec.bullets?.length) {
    y += height * 0.015;
    drawBullets(ctx, titleX, y, panelW * 0.86, spec.bullets, palette.textOnDark, width);
  }

  drawCta(
    ctx,
    panelX + panelW * 0.06,
    panelY + panelH * 0.84,
    panelW * 0.4,
    height * 0.048,
    `${spec.ctaZh || '查看详情'}  ${spec.ctaEn || 'VIEW DETAILS'}`,
    palette
  );
}

function drawGenericLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spec: PosterOverlaySpec,
  palette: { primary: string; secondary: string; accent: string; textOnDark: string }
) {
  drawOverlayPanel(
    ctx,
    width * 0.04,
    height * 0.12,
    width * 0.84,
    height * 0.26,
    Math.round(width * 0.026),
    'rgba(8,13,34,0.68)'
  );

  const x = width * 0.06;
  let y = height * 0.15;
  y = drawTitleStack(ctx, x, y, width * 0.86, spec, palette.textOnDark, width);
  if (spec.bullets?.length) {
    y += height * 0.02;
    drawBullets(ctx, x, y, width * 0.8, spec.bullets, palette.textOnDark, width);
  }
  drawCta(
    ctx,
    width * 0.06,
    height * 0.88,
    width * 0.34,
    height * 0.05,
    `${spec.ctaZh || '立即了解'}  ${spec.ctaEn || 'EXPLORE'}`,
    palette
  );
}

function drawTitleStack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxWidth: number,
  spec: PosterOverlaySpec,
  color: string,
  canvasWidth: number
): number {
  const zhSize = Math.max(24, Math.round(canvasWidth * 0.055));
  const enSize = Math.max(14, Math.round(canvasWidth * 0.024));

  ctx.fillStyle = color;
  ctx.font = `700 ${zhSize}px ${ZH_FONT_FAMILY}`;
  const zhLines = wrapText(ctx, spec.titleZh, maxWidth, 2);
  zhLines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * zhSize * 1.18);
  });
  y += zhLines.length * zhSize * 1.18 + zhSize * 0.24;

  ctx.fillStyle = 'rgba(226,232,255,0.95)';
  ctx.font = `600 ${enSize}px ${EN_FONT_FAMILY}`;
  const enLines = wrapText(ctx, spec.titleEn, maxWidth, 2);
  enLines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * enSize * 1.34);
  });
  y += enLines.length * enSize * 1.34;

  if (spec.subtitleZh || spec.subtitleEn) {
    const subZh = spec.subtitleZh || '';
    const subEn = spec.subtitleEn || '';
    const subSizeZh = Math.max(14, Math.round(canvasWidth * 0.026));
    const subSizeEn = Math.max(12, Math.round(canvasWidth * 0.02));
    y += subSizeZh * 0.52;

    if (subZh) {
      ctx.fillStyle = 'rgba(230,236,255,0.93)';
      ctx.font = `500 ${subSizeZh}px ${ZH_FONT_FAMILY}`;
      const lines = wrapText(ctx, subZh, maxWidth, 2);
      lines.forEach((line, idx) => ctx.fillText(line, x, y + idx * subSizeZh * 1.28));
      y += lines.length * subSizeZh * 1.28;
    }

    if (subEn) {
      ctx.fillStyle = 'rgba(188,199,236,0.95)';
      ctx.font = `500 ${subSizeEn}px ${EN_FONT_FAMILY}`;
      const lines = wrapText(ctx, subEn, maxWidth, 2);
      lines.forEach((line, idx) => ctx.fillText(line, x, y + idx * subSizeEn * 1.32));
      y += lines.length * subSizeEn * 1.32;
    }
  }

  return y;
}

function drawBullets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxWidth: number,
  bullets: Array<{ zh: string; en: string }>,
  color: string,
  canvasWidth: number
): number {
  const lineGap = Math.max(10, Math.round(canvasWidth * 0.012));
  const zhSize = Math.max(12, Math.round(canvasWidth * 0.021));
  const enSize = Math.max(10, Math.round(canvasWidth * 0.017));
  const limitedBullets = bullets.slice(0, 3);

  for (const item of limitedBullets) {
    ctx.fillStyle = color;
    ctx.font = `600 ${zhSize}px ${ZH_FONT_FAMILY}`;
    const zhText = `• ${item.zh}`;
    const zhLines = wrapText(ctx, zhText, maxWidth, 2);
    zhLines.forEach((line, idx) => ctx.fillText(line, x, y + idx * zhSize * 1.24));
    y += zhLines.length * zhSize * 1.24;

    ctx.fillStyle = 'rgba(183,196,236,0.95)';
    ctx.font = `500 ${enSize}px ${EN_FONT_FAMILY}`;
    const enLines = wrapText(ctx, `  ${item.en}`, maxWidth, 2);
    enLines.forEach((line, idx) => ctx.fillText(line, x, y + idx * enSize * 1.28));
    y += enLines.length * enSize * 1.28 + lineGap;
  }

  return y;
}

function drawCta(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  palette: { primary: string; secondary: string; accent: string; textOnDark: string }
) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, palette.primary);
  gradient.addColorStop(1, palette.accent || palette.secondary);
  ctx.fillStyle = gradient;
  roundRect(ctx, x, y - height, width, height, Math.round(height / 2));
  ctx.fill();

  ctx.fillStyle = palette.textOnDark;
  ctx.font = `600 ${Math.max(12, Math.round(width * 0.08))}px ${ZH_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y - height / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  if (!text) return [];
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

function drawOverlayPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string
) {
  ctx.fillStyle = fillColor;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
}

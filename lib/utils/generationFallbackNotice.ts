export const FLASH_FALLBACK_NOTICE =
  '已自动切换到 Flash 模型继续生成。生图质量不会受影响，但文字排版效果可能低于预期。';
export const HIGH_DEMAND_NOTICE =
  '当前生图模型服务高峰，系统会自动重试；若持续失败，请 30-60 秒后重试。';

export function getGenerationNotices(
  posters: Array<{
    usedFlashFallback?: boolean;
    highDemandStatus?: 'retrying' | 'failed';
  }>
): string[] {
  const notices: string[] = [];

  if (posters.some((poster) => poster.usedFlashFallback)) {
    notices.push(FLASH_FALLBACK_NOTICE);
  }

  if (posters.some((poster) => poster.highDemandStatus === 'retrying' || poster.highDemandStatus === 'failed')) {
    notices.push(HIGH_DEMAND_NOTICE);
  }

  return notices;
}

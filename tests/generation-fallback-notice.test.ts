import test from 'node:test';
import assert from 'node:assert/strict';

const noticeModulePath = new URL(
  '../lib/utils/generationFallbackNotice.ts',
  import.meta.url
).href;
const {
  FLASH_FALLBACK_NOTICE,
  HIGH_DEMAND_NOTICE,
  getGenerationNotices,
} = await import(noticeModulePath);

test('returns the fallback notice when any poster used flash fallback', () => {
  const notices = getGenerationNotices([
    { usedFlashFallback: false },
    { usedFlashFallback: true },
  ]);

  assert.deepEqual(notices, [FLASH_FALLBACK_NOTICE]);
});

test('returns the high demand notice when any poster is retrying due to capacity', () => {
  const notices = getGenerationNotices([
    { highDemandStatus: 'retrying' },
  ]);

  assert.deepEqual(notices, [HIGH_DEMAND_NOTICE]);
});

test('returns both notices without duplication when both states exist', () => {
  const notices = getGenerationNotices([
    { usedFlashFallback: true, highDemandStatus: 'retrying' },
    { highDemandStatus: 'failed' },
  ]);

  assert.deepEqual(notices, [FLASH_FALLBACK_NOTICE, HIGH_DEMAND_NOTICE]);
});

test('returns an empty list when no notices apply', () => {
  const notices = getGenerationNotices([
    { usedFlashFallback: false },
    {},
  ]);

  assert.deepEqual(notices, []);
});

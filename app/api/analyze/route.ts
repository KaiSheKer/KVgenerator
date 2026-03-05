import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduct } from '@/lib/api/gemini';
import { normalizeApiError } from '@/lib/api/apiError';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageBase64 = body?.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageBase64' },
        { status: 400 }
      );
    }

    const result = await analyzeProduct(imageBase64);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/analyze] failed', error);
    const normalized = normalizeApiError(error, 'Analyze API failed');
    return NextResponse.json(
      {
        error: normalized.message,
        retryable: normalized.retryable,
        retryAfterMs: normalized.retryAfterMs,
      },
      {
        status: normalized.status,
        headers:
          typeof normalized.retryAfterMs === 'number'
            ? { 'Retry-After': String(Math.ceil(normalized.retryAfterMs / 1000)) }
            : undefined,
      }
    );
  }
}

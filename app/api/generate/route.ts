import { NextRequest, NextResponse } from 'next/server';
import { generatePoster } from '@/lib/api/nanobanana';
import { normalizeApiError } from '@/lib/api/apiError';

export const runtime = 'nodejs';

interface GenerationRequest {
  prompt: string;
  negative?: string;
  width?: number;
  height?: number;
  referenceImage?: string;
  enforceNoText?: boolean;
  enforceHardConstraints?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerationRequest;

    if (!body?.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' },
        { status: 400 }
      );
    }

    const result = await generatePoster({
      prompt: body.prompt,
      negative: body.negative,
      width: body.width,
      height: body.height,
      referenceImage: body.referenceImage,
      enforceNoText: body.enforceNoText,
      enforceHardConstraints: body.enforceHardConstraints,
    });

    return NextResponse.json({
      dataUrl: result.dataUrl,
      usedFlashFallback: result.fallbackUsed,
      usedImageModel: result.usedModel,
    });
  } catch (error) {
    const normalized = normalizeApiError(error, 'Generate API failed');
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

import { NextRequest, NextResponse } from 'next/server';
import { generatePoster } from '@/lib/api/nanobanana';

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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Generate API failed',
      },
      { status: 500 }
    );
  }
}

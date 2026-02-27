import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduct } from '@/lib/api/gemini';

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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analyze API failed',
      },
      { status: 500 }
    );
  }
}

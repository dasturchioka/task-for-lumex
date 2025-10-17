// POST /api/ai/improve - Improve text using AI
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit, trackAIUsage } from '@/lib/rate-limit';
import { improveText } from '@/lib/gemini';
import { improveTextRequestSchema } from '@/lib/schemas';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check rate limit
    const rateLimitInfo = await checkRateLimit(user.id);
    if (!rateLimitInfo.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          remaining: 0,
          resetAt: rateLimitInfo.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { text, fieldName } = improveTextRequestSchema.parse(body);

    // Improve text using Gemini
    const { improvedText, tokensUsed } = await improveText(text, fieldName);

    // Track AI usage
    await trackAIUsage(user.id, 'improve', tokensUsed, true);

    return NextResponse.json({
      improved: improvedText,
      tokensUsed,
      remaining: rateLimitInfo.remaining - 1,
    });
  } catch (error) {
    console.error('Improve text error:', error);

    // Track failed usage
    try {
      const user = await requireAuth();
      await trackAIUsage(user.id, 'improve', 0, false, error instanceof Error ? error.message : 'Unknown error');
    } catch {
      // Ignore tracking errors
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to improve text' },
      { status: 500 }
    );
  }
}


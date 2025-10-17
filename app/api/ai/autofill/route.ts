// POST /api/ai/autofill - Extract data from resume
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit, trackAIUsage } from '@/lib/rate-limit';
import { extractResumeData } from '@/lib/gemini';
import { autofillRequestSchema } from '@/lib/schemas';
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
    const { resumeText } = autofillRequestSchema.parse(body);

    // Extract resume data using Gemini
    const { data, tokensUsed } = await extractResumeData(resumeText);

    // Track AI usage
    await trackAIUsage(user.id, 'autofill', tokensUsed, true);

    return NextResponse.json({
      extracted: data,
      tokensUsed,
      remaining: rateLimitInfo.remaining - 1,
    });
  } catch (error) {
    console.error('Autofill error:', error);

    // Track failed usage
    try {
      const user = await requireAuth();
      await trackAIUsage(user.id, 'autofill', 0, false, error instanceof Error ? error.message : 'Unknown error');
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
      { error: error instanceof Error ? error.message : 'Failed to extract resume data' },
      { status: 500 }
    );
  }
}


// GET /api/ai/usage - Get AI usage stats
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit, getAIUsageStats } from '@/lib/rate-limit';

export async function GET() {
  try {
    const user = await requireAuth();

    // Get rate limit info
    const rateLimitInfo = await checkRateLimit(user.id);

    // Get usage stats
    const stats = await getAIUsageStats(user.id);

    return NextResponse.json({
      remaining: rateLimitInfo.remaining,
      resetAt: rateLimitInfo.resetAt.toISOString(),
      totalUsed: rateLimitInfo.totalUsed,
      stats,
    });
  } catch (error) {
    console.error('Get AI usage error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch AI usage' },
      { status: 500 }
    );
  }
}


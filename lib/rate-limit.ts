// Rate limiting utilities for AI features
import { getSupabaseAdmin } from './supabase';
import type { RateLimitInfo } from './types';

const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 10;

// Check if user has exceeded rate limit
export async function checkRateLimit(userId: string): Promise<RateLimitInfo> {
  const supabase = getSupabaseAdmin();
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  // Count requests in the current window
  const { count, error } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    throw new Error(`Failed to check rate limit: ${error.message}`);
  }

  const totalUsed = count || 0;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - totalUsed);
  const allowed = totalUsed < MAX_REQUESTS_PER_WINDOW;

  // Get the oldest request in the window to calculate reset time
  const { data: oldestRequest } = await supabase
    .from('ai_usage')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', windowStart.toISOString())
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  const resetAt = oldestRequest
    ? new Date(new Date(oldestRequest.created_at).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000)
    : new Date(Date.now() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  return {
    allowed,
    remaining,
    resetAt,
    totalUsed,
  };
}

// Track AI usage
export async function trackAIUsage(
  userId: string,
  featureType: 'autofill' | 'improve' | 'expand' | 'validate',
  tokensUsed: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('ai_usage').insert({
    user_id: userId,
    feature_type: featureType,
    request_tokens: 0, // Could be calculated if needed
    response_tokens: tokensUsed,
    total_tokens: tokensUsed,
    success,
    error_message: errorMessage,
  });

  if (error) {
    console.error('Failed to track AI usage:', error);
    // Don't throw - tracking failure shouldn't block the request
  }
}

// Get user's AI usage statistics
export async function getAIUsageStats(userId: string): Promise<{
  totalRequests: number;
  totalTokens: number;
  successRate: number;
  recentRequests: number;
}> {
  const supabase = getSupabaseAdmin();
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  // Get all-time stats
  const { data: allTimeStats } = await supabase
    .from('ai_usage')
    .select('total_tokens, success')
    .eq('user_id', userId);

  // Get recent requests
  const { count: recentCount } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart.toISOString());

  const totalRequests = allTimeStats?.length || 0;
  const totalTokens = allTimeStats?.reduce((sum, record) => sum + record.total_tokens, 0) || 0;
  const successfulRequests = allTimeStats?.filter((record) => record.success).length || 0;
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

  return {
    totalRequests,
    totalTokens,
    successRate,
    recentRequests: recentCount || 0,
  };
}


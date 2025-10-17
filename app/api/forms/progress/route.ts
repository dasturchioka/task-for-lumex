// GET /api/forms/progress - Get user's form progress
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('form_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch progress: ${error.message}`);
    }

    if (!data) {
      return NextResponse.json({
        hasProgress: false,
      });
    }

    return NextResponse.json({
      hasProgress: true,
      data: data.form_data,
      currentStep: data.current_step,
    });
  } catch (error) {
    console.error('Get progress error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}


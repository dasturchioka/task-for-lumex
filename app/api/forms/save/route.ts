// POST /api/forms/save - Save form progress
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { partialFormSchema } from '@/lib/schemas';
import { z } from 'zod';

const saveRequestSchema = z.object({
  formData: partialFormSchema,
  currentStep: z.number().min(1).max(5),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { formData, currentStep } = saveRequestSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // Upsert form progress
    const { data, error } = await supabase
      .from('form_progress')
      .upsert({
        user_id: user.id,
        form_data: formData,
        current_step: currentStep,
        last_saved_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save progress: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      savedAt: data.last_saved_at,
    });
  } catch (error) {
    console.error('Save progress error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}


// POST /api/forms/submit - Submit complete form
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { completeFormSchema } from '@/lib/schemas';
import { z } from 'zod';

const submitRequestSchema = z.object({
  formData: completeFormSchema,
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { formData } = submitRequestSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // Insert form submission
    const { data: submission, error: submitError } = await supabase
      .from('form_submissions')
      .insert({
        user_id: user.id,
        form_data: formData,
      })
      .select()
      .single();

    if (submitError) {
      throw new Error(`Failed to submit form: ${submitError.message}`);
    }

    // Delete form progress
    await supabase
      .from('form_progress')
      .delete()
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error('Submit form error:', error);

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
      { error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}


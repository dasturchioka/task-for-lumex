// POST /api/auth/start - Create magic link
import { NextRequest, NextResponse } from 'next/server';
import { emailSchema } from '@/lib/schemas';
import { createMagicLinkToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = emailSchema.parse(body);

    // Create magic link token
    const token = await createMagicLinkToken(email);

    // Generate magic link URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${appUrl}/auth/verify?token=${token}`;

    return NextResponse.json({
      success: true,
      magicLink,
    });
  } catch (error) {
    console.error('Magic link creation error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create magic link' },
      { status: 500 }
    );
  }
}


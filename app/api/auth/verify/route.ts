// POST /api/auth/verify - Verify magic link and create session
import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenSchema } from '@/lib/schemas';
import { verifyMagicLinkToken, getOrCreateUser, createSession, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = verifyTokenSchema.parse(body);

    // Verify the magic link token
    const email = await verifyMagicLinkToken(token);

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const user = await getOrCreateUser(email);

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const sessionToken = await createSession(user.id, ipAddress, userAgent);

    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      redirectUrl: '/form',
    });
  } catch (error) {
    console.error('Verification error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}


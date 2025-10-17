// Authentication utilities
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from './supabase';
import { randomBytes, createHash } from 'crypto';
import type { User, Session } from './types';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_EXPIRY_DAYS = 7;
const MAGIC_LINK_EXPIRY_MINUTES = 15;

// Hash a token for secure storage
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Generate a secure random token
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Create a magic link token
export async function createMagicLinkToken(email: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  const { error } = await supabase.from('magic_link_tokens').insert({
    email,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create magic link token: ${error.message}`);
  }

  return token;
}

// Verify a magic link token and return the email
export async function verifyMagicLinkToken(token: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('magic_link_tokens')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  // Mark token as used
  await supabase
    .from('magic_link_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);

  return data.email;
}

// Get or create user by email
export async function getOrCreateUser(email: string): Promise<User> {
  const supabase = getSupabaseAdmin();

  // Try to get existing user
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser && !selectError) {
    return existingUser;
  }

  // Create new user
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({ email })
    .select()
    .single();

  if (insertError || !newUser) {
    throw new Error(`Failed to create user: ${insertError?.message}`);
  }

  return newUser;
}

// Create a session for a user
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from('sessions').insert({
    user_id: userId,
    token: hashedToken,
    expires_at: expiresAt.toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return token;
}

// Validate a session token and return the user
export async function validateSession(token: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const hashedToken = hashToken(token);

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*, users(*)')
    .eq('token', hashedToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session) {
    return null;
  }

  // Update last activity
  await supabase
    .from('sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('token', hashedToken);

  return session.users as User;
}

// Delete a session (logout)
export async function deleteSession(token: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const hashedToken = hashToken(token);

  await supabase.from('sessions').delete().eq('token', hashedToken);
}

// Get the current user from the session cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return validateSession(token);
}

// Set session cookie
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/',
  });
}

// Clear session cookie
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Middleware helper to require authentication
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}


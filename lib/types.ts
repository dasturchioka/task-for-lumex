// TypeScript type definitions for the application

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  last_activity: string;
  ip_address?: string;
  user_agent?: string;
}

export interface MagicLinkToken {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface FormData {
  // Step 1: Personal Information
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;

  // Step 2: Work Experience
  currentPosition?: string;
  company?: string;
  yearsExperience?: number;
  keyAchievements?: string;

  // Step 3: Technical Skills
  primarySkills?: string;
  programmingLanguages?: string;
  frameworks?: string;

  // Step 4: Motivation
  whyInterested?: string;
  startDate?: string;
  expectedSalary?: string;
}

export interface FormProgress {
  id: string;
  user_id: string;
  form_data: FormData;
  current_step: number;
  last_saved_at: string;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  user_id: string;
  form_data: FormData;
  submitted_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  feature_type: 'autofill' | 'improve' | 'expand' | 'validate';
  request_tokens: number;
  response_tokens: number;
  total_tokens: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  totalUsed: number;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  magicLink?: string;
  redirectUrl?: string;
}

export interface SessionInfo {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
  };
}

export interface ExtractedResumeData {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  currentPosition: string | null;
  company: string | null;
  yearsExperience: number | null;
  keyAchievements: string | null;
  primarySkills: string | null;
  programmingLanguages: string | null;
  frameworks: string | null;
}


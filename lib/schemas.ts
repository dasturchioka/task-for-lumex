// Zod validation schemas for the application
import { z } from 'zod';

// Step 1: Personal Information
export const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').max(20),
  location: z.string().min(2, 'Location must be at least 2 characters').max(100),
});

// Step 2: Work Experience
export const step2Schema = z.object({
  currentPosition: z.string().min(2, 'Position must be at least 2 characters').max(100),
  company: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  yearsExperience: z.number().min(0, 'Years must be positive').max(50, 'Years must be reasonable'),
  keyAchievements: z.string().min(10, 'Please describe your achievements (at least 10 characters)').max(2000),
});

// Step 3: Technical Skills
export const step3Schema = z.object({
  primarySkills: z.string().min(10, 'Please describe your skills (at least 10 characters)').max(1000),
  programmingLanguages: z.string().min(2, 'Please list at least one programming language').max(500),
  frameworks: z.string().min(2, 'Please list at least one framework').max(500),
});

// Step 4: Motivation
export const step4Schema = z.object({
  whyInterested: z.string().min(20, 'Please explain your interest (at least 20 characters)').max(2000),
  startDate: z.string().min(1, 'Start date is required'),
  expectedSalary: z.string().optional(),
});

// Complete form schema
export const completeFormSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
});

// Partial form schema for progress saves
export const partialFormSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  currentPosition: z.string().optional(),
  company: z.string().optional(),
  yearsExperience: z.number().optional(),
  keyAchievements: z.string().optional(),
  primarySkills: z.string().optional(),
  programmingLanguages: z.string().optional(),
  frameworks: z.string().optional(),
  whyInterested: z.string().optional(),
  startDate: z.string().optional(),
  expectedSalary: z.string().optional(),
});

// Auth schemas
export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyTokenSchema = z.object({
  token: z.string().length(64, 'Invalid token format').regex(/^[a-f0-9]+$/, 'Invalid token format'),
});

// AI request schemas
export const autofillRequestSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters').max(50000),
});

export const improveTextRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000),
  fieldName: z.string().min(1, 'Field name is required'),
});

// Extracted resume data schema
export const extractedResumeSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  currentPosition: z.string().nullable(),
  company: z.string().nullable(),
  yearsExperience: z.number().nullable(),
  keyAchievements: z.string().nullable(),
  primarySkills: z.string().nullable(),
  programmingLanguages: z.string().nullable(),
  frameworks: z.string().nullable(),
});

// Helper function to get schema for a specific step
export function getStepSchema(step: number): z.ZodObject<any> {
  switch (step) {
    case 1:
      return step1Schema;
    case 2:
      return step2Schema;
    case 3:
      return step3Schema;
    case 4:
      return step4Schema;
    default:
      throw new Error(`Invalid step number: ${step}`);
  }
}

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type CompleteFormData = z.infer<typeof completeFormSchema>;
export type PartialFormData = z.infer<typeof partialFormSchema>;
export type ExtractedResumeData = z.infer<typeof extractedResumeSchema>;


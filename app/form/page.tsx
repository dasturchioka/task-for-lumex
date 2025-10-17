'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStore, useAuthStore } from '@/lib/store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Step1PersonalInfo } from '@/components/forms/Step1PersonalInfo';
import { Step2WorkExperience } from '@/components/forms/Step2WorkExperience';
import { Step3TechnicalSkills } from '@/components/forms/Step3TechnicalSkills';
import { Step4Motivation } from '@/components/forms/Step4Motivation';
import { Step5Review } from '@/components/forms/Step5Review';
import { completeFormSchema } from '@/lib/schemas';

export default function FormPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    currentStep,
    formData,
    isSaving,
    lastSavedAt,
    setCurrentStep,
    updateFormData,
    setFormData,
    setIsSaving,
    setLastSavedAt,
    resetForm,
  } = useFormStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load saved progress on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const response = await fetch('/api/forms/progress');
        const data = await response.json();

        if (data.hasProgress) {
          setFormData(data.data);
          setCurrentStep(data.currentStep);
        }
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgress();
  }, [setFormData, setCurrentStep]);

  // Save progress
  const saveProgress = async (step: number) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/forms/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          currentStep: step,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLastSavedAt(data.savedAt);
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle step navigation
  const handleNext = async (stepData: any) => {
    updateFormData(stepData);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    await saveProgress(nextStep);
  };

  const handleBack = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    try {
      const validatedData = completeFormSchema.parse(formData);

      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: validatedData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      resetForm();
      router.push('/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading form...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Job Application Form</h1>
                <p className="text-gray-600 mt-1">
                  Logged in as {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                Logout
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep} of 5
                </span>
                {lastSavedAt && (
                  <span className="text-sm text-gray-500">
                    Last saved: {new Date(lastSavedAt).toLocaleTimeString()}
                  </span>
                )}
                {isSaving && (
                  <span className="text-sm text-blue-600">Saving...</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Step indicators */}
            <div className="mt-4 flex justify-between">
              {['Personal', 'Experience', 'Skills', 'Motivation', 'Review'].map(
                (label, index) => (
                  <div
                    key={label}
                    className={`flex-1 text-center ${
                      index + 1 === currentStep
                        ? 'text-blue-600 font-semibold'
                        : index + 1 < currentStep
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div className="text-xs">{label}</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Form content */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {currentStep === 1 && (
              <Step1PersonalInfo
                initialData={formData}
                onNext={handleNext}
              />
            )}

            {currentStep === 2 && (
              <Step2WorkExperience
                initialData={formData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 3 && (
              <Step3TechnicalSkills
                initialData={formData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 4 && (
              <Step4Motivation
                initialData={formData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 5 && (
              <Step5Review
                formData={formData as any}
                onBack={handleBack}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


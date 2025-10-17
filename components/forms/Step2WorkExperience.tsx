'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step2Schema, Step2Data } from '@/lib/schemas';
import { AITextImprover } from '../AITextImprover';
import { useState } from 'react';

interface Step2Props {
  initialData: Partial<Step2Data>;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

export function Step2WorkExperience({ initialData, onNext, onBack }: Step2Props) {
  const [_, setAchievements] = useState(initialData.keyAchievements || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: initialData,
  });

  const watchAchievements = watch('keyAchievements');

  const handleImproveAchievements = (improved: string) => {
    setValue('keyAchievements', improved);
    setAchievements(improved);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
        <p className="text-gray-600 mt-1">Tell us about your professional background</p>
      </div>

      <div>
        <label htmlFor="currentPosition" className="block text-sm font-medium text-gray-700 mb-2">
          Current Position *
        </label>
        <input
          type="text"
          id="currentPosition"
          {...register('currentPosition')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Senior Software Engineer"
        />
        {errors.currentPosition && (
          <p className="mt-1 text-sm text-red-600">{errors.currentPosition.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
          Company *
        </label>
        <input
          type="text"
          id="company"
          {...register('company')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tech Corp"
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience *
        </label>
        <input
          type="number"
          id="yearsExperience"
          {...register('yearsExperience', { valueAsNumber: true })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="5"
          min="0"
          step="0.5"
        />
        {errors.yearsExperience && (
          <p className="mt-1 text-sm text-red-600">{errors.yearsExperience.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="keyAchievements" className="block text-sm font-medium text-gray-700 mb-2">
          Key Achievements *
        </label>
        <textarea
          id="keyAchievements"
          {...register('keyAchievements', {
            onChange: (e) => {
              setAchievements(e.target.value);
            },
          })}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Describe your key achievements and accomplishments..."
        />
        {errors.keyAchievements && (
          <p className="mt-1 text-sm text-red-600">{errors.keyAchievements.message}</p>
        )}
        <div className="mt-2">
          <AITextImprover
            text={watchAchievements || ''}
            fieldName="Key Achievements"
            onImprove={handleImproveAchievements}
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Next
        </button>
      </div>
    </form>
  );
}


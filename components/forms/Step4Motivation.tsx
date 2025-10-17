'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step4Schema, Step4Data } from '@/lib/schemas';
import { AITextImprover } from '../AITextImprover';
import { useState } from 'react';

interface Step4Props {
  initialData: Partial<Step4Data>;
  onNext: (data: Step4Data) => void;
  onBack: () => void;
}

export function Step4Motivation({ initialData, onNext, onBack }: Step4Props) {
  const [_, setWhyInterested] = useState(initialData.whyInterested || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: initialData,
  });

  const watchWhyInterested = watch('whyInterested');

  const handleImproveWhyInterested = (improved: string) => {
    setValue('whyInterested', improved);
    setWhyInterested(improved);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Motivation & Availability</h2>
        <p className="text-gray-600 mt-1">Tell us why you're interested and when you can start</p>
      </div>

      <div>
        <label htmlFor="whyInterested" className="block text-sm font-medium text-gray-700 mb-2">
          Why are you interested in this position? *
        </label>
        <textarea
          id="whyInterested"
          {...register('whyInterested', {
            onChange: (e) => {
              setWhyInterested(e.target.value);
            },
          })}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Explain your motivation and interest in this opportunity..."
        />
        {errors.whyInterested && (
          <p className="mt-1 text-sm text-red-600">{errors.whyInterested.message}</p>
        )}
        <div className="mt-2">
          <AITextImprover
            text={watchWhyInterested || ''}
            fieldName="Why Interested"
            onImprove={handleImproveWhyInterested}
          />
        </div>
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Start Date *
        </label>
        <input
          type="date"
          id="startDate"
          {...register('startDate')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.startDate && (
          <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="expectedSalary" className="block text-sm font-medium text-gray-700 mb-2">
          Expected Salary (Optional)
        </label>
        <input
          type="text"
          id="expectedSalary"
          {...register('expectedSalary')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="$80,000 - $100,000"
        />
        {errors.expectedSalary && (
          <p className="mt-1 text-sm text-red-600">{errors.expectedSalary.message}</p>
        )}
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
          Review
        </button>
      </div>
    </form>
  );
}


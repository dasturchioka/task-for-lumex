'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step3Schema, Step3Data } from '@/lib/schemas';
import { AITextImprover } from '../AITextImprover';
import { useState } from 'react';

interface Step3Props {
  initialData: Partial<Step3Data>;
  onNext: (data: Step3Data) => void;
  onBack: () => void;
}

export function Step3TechnicalSkills({ initialData, onNext, onBack }: Step3Props) {
  const [_, setPrimarySkills] = useState(initialData.primarySkills || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: initialData,
  });

  const watchPrimarySkills = watch('primarySkills');

  const handleImprovePrimarySkills = (improved: string) => {
    setValue('primarySkills', improved);
    setPrimarySkills(improved);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Technical Skills</h2>
        <p className="text-gray-600 mt-1">Showcase your technical expertise</p>
      </div>

      <div>
        <label htmlFor="primarySkills" className="block text-sm font-medium text-gray-700 mb-2">
          Primary Skills *
        </label>
        <textarea
          id="primarySkills"
          {...register('primarySkills', {
            onChange: (e) => {
              setPrimarySkills(e.target.value);
            },
          })}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Describe your main technical skills and areas of expertise..."
        />
        {errors.primarySkills && (
          <p className="mt-1 text-sm text-red-600">{errors.primarySkills.message}</p>
        )}
        <div className="mt-2">
          <AITextImprover
            text={watchPrimarySkills || ''}
            fieldName="Primary Skills"
            onImprove={handleImprovePrimarySkills}
          />
        </div>
      </div>

      <div>
        <label htmlFor="programmingLanguages" className="block text-sm font-medium text-gray-700 mb-2">
          Programming Languages *
        </label>
        <input
          type="text"
          id="programmingLanguages"
          {...register('programmingLanguages')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="JavaScript, Python, Java, etc."
        />
        {errors.programmingLanguages && (
          <p className="mt-1 text-sm text-red-600">{errors.programmingLanguages.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="frameworks" className="block text-sm font-medium text-gray-700 mb-2">
          Frameworks & Technologies *
        </label>
        <input
          type="text"
          id="frameworks"
          {...register('frameworks')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="React, Node.js, Django, etc."
        />
        {errors.frameworks && (
          <p className="mt-1 text-sm text-red-600">{errors.frameworks.message}</p>
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
          Next
        </button>
      </div>
    </form>
  );
}


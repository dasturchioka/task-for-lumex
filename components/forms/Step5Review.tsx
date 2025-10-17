'use client';

import { CompleteFormData } from '@/lib/schemas';

interface Step5Props {
  formData: CompleteFormData;
  onBack: () => void;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function Step5Review({ formData, onBack, onEdit, onSubmit, isSubmitting }: Step5Props) {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review Your Application</h2>
        <p className="text-gray-600 mt-1">Please review all information before submitting</p>
      </div>

      {/* Personal Information */}
      <Section
        title="Personal Information"
        onEdit={() => onEdit(1)}
        fields={[
          { label: 'Full Name', value: formData.fullName },
          { label: 'Email', value: formData.email },
          { label: 'Phone', value: formData.phone },
          { label: 'Location', value: formData.location },
        ]}
      />

      {/* Work Experience */}
      <Section
        title="Work Experience"
        onEdit={() => onEdit(2)}
        fields={[
          { label: 'Current Position', value: formData.currentPosition },
          { label: 'Company', value: formData.company },
          { label: 'Years of Experience', value: formData.yearsExperience.toString() },
          { label: 'Key Achievements', value: formData.keyAchievements, multiline: true },
        ]}
      />

      {/* Technical Skills */}
      <Section
        title="Technical Skills"
        onEdit={() => onEdit(3)}
        fields={[
          { label: 'Primary Skills', value: formData.primarySkills, multiline: true },
          { label: 'Programming Languages', value: formData.programmingLanguages },
          { label: 'Frameworks & Technologies', value: formData.frameworks },
        ]}
      />

      {/* Motivation */}
      <Section
        title="Motivation & Availability"
        onEdit={() => onEdit(4)}
        fields={[
          { label: 'Why Interested', value: formData.whyInterested, multiline: true },
          { label: 'Start Date', value: formData.startDate },
          { label: 'Expected Salary', value: formData.expectedSalary || 'Not specified' },
        ]}
      />

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  onEdit: () => void;
  fields: Array<{ label: string; value: string; multiline?: boolean }>;
}

function Section({ title, onEdit, fields }: SectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Edit
        </button>
      </div>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-xs font-medium text-gray-500 mb-1">{field.label}</p>
            <p className={`text-gray-900 ${field.multiline ? 'whitespace-pre-wrap' : ''}`}>
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}


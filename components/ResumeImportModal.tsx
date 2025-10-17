'use client';

import { useState } from 'react';
import { ExtractedResumeData } from '@/lib/types';

interface ResumeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ExtractedResumeData) => void;
}

export function ResumeImportModal({
  isOpen,
  onClose,
  onImport,
}: ResumeImportModalProps) {
  const [resumeText, setResumeText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedResumeData | null>(null);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);

  const handleExtract = async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume text');
      return;
    }

    setError('');
    setIsExtracting(true);

    try {
      const response = await fetch('/api/ai/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Try again after ${new Date(data.resetAt).toLocaleTimeString()}`);
        }
        throw new Error(data.error || 'Failed to extract resume data');
      }

      setExtractedData(data.extracted);
      setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAccept = () => {
    if (extractedData) {
      onImport(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setResumeText('');
    setExtractedData(null);
    setError('');
    setRemaining(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Import from Resume
            </h2>
            {remaining !== null && (
              <p className="text-sm text-gray-500 mt-1">
                {remaining} AI requests remaining
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {!extractedData ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Your Resume Text
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Paste your resume content here..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleExtract}
                  disabled={isExtracting || !resumeText.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? 'Extracting...' : 'Extract Information'}
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                <p className="font-medium">Extraction successful!</p>
                <p className="text-sm mt-1">
                  Review the extracted data below and click "Accept" to populate the form.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DataField label="Full Name" value={extractedData.fullName} />
                <DataField label="Email" value={extractedData.email} />
                <DataField label="Phone" value={extractedData.phone} />
                <DataField label="Location" value={extractedData.location} />
                <DataField label="Current Position" value={extractedData.currentPosition} />
                <DataField label="Company" value={extractedData.company} />
                <DataField label="Years Experience" value={extractedData.yearsExperience?.toString()} />
                <DataField
                  label="Primary Skills"
                  value={extractedData.primarySkills}
                  fullWidth
                />
                <DataField
                  label="Programming Languages"
                  value={extractedData.programmingLanguages}
                  fullWidth
                />
                <DataField
                  label="Frameworks"
                  value={extractedData.frameworks}
                  fullWidth
                />
                <DataField
                  label="Key Achievements"
                  value={extractedData.keyAchievements}
                  fullWidth
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Accept & Fill Form
                </button>
                <button
                  onClick={() => setExtractedData(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataField({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 min-h-[40px]">
        {value ? (
          <p className="text-sm text-gray-900">{value}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Not found</p>
        )}
      </div>
    </div>
  );
}


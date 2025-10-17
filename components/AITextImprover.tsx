'use client';

import { useState } from 'react';

interface AITextImproverProps {
  text: string;
  fieldName: string;
  onImprove: (improvedText: string) => void;
}

export function AITextImprover({ text, fieldName, onImprove }: AITextImproverProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState('');

  const handleImprove = async () => {
    if (!text.trim()) {
      setError('Please enter some text first');
      return;
    }

    setError('');
    setIsImproving(true);

    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fieldName }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Try again after ${new Date(data.resetAt).toLocaleTimeString()}`);
        }
        throw new Error(data.error || 'Failed to improve text');
      }

      onImprove(data.improved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Improvement failed');
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleImprove}
        disabled={isImproving}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className={`w-4 h-4 ${isImproving ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        {isImproving ? 'Improving...' : 'Improve with AI'}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}


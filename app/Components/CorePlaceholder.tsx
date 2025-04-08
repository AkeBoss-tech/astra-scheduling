"use client";
import React from 'react';
import { CoreCode, CORE_CODES } from '@/app/services/api';

interface CorePlaceholderProps {
  coreCode: CoreCode;
  onRemove: () => void;
}

export default function CorePlaceholder({ coreCode, onRemove }: CorePlaceholderProps) {
  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">Any {CORE_CODES[coreCode]} Course</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Core Requirement: {coreCode}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
} 
import React, { useState } from 'react';
import { Label } from '@components/Label';

export const TextInput = ({
  value,
  handleOnChange,
  label,
  id,
  isLoading,
  errors,
  touched = false,
}: {
  value?: string | null;
  handleOnChange: (e: string) => void;
  label: string;
  id: string;
  isLoading?: boolean;
  errors?: string[];
  touched?: boolean;
}) => {
  const [isTouched, setIsTouched] = useState(false);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className='relative'>
        <input
          onChange={(e) => {
            handleOnChange(e.target.value);
            setIsTouched(true);
          }}
          value={value ?? ''}
          id={id}
          onBlur={() => setIsTouched(true)}
        />
        {isLoading && (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 100 100'
            className='animate absolute inset-y-0 right-2 my-auto size-6 animate-spin stroke-[--vscode-foreground]'
          >
            <circle
              cx='50'
              cy='50'
              fill='none'
              strokeWidth='8'
              r='35'
              strokeDasharray='164.93361431346415 56.97787143782138'
            />
          </svg>
        )}
      </div>
      {errors && (isTouched || touched) && (
        <ul className='list-disc'>
          {Array.from(new Set(errors)).map((error) => (
            <li key={error} className='font-semibold text-red-600'>
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

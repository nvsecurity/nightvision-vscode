import React from 'react';
import { Label } from '@components/Label';

export const TextInput = ({
  value,
  handleOnChange,
  label,
  id,
}: {
  value: string;
  handleOnChange: (e: string) => void;
  label: string;
  id: string;
}) => {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        onChange={(e) => handleOnChange(e.target.value)}
        value={value}
        id={id}
      />
    </div>
  );
};

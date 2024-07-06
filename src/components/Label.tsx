import React from 'react';

export const Label = ({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) => {
  return (
    <label className='mb-1 text-sm uppercase' htmlFor={htmlFor}>
      {children}
    </label>
  );
};

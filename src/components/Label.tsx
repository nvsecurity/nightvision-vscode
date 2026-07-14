import React from 'react';

export const Label = ({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) => {
  return (
    <div>
      <label className='mb-1 text-sm uppercase text-[--vscode-descriptionForeground]' htmlFor={htmlFor}>
        {children}
      </label>
    </div>
  );
};

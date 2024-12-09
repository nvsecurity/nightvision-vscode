import React from 'react';

export const LoadingAnimation: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 100'
      className='animate right-2 my-auto size-6 animate-spin stroke-[--vscode-foreground]'
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
  );
};

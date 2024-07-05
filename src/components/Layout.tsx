import React from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return <div className='absolute inset-0 px-6'>{children}</div>;
};

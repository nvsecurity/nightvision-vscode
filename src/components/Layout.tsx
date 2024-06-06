import React from 'react';
import { Outlet } from 'react-router-dom';

// display: flex;
// flex-direction: row;
// align-items: center;
// justify-content: space-between;
// margin: 0 -20px;
// padding: 0 20px;
// background: var(--vscode-sideBar-background);
// position: sticky;
// top: 0;
// z-index: 20;

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='sticky top-0 mb-4 bg-[--vscode-sideBar-background] px-6'>
      {children}
    </div>
  );
};

import React, { RefObject } from 'react';

export const Modal = ({
  componentRef,
  className,
  children,
  visible = true,
}: {
  componentRef?: RefObject<HTMLInputElement>;
  className?: string;
  children: React.ReactNode;
  visible?: boolean;
}) => {
  return (
    <div
      className={`absolute inset-0 z-50 flex items-start justify-center bg-black/75 px-6 ${visible ? 'visible' : 'invisible'}`}
    >
      <div
        ref={componentRef}
        className={`z-50 mt-10 w-full rounded bg-[--vscode-sideBar-background] p-4 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

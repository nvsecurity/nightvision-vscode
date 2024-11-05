import React, { ButtonHTMLAttributes } from 'react';

export const SecondaryButton = (
  props: ButtonHTMLAttributes<HTMLButtonElement>
) => {
  return (
    <button
      className='relative truncate rounded !bg-transparent text-[--vscode-foreground] before:absolute before:inset-0 before:-z-50 before:bg-[--vscode-input-background] before:hover:bg-[--vscode-input-background] before:hover:brightness-75 disabled:cursor-default disabled:before:hover:brightness-100 disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
      {...props}
    >
      {props.children}
    </button>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';

export const ReloadButton = () => {
  return (
    <Link to='/reload' title='Reload page' className='!ml-auto'>
      <svg
        viewBox='0 0 16 16'
        xmlns='http://www.w3.org/2000/svg'
        className='h-5 w-5 fill-[--vscode-foreground]'
      >
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M4.681 3H2V2h3.5l.5.5V6H5V4a5 5 0 1 0 4.53-.761l.302-.954A6 6 0 1 1 4.681 3z'
        />
      </svg>
    </Link>
  );
};

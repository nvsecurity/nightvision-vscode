import React, { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';

export const Dropdown = ({
  items,
  name,
  route,
  handleChange,
}: {
  items: string[];
  name?: string;
  route?: string;
  handleChange: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <div className='flex flex-nowrap items-center space-x-2'>
      <select
        className='w-full bg-[--vscode-settings-dropdownBackground] px-0.5 py-1.5'
        onChange={(e) => handleChange(e.target.value)}
      >
        {items.map((item) => (
          <option key={item} value={item} className=''>
            {item}
          </option>
        ))}
      </select>

      <Link to={route || '/'} title={name ? 'Create new ' + name : ''}>
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='h-5 w-5 hover:cursor-pointer hover:brightness-75'
        >
          <path
            d='M14.0001 7V8H8.00012V14H7.00012V8H1.00012V7H7.00012V1H8.00012V7H14.0001Z'
            fill='#C5C5C5'
          />
        </svg>
      </Link>
    </div>
  );
};

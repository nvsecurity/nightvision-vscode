import React, { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';

export const Dropdown = ({
  defaultItem,
  items,
  name,
  route,
  handleChange,
  id,
}: {
  defaultItem?: string;
  items: string[];
  name?: string;
  route?: string;
  handleChange: Dispatch<SetStateAction<string>>;
  id?: string;
}) => {
  return (
    <div className='flex flex-nowrap items-center space-x-2'>
      <select
        className='w-full bg-[--vscode-settings-dropdownBackground] px-0.5 py-1.5'
        value={defaultItem}
        onChange={(e) => handleChange(e.target.value)}
        id={id}
      >
        {items.map((item) => (
          <option key={item} value={item} className=''>
            {item}
          </option>
        ))}
      </select>
      {route && (
        <Link to={route} title={name ? 'Create new ' + name : ''}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-6 w-6 hover:cursor-pointer hover:brightness-75'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 4.5v15m7.5-7.5h-15'
            />
          </svg>
        </Link>
      )}
    </div>
  );
};

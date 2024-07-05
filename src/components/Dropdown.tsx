import { IdAndName } from '@contexts/ProjectContext';
import React from 'react';
import { Link } from 'react-router-dom';

export const Dropdown = ({
  defaultItem,
  items,
  name,
  route,
  handleChange,
  id,
  disabled = false,
}: {
  defaultItem?: IdAndName;
  items: IdAndName[];
  name?: string;
  route?: string;
  handleChange: (value: IdAndName) => void;
  id?: string;
  disabled?: boolean;
}) => {
  return (
    <div className='flex flex-nowrap items-center space-x-2'>
      <select
        className='w-full bg-[--vscode-settings-dropdownBackground] px-0.5 py-1.5'
        value={defaultItem?.id}
        onChange={(e) => {
          const item = items.filter((item) => item.id === e.target.value)[0];
          handleChange(item);
        }}
        id={id}
        disabled={disabled}
      >
        {items.map((item) => (
          <option key={item.id} value={item.id} className=''>
            {item.name}
          </option>
        ))}
      </select>
      {route && !disabled && (
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

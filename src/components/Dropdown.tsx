import { IdAndName } from '@types_/idAndName';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Dropdown = ({
  selectedItem,
  items,
  name,
  route,
  handleChange,
  id,
  disabled = false,
  optional = false,
}: {
  selectedItem?: IdAndName | null;
  items: IdAndName[];
  name?: string;
  route?: string;
  handleChange: (value: IdAndName) => void;
  id?: string;
  disabled?: boolean;
  optional?: boolean;
}) => {
  useEffect(() => {
    if (optional) {
      return;
    }

    if (items.length === 0) {
      handleChange({ id: '', name: '' });
    } else if (
      !selectedItem ||
      !items.some((item) => item.id === selectedItem.id)
    ) {
      handleChange(items[0]);
    }
  }, [selectedItem]);

  return (
    <div className='flex flex-nowrap items-center space-x-2'>
      <select
        className='w-full bg-[--vscode-input-background] px-0.5 py-1.5'
        value={selectedItem?.id}
        onChange={(e) => {
          const item = items.filter((item) => item.id === e.target.value)[0];
          handleChange(item);
        }}
        id={id}
        disabled={disabled}
      >
        {(optional || items.length === 0) && <option value=''>-</option>}
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

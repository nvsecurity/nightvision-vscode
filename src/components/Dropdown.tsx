import { IdAndName } from '@types_/idAndName';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

interface DropdownProps<T> {
  selectedItem?: IdAndName | null;
  items: T[];
  name?: string;
  route?: string;
  handleChange: (value: IdAndName) => void;
  id?: string;
  disabled?: boolean;
  optional?: boolean;
  optionalText?: string;
  labelBy?: (item: T) => string;
  loading?: boolean;
}

const LOADING_OPTION = {
  id: '<loading>',
  name: 'Loading...',
};

export const Dropdown = <T extends IdAndName,>({
  selectedItem,
  items,
  name,
  route,
  handleChange,
  id,
  disabled = false,
  optional = false,
  optionalText = '-',
  labelBy = (item: T) => item.name,
  loading = false,
}: DropdownProps<T>) => {
  useEffect(() => {
    if (loading) {
      return;
    }

    const selectionIsListed =
      !!selectedItem && items.some((item) => item.id === selectedItem.id);

    if (optional) {
      // An optional dropdown renders the placeholder whenever the selection is
      // not among the items, so keeping a stale selection in state makes the
      // caller act on a value the user cannot see. Clearing it the way picking
      // the placeholder does keeps the two in step (NV-4827).
      if (selectedItem && !selectionIsListed) {
        // The onChange path below already passes undefined when the placeholder
        // is picked; the prop type does not model that.
        handleChange(undefined as unknown as IdAndName);
      }
      return;
    }

    if (items.length === 0) {
      handleChange({ id: '', name: '' });
    } else if (!selectionIsListed) {
      handleChange(items[0]);
    }
    // `items` matters: switching project replaces the list without changing the
    // selection, which is exactly when a stale selection needs reconciling.
  }, [selectedItem, items, loading]);

  return (
    <div className='flex flex-nowrap items-center space-x-2'>
      <select
        className={`w-full ${optional && !selectedItem ? 'text-[--vscode-input-placeholderForeground]' : ''}`}
        value={loading ? LOADING_OPTION.id : selectedItem?.id}
        onChange={(e) => {
          const item = items.filter((item) => item.id === e.target.value)[0];
          handleChange(item);
        }}
        id={id}
        disabled={disabled || loading}
      >
        {loading ? (
          loading && <option disabled value={LOADING_OPTION.id}>{LOADING_OPTION.name}</option>
        ) : (
          <>
            {(optional || items.length === 0) && <option value=''>{optionalText}</option>}
            {items.map((item) => (
              <option key={item.id} value={item.id} className=''>
                {labelBy(item)}
              </option>
            ))}
          </>
        )}
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

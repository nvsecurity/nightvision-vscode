import { IdAndName } from '@types_/idAndName';
import React, { ReactNode } from 'react';

export const EditList = <T extends IdAndName>({
  list,
  emptyText = 'No items found',
  handleClick,
  renderItem,
}: {
  list: T[];
  emptyText?: string;
  handleClick: (listItem: T) => void;
  renderItem: (listItem: T) => ReactNode;
}) => {
  return (
    <>
      {list.length === 0 && (
        <span className='!mt-10 inline-block w-full text-center'>
          {emptyText}
        </span>
      )}
      {list.length > 0 && (
        <ul className='mt-4 pl-0'>
          {list.map((listItem) => {
            return (
              <li
                key={listItem.id}
                onClick={() => handleClick(listItem)}
                className='relative cursor-pointer py-1.5 before:absolute before:-inset-x-6 before:inset-y-0 before:-z-50 before:hover:bg-[--vscode-list-hoverBackground]'
              >
                {renderItem(listItem)}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

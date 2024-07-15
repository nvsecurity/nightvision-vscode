import { IdAndName } from '@contexts/ProjectContext';
import React from 'react';

export const EditList = <T extends IdAndName>({
  list,
  handleClick,
  children,
}: {
  list: T[];
  handleClick: (listItem: T) => void;
  children?: React.ReactNode;
}) => {
  return (
    <>
      {list.length === 0 && <>{children}</>}
      {list.length > 0 && (
        <ul className='mt-4 pl-0'>
          {list.map((listItem) => {
            return (
              <li
                key={listItem.id}
                onClick={() => handleClick(listItem)}
                className='relative cursor-pointer py-1.5 before:absolute before:-inset-x-6 before:inset-y-0 before:-z-50 before:hover:bg-[--vscode-list-hoverBackground]'
              >
                <span className='block max-w-full truncate'>
                  {listItem.name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

import { IdAndName } from '@contexts/ProjectContext';
import React from 'react';

export const EditList = <T extends IdAndName>({
  list,
  handleClick,
}: {
  list: T[];
  handleClick: (listItem: T) => void;
}) => {
  return (
    <ul className='mt-4 pl-0'>
      {list.map((listItem) => {
        return (
          <li
            key={listItem.id}
            onClick={() => handleClick(listItem)}
            className='relative cursor-pointer py-1.5 before:absolute before:-inset-x-6 before:inset-y-0 before:-z-50 before:hover:bg-[--vscode-list-hoverBackground]'
          >
            {listItem.name}
          </li>
        );
      })}
    </ul>
  );
};

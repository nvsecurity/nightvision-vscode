import React from 'react';

const PAGE_SIZE = 25;

interface PaginationProps {
  page: number;
  totalCount: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalCount,
  setPage,
}) => {
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  const prevDisabled = page <= 1;
  const nextDisabled = page >= Math.ceil(totalCount / PAGE_SIZE);

  const onPrevClick = () => {
    if (!prevDisabled) {
      setPage(page - 1);
    }
  };

  const onNextClick = () => {
    if (!nextDisabled) {
      setPage(page + 1);
    }
  };

  return (
    <div className='flex flex-row items-center justify-end gap-3 p-2'>
      {start}-{end} of {totalCount}
      <button className='unstyled w-fit' onClick={onPrevClick}>
        <CaretLeft color={prevDisabled ? '#5A657C' : undefined}/>
      </button>
      <button className='unstyled w-fit' onClick={onNextClick}>
        <CaretRight color={nextDisabled ? '#5A657C' : undefined}/>
      </button>
    </div>
  );
};

interface IconProps {
  color?: string;
}

const CaretLeft: React.FC<IconProps> = ({color = '[--vscode-foreground]'}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 256 256"
    fill={color}
    className={`h-5 w-5 fill-${color}`}
  >
    <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
  </svg>
);

const CaretRight: React.FC<IconProps> = ({color = '[--vscode-foreground]'}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 256 256"
    fill={color}
    className={`h-5 w-5 fill-${color}`}
  >
    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
  </svg>
);
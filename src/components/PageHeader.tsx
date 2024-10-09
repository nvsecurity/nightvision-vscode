import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ReloadButton } from './ReloadButton';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  reloadButton?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  backTo = '',
  reloadButton = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className='flex items-center space-x-2'>
      <Link
        to={backTo || '#'}
        onClick={() => !backTo && navigate(-1)}
      >
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          xmlns='http://www.w3.org/2000/svg'
          fill='currentColor'
          className='h-5 w-5'
        >
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M7 3.093l-5 5V8.8l5 5 .707-.707-4.146-4.147H14v-1H3.56L7.708 3.8 7 3.093z'
          />
        </svg>
      </Link>
      <h1 className='truncate font-bold uppercase'>{title}</h1>
      {reloadButton && <ReloadButton />}
    </div>
  );
};
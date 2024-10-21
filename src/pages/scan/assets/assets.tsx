import React from 'react';

export const LoadingIcon: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 100 100'
      className='h-5 w-5 animate-spin stroke-[--vscode-foreground]'
    >
      <circle
        cx='50'
        cy='50'
        fill='none'
        strokeWidth='8'
        r='35'
        strokeDasharray='164.93361431346415 56.97787143782138'
      />
    </svg>
  );
};

export const ErrorIcon: React.FC = () => {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      xmlns='http://www.w3.org/2000/svg'
      fill='currentColor'
      className='h-5 w-5 stroke-red-600'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.7L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z'
      />
    </svg>
  );
};

export const ExtraLinkIcon: React.FC = () => {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      xmlns='http://www.w3.org/2000/svg'
      fill='currentColor'
    >
      <path d='M1.5 1H6v1H2v12h12v-4h1v4.5l-.5.5h-13l-.5-.5v-13l.5-.5z' />
      <path d='M15 1.5V8h-1V2.707L7.243 9.465l-.707-.708L13.293 2H8V1h6.5l.5.5z' />
    </svg>
  );
};

interface TrashIconProps {
  color?: string;
}

export const TrashIcon: React.FC<TrashIconProps> = ({color = '[--vscode-foreground]'}) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 256 256'
      fill={color}
      className={`mt-0 fill-${color}`}
    >
      <path d='M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z'></path>
    </svg>
  );
};

interface StopIconProps {
  color?: string;
}

export const StopIcon: React.FC<StopIconProps> = ({color = '[--vscode-foreground]'}) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 256 256'
      fill={color}
      className={`mt-0 fill-${color}`}
    >
      <path d='M176,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Zm56,0A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z'></path>
    </svg>
  );
};
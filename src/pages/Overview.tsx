import { useUser } from '@hooks/useUser';
import React from 'react';
import { Link } from 'react-router-dom';
import { InstallButton } from '@components/InstallButton';
import { isCliOutdated } from '@utils/isCliOutdated';

export const Overview = () => {
  const { cliVersion, setCliVersion, setIsCliInstalled } = useUser();

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <h1 className='truncate font-bold uppercase'>Overview</h1>
        <Link to='/settings' title='Settings' className='!ml-auto'>
          <svg
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            className='size-5 fill-[--vscode-foreground]'
          >
            <path
              fillRule='evenodd'
              clipRule='evenodd'
              d='M19.85 8.75l4.15.83v4.84l-4.15.83 2.35 3.52-3.43 3.43-3.52-2.35-.83 4.15H9.58l-.83-4.15-3.52 2.35-3.43-3.43 2.35-3.52L0 14.42V9.58l4.15-.83L1.8 5.23 5.23 1.8l3.52 2.35L9.58 0h4.84l.83 4.15 3.52-2.35 3.43 3.43-2.35 3.52zm-1.57 5.07l4-.81v-2l-4-.81-.54-1.3 2.29-3.43-1.43-1.43-3.43 2.29-1.3-.54-.81-4h-2l-.81 4-1.3.54-3.43-2.29-1.43 1.43L6.38 8.9l-.54 1.3-4 .81v2l4 .81.54 1.3-2.29 3.43 1.43 1.43 3.43-2.29 1.3.54.81 4h2l.81-4 1.3-.54 3.43 2.29 1.43-1.43-2.29-3.43.54-1.3zm-8.186-4.672A3.43 3.43 0 0 1 12 8.57 3.44 3.44 0 0 1 15.43 12a3.43 3.43 0 1 1-5.336-2.852zm.956 4.274c.281.188.612.288.95.288A1.7 1.7 0 0 0 13.71 12a1.71 1.71 0 1 0-2.66 1.422z'
            />
          </svg>
        </Link>
      </div>
      <div className='grid auto-cols-min grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3'>
        {MAIN_ROUTES.map(({path, title, icon}) => (
          <Link
            to={path}
            key={path}
            className='relative flex flex-col justify-between p-2 text-[--vscode-foreground] before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] hover:cursor-pointer hover:text-[--vscode-foreground] before:hover:brightness-75'
          >
            <div className='flex flex-col items-center justify-center space-y-1'>
              {icon}
              <span>{title}</span>
            </div>
          </Link>
        ))}
      </div>
      {cliVersion && isCliOutdated(cliVersion) && (
        <InstallButton
          installText='Update NightVison CLI'
          installingText='Updating...'
          cliVersion={cliVersion}
          setIsCliInstalled={(val) => {
            setIsCliInstalled(val);
            setCliVersion(process.env.CLI_VERSION);
          }}
        />
      )}
    </div>
  );
};

const ScansSvg = () => {
  return (
    <svg
      viewBox='0 0 18 14'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='h-12 w-12 stroke-[--vscode-foreground]'
    >
      <path
        d='M12.1804 3.82001C12.5987 4.23794 12.9307 4.73424 13.1571 5.28053C13.3836 5.82682 13.5001 6.41239 13.5001 7.00376C13.5001 7.59513 13.3836 8.1807 13.1571 8.72699C12.9307 9.27328 12.5987 9.76958 12.1804 10.1875M5.82035 10.18C5.40196 9.76208 5.07004 9.26578 4.84358 8.71949C4.61712 8.1732 4.50056 7.58763 4.50056 6.99626C4.50056 6.40489 4.61712 5.81932 4.84358 5.27303C5.07004 4.72674 5.40196 4.23044 5.82035 3.81251M14.3029 1.69751C15.7089 3.10397 16.4987 5.01128 16.4987 7.00001C16.4987 8.98874 15.7089 10.8961 14.3029 12.3025M3.69785 12.3025C2.29182 10.8961 1.50195 8.98874 1.50195 7.00001C1.50195 5.01128 2.29182 3.10397 3.69785 1.69751M10.5004 7.00001C10.5004 7.82844 9.82878 8.50001 9.00035 8.50001C8.17192 8.50001 7.50035 7.82844 7.50035 7.00001C7.50035 6.17158 8.17192 5.50001 9.00035 5.50001C9.82878 5.50001 10.5004 6.17158 10.5004 7.00001Z'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      ></path>
    </svg>
  );
};

const TargetsSvg = () => {
  return (
    <svg
      viewBox='0 0 16 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='h-12 w-12 stroke-[--vscode-foreground]'
    >
      <path
        d='M1.4525 5.21993L8 9.00743L14.5475 5.21993M8 16.5599V8.99993M14.75 11.9999V5.99993C14.7497 5.73688 14.6803 5.47853 14.5487 5.2508C14.417 5.02306 14.2278 4.83395 14 4.70243L8.75 1.70243C8.52197 1.57077 8.2633 1.50146 8 1.50146C7.7367 1.50146 7.47803 1.57077 7.25 1.70243L2 4.70243C1.7722 4.83395 1.58299 5.02306 1.45135 5.2508C1.31971 5.47853 1.25027 5.73688 1.25 5.99993V11.9999C1.25027 12.263 1.31971 12.5213 1.45135 12.7491C1.58299 12.9768 1.7722 13.1659 2 13.2974L7.25 16.2974C7.47803 16.4291 7.7367 16.4984 8 16.4984C8.2633 16.4984 8.52197 16.4291 8.75 16.2974L14 13.2974C14.2278 13.1659 14.417 12.9768 14.5487 12.7491C14.6803 12.5213 14.7497 12.263 14.75 11.9999Z'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      ></path>
    </svg>
  );
};

const AuthenticationsSvg = () => {
  return (
    <svg
      viewBox='0 0 14 18'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='h-12 w-12 stroke-[--vscode-foreground]'
    >
      <path
        d='M7 16.5C7 16.5 13 13.5 13 9V3.75L7 1.5L1 3.75V9C1 13.5 7 16.5 7 16.5Z'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      ></path>
    </svg>
  );
};

const ProjectsSvg = () => {
  return (
    <svg
      viewBox='0 0 18 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='h-12 w-12 stroke-[--vscode-foreground]'
    >
      <path
        d='M16.5 13.25C16.5 13.6478 16.342 14.0294 16.0607 14.3107C15.7794 14.592 15.3978 14.75 15 14.75H3C2.60218 14.75 2.22064 14.592 1.93934 14.3107C1.65804 14.0294 1.5 13.6478 1.5 13.25V2.75C1.5 2.35218 1.65804 1.97064 1.93934 1.68934C2.22064 1.40804 2.60218 1.25 3 1.25H6.75L8.25 3.5H15C15.3978 3.5 15.7794 3.65804 16.0607 3.93934C16.342 4.22064 16.5 4.60218 16.5 5V13.25Z'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      ></path>
    </svg>
  );
};

const ApiDiscoverySvg = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    className='h-12 w-12 stroke-[--vscode-foreground] fill-[--vscode-foreground]'
    viewBox="0 0 256 256"
  >
    <path
      d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-45.54-48.85a36.05,36.05,0,1,0-11.31,11.31l11.19,11.2a8,8,0,0,0,11.32-11.32ZM104,148a20,20,0,1,1,20,20A20,20,0,0,1,104,148Z"
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    ></path>
  </svg>
);

interface GeneralRouteParams {
  path: string;
  title: string;
  icon: React.JSX.Element;
}

const MAIN_ROUTES: GeneralRouteParams[] = [
  { path: '/scans', title: 'Scans', icon: <ScansSvg /> },
  { path: '/targets', title: 'Targets', icon: <TargetsSvg /> },
  { path: '/authentications', title: 'Authentications', icon: <AuthenticationsSvg /> },
  { path: '/projects', title: 'Projects', icon: <ProjectsSvg /> },
  { path: '/api-discovery', title: 'API Discovery', icon: <ApiDiscoverySvg /> },
];

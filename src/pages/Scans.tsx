import { Severity } from '@contexts/ScanContext';
import { useScan } from '@hooks/useScan';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import formatDuration from '@utils/formatDuration';

export const Scans = () => {
  const { scans } = useScan();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);
    interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 500);

    return () => clearInterval(interval);
  }, [currentTime]);

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <Link to='/' title='To Overview'>
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
        <h1 className='font-bold uppercase'>Scans</h1>
      </div>
      <Link to='/scans/new-scan'>
        <button className='rounded text-white'>New Scan</button>
      </Link>

      <div className='grid auto-cols-min grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3'>
        {Object.entries(scans).map(([scanId, scan]) => {
          const severityCounts: Record<Severity, number> = scan.issues.reduce(
            (counts, issue) => {
              counts[issue.severity] += 1;
              return counts;
            },
            { critical: 0, high: 0, medium: 0, low: 0 }
          );
          return (
            <Link
              to={`/scans/${scanId}`}
              key={scan.applicationName + scanId}
              className='relative flex h-24 flex-col justify-between px-4 py-2 text-[--vscode-foreground] before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] hover:cursor-pointer hover:text-[--vscode-foreground] before:hover:brightness-75'
            >
              <div className='flex justify-between'>
                <span className='mr-2 overflow-hidden text-ellipsis font-bold'>
                  {scan.applicationName}
                </span>
                <span>
                  {scan.isError && !scan.endedAt
                    ? '00:00'
                    : formatDuration(
                        (scan.endedAt || currentTime.getTime()) - scan.createdAt
                      )}
                </span>
              </div>
              <div className='flex items-end justify-between'>
                <span className='mr-2 overflow-hidden text-ellipsis'>
                  {scan.projectName}
                </span>
                <div className='flex justify-between space-x-3'>
                  {!!severityCounts.critical && (
                    <div className='flex items-center justify-between space-x-0.5'>
                      <div className='mt-0.5 h-2 w-2 rounded-full bg-orange-600' />
                      <span>{severityCounts.critical}</span>
                    </div>
                  )}
                  {!!severityCounts.high && (
                    <div className='flex items-center justify-between space-x-0.5'>
                      <div className='mt-0.5 h-2 w-2 rounded-full bg-orange-600' />
                      <span>{severityCounts.high}</span>
                    </div>
                  )}
                  {!!severityCounts.medium && (
                    <div className='flex items-center justify-between space-x-0.5'>
                      <div className='mt-0.5 h-2 w-2 rounded-full bg-yellow-600' />
                      <span>{severityCounts.medium}</span>
                    </div>
                  )}
                  {!!severityCounts.low && (
                    <div className='flex items-center justify-between space-x-0.5'>
                      <div className='mt-0.5 h-2 w-2 rounded-full bg-green-600' />
                      <span>{severityCounts.low}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

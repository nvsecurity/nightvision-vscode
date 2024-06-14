import { Severity } from '@contexts/ScanContext';
import { useScans } from '@hooks/useScans';
import * as React from 'react';
import { Link } from 'react-router-dom';
import formatDuration from '@utils/formatDuration';

export const Overview = () => {
  const { scans } = useScans();

  return (
    <div className='flex flex-col space-y-4'>
      <h1 className='font-bold uppercase'>Overview</h1>
      <Link to='/scan'>
        <button className='rounded text-white'>New Scan</button>
      </Link>

      <div className='grid auto-cols-min grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3'>
        {Object.entries(scans).map(([scanId, scan]) => {
          const severityCounts: Record<Severity, number> = scan.issues.reduce(
            (counts, issue) => {
              counts[issue.severity] = (counts[issue.severity] || 0) + 1;
              return counts;
            },
            { critical: 0, high: 0, medium: 0, low: 0 }
          );

          const critical = severityCounts.critical || 0;
          const high = severityCounts.high || 0;
          const medium = severityCounts.medium || 0;
          const low = severityCounts.low || 0;
          return (
            <div
              key={scan.applicationName + scanId}
              className='relative flex h-24 flex-col justify-between px-4 py-2 before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] hover:cursor-pointer before:hover:brightness-75'
            >
              <div className='flex justify-between'>
                <span className='mr-2 overflow-hidden text-ellipsis font-bold'>
                  {scan.applicationName}
                </span>
                <span>{formatDuration(scan.duration)}</span>
              </div>
              <div className='flex items-end justify-between'>
                <span className='mr-2 overflow-hidden text-ellipsis'>
                  {/* {scan.project} */}
                  Sean_s_Default_Project
                </span>
                <div className='flex justify-between space-x-3'>
                  {!!critical && (
                    <div className='flex items-center justify-between space-x-0.5'>
                      <div className='mt-0.5 h-2 w-2 rounded-full bg-orange-600' />
                      <span>{critical}</span>
                    </div>
                  )}
                  {!!high && (
                    <div className='flex items-center justify-between space-x-0.5'>
                      <div className='mt-0.5 h-2 w-2 rounded-full bg-orange-600' />
                      <span>{high}</span>
                    </div>
                  )}
                  {!!medium && (
                    <div className='flex items-center justify-between space-x-0.5'>
                      <div className='mt-0.5 h-2 w-2 rounded-full bg-yellow-600' />
                      <span>{medium}</span>
                    </div>
                  )}
                  {!!low && (
                    <div className='flex items-center justify-between space-x-0.5'>
                      <div className='mt-0.5 h-2 w-2 rounded-full bg-green-600' />
                      <span>{low}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

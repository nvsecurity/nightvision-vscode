import { useUser } from '@hooks/useUser';
import { ScanType, Severity, normalizedSeverity } from '@types_/scan';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loading } from '@components/Loading';
import { messageHandler } from '@utils/MessageHandler';
import formatDuration from '@utils/formatDuration';

const countIssues = (issues: any[]) => {
  return issues.reduce(
    (
      counts: Record<Severity, number>,
      kind: { severity: string; vulnerable_paths_count: number }
    ) => {
      const severity = normalizedSeverity(kind.severity);
      counts[severity] = (counts[severity] ?? 0) + kind.vulnerable_paths_count;
      return counts;
    },
    {} as Partial<Record<Severity, number>>
  );
};

export const Scans = () => {
  const { setIsLoggedIn } = useUser();
  const [scans, setScans] = useState<ScanType[]>();
  const [currentTime, setCurrentTime] = useState(new Date());

  const getIssues = async (scanId: string) => {
    try {
      const response = await messageHandler.api(
        'get',
        `https://api.nightvision.net/api/v1/issues/kind/?scan=${scanId}`
      );

      return response.results;
    } catch (err: any) {
      if (
        err?.type === 'client_error' ||
        err?.type === 'validation_error' ||
        err?.type === 'server_error'
      ) {
        for (const error of err.errors) {
          switch (error.code) {
            case 'not_authenticated':
            case 'authentication_failed': {
              setIsLoggedIn(false);
            }
          }
        }
      } else {
        console.error(err);
      }
      return [];
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);
    interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 500);

    return () => clearInterval(interval);
  }, [currentTime]);

  // Periodically get scans
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);

    const getAndSetScans = async () => {
      try {
        const response = (
          await messageHandler.api(
            'get',
            'https://api.nightvision.net/api/v1/scans/?order=-created_at&page_size=24'
          )
        ).results;

        const scansPromises: Promise<ScanType>[] = response.map(
          async (scan: any): Promise<ScanType> => {
            let vulnPathsStatistics = {};
            if (!scan.vulnerable_paths_statistics) {
              const issues = await getIssues(scan.id);
              vulnPathsStatistics = countIssues(issues);
            }

            return {
              id: scan.id,
              application: scan.application,
              authentication: scan.credentials,
              target: scan.target,
              project: scan.project,
              createdAt: new Date(scan.created_at).getTime(),
              endedAt: scan.ended_at
                ? new Date(scan.ended_at).getTime()
                : undefined,
              status: scan.status_value,
              isScanning: scan.status_value === 'RUNNING',
              isError:
                scan.status_value !== 'RUNNING' &&
                scan.status_value !== 'SUCCEEDED',
              vulnPathsStatistics:
                scan.vulnerable_paths_statistics ?? vulnPathsStatistics,
              issues: [],
            };
          }
        );

        const scans = await Promise.all(scansPromises);
        setScans(scans);
      } catch (err: any) {
        if (
          err?.type === 'client_error' ||
          err?.type === 'validation_error' ||
          err?.type === 'server_error'
        ) {
          for (const error of err.errors) {
            switch (error.code) {
              case 'not_authenticated':
              case 'authentication_failed': {
                setIsLoggedIn(false);
              }
            }
          }
        } else {
          console.error(err);
        }
      }
    };

    getAndSetScans();

    interval = setInterval(async () => {
      await getAndSetScans();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Get issues for scans that are still running
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);

    interval = setInterval(async () => {
      try {
        for (const scan of scans ?? []) {
          if (!scan.isScanning) {
            return;
          }

          const issues = await getIssues(scan.id);

          setScans((prevState) =>
            prevState?.map((oldScan) =>
              oldScan.id === scan.id
                ? {
                    ...oldScan,
                    vulnPathsStatistics: countIssues(issues),
                  }
                : oldScan
            )
          );
        }
      } catch (err: any) {
        if (
          err?.type === 'client_error' ||
          err?.type === 'validation_error' ||
          err?.type === 'server_error'
        ) {
          for (const error of err.errors) {
            switch (error.code) {
              case 'not_authenticated':
              case 'authentication_failed': {
                setIsLoggedIn(false);
              }
            }
          }
        } else {
          console.error(err);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [scans]);

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
      <Link to='/scans/new-scan' tabIndex={-1}>
        <button className='rounded text-white'>New Scan</button>
      </Link>

      {!scans && <Loading />}
      {scans?.length === 0 && (
        <span className='!mt-10 w-full text-center'>No scans found</span>
      )}
      <div className='grid auto-cols-min grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3'>
        {scans?.map((scan) => (
          <Link
            to={`/scans/${scan.id}`}
            key={scan.id}
            className='relative flex h-24 flex-col justify-between px-4 py-2 text-[--vscode-foreground] before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] hover:cursor-pointer hover:text-[--vscode-foreground] before:hover:brightness-75'
          >
            <div className='flex justify-between'>
              <span className='mr-2 truncate font-bold'>
                {scan.application?.name ?? '-'}
              </span>
              <div className='flex items-center'>
                {scan.isScanning && (
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
                )}
                {scan.isError && (
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
                )}
                <span className='ml-2 font-bold'>
                  {formatDuration(
                    (scan.endedAt || currentTime.getTime()) - scan.createdAt
                  )}
                </span>
              </div>
            </div>
            <div className='flex items-end justify-between truncate'>
              <span className='mr-2 truncate'>{scan.project.name}</span>
              <div className='flex justify-between space-x-3'>
                {!!scan.vulnPathsStatistics?.Critical && (
                  <div className='flex items-center justify-between space-x-0.5'>
                    <div className='mt-0.5 h-2 w-2 rounded-full bg-red-600' />
                    <span>{scan.vulnPathsStatistics.Critical}</span>
                  </div>
                )}
                {!!scan.vulnPathsStatistics?.High && (
                  <div className='flex items-center justify-between space-x-0.5'>
                    <div className='mt-0.5 h-2 w-2 rounded-full bg-orange-600' />
                    <span>{scan.vulnPathsStatistics.High}</span>
                  </div>
                )}
                {!!scan.vulnPathsStatistics?.Medium && (
                  <div className='flex items-center justify-between space-x-0.5'>
                    <div className='mt-0.5 h-2 w-2 rounded-full bg-yellow-600' />
                    <span>{scan.vulnPathsStatistics.Medium}</span>
                  </div>
                )}
                {!!scan.vulnPathsStatistics?.Low && (
                  <div className='flex items-center justify-between space-x-0.5'>
                    <div className='mt-0.5 h-2 w-2 rounded-full bg-green-600' />
                    <span>{scan.vulnPathsStatistics.Low}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

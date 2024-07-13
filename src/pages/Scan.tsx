import { useUser } from '@hooks/useUser';
import { ScanType, Severity, normalizedSeverity } from '@types_/scan';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { messageHandler } from '@utils/MessageHandler';
import formatDuration from '@utils/formatDuration';

export const Scan = () => {
  const { scanId } = useParams();

  const { setIsLoggedIn } = useUser();

  const [scan, setScan] = useState<ScanType>();
  const [toggled, setToggled] = useState<Severity | null>(null);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scanRef = useRef(scan);

  const toggledIssues =
    scan?.issues
      .filter((issue) => issue.severity === toggled)
      .map((issue) => ({ ...issue, id: issue.name })) ?? [];

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);
    interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 500);

    return () => clearInterval(interval);
  }, [currentTime]);

  useEffect(() => {
    scanRef.current = scan;
  }, [scan]);

  useEffect(() => {
    let ignore = false;
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);

    const getAndSetScan = async () => {
      try {
        const response = await messageHandler.api(
          'get',
          `https://api.nightvision.net/api/v1/scans/${scanId}`
        );

        const issues = (
          await messageHandler.api(
            'get',
            `https://api.nightvision.net/api/v1/issues/kind/?scan=${scanId}`
          )
        ).results;

        if (!ignore) {
          setScan({
            id: response.id,
            application: response.application,
            target: response.target,
            project: response.project,
            createdAt: new Date(response.created_at).getTime(),
            endedAt: response.ended_at
              ? new Date(response.ended_at).getTime()
              : undefined,
            status: response.status_value,
            isScanning: response.status_value === 'RUNNING',
            isError:
              response.status_value !== 'RUNNING' &&
              response.status_value !== 'SUCCEEDED',
            vulnPathsStatistics: response.vulnerable_paths_statistics,
            issues: issues.map((issue: any) => ({
              name: issue.kind_name,
              severity: normalizedSeverity(issue.severity),
            })),
          });
        }
      } catch (err: any) {
        if (err?.type === 'client_error') {
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

    setIsFetchingApi(true);
    getAndSetScan();

    interval = setInterval(async () => {
      if (scanRef.current ? !scanRef.current.isScanning : false) {
        clearInterval(interval);
        return;
      }

      await getAndSetScan();
    }, 5000);

    setIsFetchingApi(false);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [scanId]);

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <Link to='/scans' title='To Scans'>
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
        <h1 className='font-bold uppercase'>Scan</h1>
      </div>
      {!scan || isFetchingApi ? (
        <Loading />
      ) : (
        <>
          <div className='flex flex-col space-y-1'>
            <div>
              <Label htmlFor='application'>Application Name</Label>
              <select
                className='w-full bg-[--vscode-settings-dropdownBackground] px-0.5 py-1.5'
                disabled
              >
                <option>{scan.application.name}</option>
              </select>
            </div>
            <div>
              <Label htmlFor='target-name'>Target Name</Label>
              <select
                className='w-full bg-[--vscode-settings-dropdownBackground] px-0.5 py-1.5'
                disabled
              >
                <option>{scan.target.name}</option>
              </select>
            </div>
          </div>

          <div>
            <div className='flex items-center justify-between'>
              <a
                href={`https://app.nightvision.net/scans/${scanId}/findings`}
                title='View in Browser'
              >
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
              </a>
              <div className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 100 100'
                  className={`h-5 w-5 animate-spin stroke-[--vscode-foreground] ${scan.isScanning ? 'visible' : 'invisible'}`}
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
            <div className='mt-4 grid auto-cols-min grid-cols-1 gap-3 min-[280px]:grid-cols-2'>
              <IssueCard
                severity='Critical'
                amount={
                  scan.issues.filter((issue) => issue.severity === 'Critical')
                    .length ?? 0
                }
                toggled={toggled}
                setToggled={setToggled}
              />
              <IssueCard
                severity='High'
                amount={
                  scan.issues.filter((issue) => issue.severity === 'High')
                    .length ?? 0
                }
                toggled={toggled}
                setToggled={setToggled}
              />
              <IssueCard
                severity='Medium'
                amount={
                  scan.issues.filter((issue) => issue.severity === 'Medium')
                    .length ?? 0
                }
                toggled={toggled}
                setToggled={setToggled}
              />
              <IssueCard
                severity='Low'
                amount={
                  scan.issues.filter((issue) => issue.severity === 'Low')
                    .length ?? 0
                }
                toggled={toggled}
                setToggled={setToggled}
              />
            </div>
            {toggled && (
              <EditList handleClick={() => {}} list={toggledIssues}>
                <span className='!mt-10 inline-block w-full text-center'>
                  No issues found!
                </span>
              </EditList>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const severityColor: { [key in Severity]: string } = {
  Critical: 'after:bg-red-600',
  High: 'after:bg-orange-600',
  Medium: 'after:bg-yellow-600',
  Low: 'after:bg-green-600',
  Informational: '',
  Unspecified: '',
  Unknown: '',
};

const IssueCard = ({
  severity,
  amount,
  toggled,
  setToggled,
}: {
  severity: Severity;
  amount: number;
  toggled: Severity | null;
  setToggled: React.Dispatch<React.SetStateAction<Severity | null>>;
}) => {
  const isToggled = severity === toggled;
  return (
    <div
      className={`relative flex h-24 flex-col items-center justify-center bg-transparent px-4 py-2 before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] after:absolute after:inset-y-0 after:left-0 after:w-1.5 after:rounded-bl after:rounded-tl after:bg-opacity-0 hover:cursor-pointer hover:bg-transparent before:hover:brightness-75 ${isToggled ? 'before:brightness-75 after:bg-opacity-100' : ''} ${severityColor[severity]}`}
      onClick={() => {
        if (isToggled) {
          setToggled(null);
          return;
        }
        setToggled(severity);
      }}
    >
      <span className='text-3xl font-bold'>{amount}</span>
      <span className='text-center font-medium capitalize brightness-50'>
        {severity} Severity
      </span>
    </div>
  );
};

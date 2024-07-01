import { ScanType, Severity } from '@contexts/ScanContext';
import { useApp } from '@hooks/useApp';
import { useScan } from '@hooks/useScan';
import { useTarget } from '@hooks/useTarget';
import { useUser } from '@hooks/useUser';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ISSUES,
  KILL,
  SCAN,
  SCAN_FINISHED,
  SCAN_ID,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { Dropdown } from '@components/Dropdown';
import { messageHandler } from '@utils/MessageHandler';
import formatDuration from '@utils/formatDuration';

export const Scan = () => {
  const navigate = useNavigate();
  const { scanId } = useParams();

  const { apps } = useApp();
  const { targets } = useTarget();
  const { scans, setScans } = useScan();
  const { setIsLoggedIn } = useUser();

  const scan = scanId ? scans[scanId] : undefined;

  const [applicationName, setApplicationName] = useState(apps[0]);
  const [targetName, setTargetName] = useState(targets[0].name);
  const [requestId, setRequestId] = useState('');
  const [duration, setDuration] = useState(
    scan
      ? (scan.endedAt?.getTime() || new Date().getTime()) -
          scan.createdAt.getTime()
      : 0
  );
  const [isLoading, setIsLoading] = useState(false);
  const [toggled, setToggled] = useState<Severity | null>(null);

  const toggledIssues =
    scan?.issues.filter((issue) => issue.severity.toLowerCase() === toggled) ??
    [];

  const handleScanClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    let tempScanId = scanId ?? '';

    if (scan?.isScanning) {
      const requestGenerator = messageHandler.requestGenerator(KILL, requestId);
      for await (const response of requestGenerator) {
        console.log('Received data:', response);
        if (response.command === KILL) {
          setScans((prevState) => ({
            ...prevState,
            [tempScanId]: {
              ...prevState[tempScanId],
              endedAt: new Date(),
              isScanning: false,
              isError: true,
            },
          }));
        }
      }
      return;
    }

    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator(SCAN, reqId, {
      applicationName,
      targetName,
    });

    setRequestId(reqId);
    setDuration(0);
    setIsLoading(true);
    setToggled(null);

    for await (const response of requestGenerator) {
      console.log('Received data:', response);
      switch (response.command) {
        case SCAN_ID: {
          tempScanId = response.payload;

          const newScan: ScanType = {
            applicationName,
            targetName,
            projectName: 'Default_Project',
            createdAt: new Date(),
            isScanning: true,
            isError: false,
            issues: [],
          };

          navigate(`/scan/${tempScanId}`, { replace: true });
          setIsLoading(false);
          setScans((prevState) => ({ [tempScanId]: newScan, ...prevState }));
          break;
        }
        case ISSUES: {
          setScans((prevState) => ({
            ...prevState,
            [tempScanId]: {
              ...prevState[tempScanId],
              issues: [...response.payload, ...prevState[tempScanId].issues],
            },
          }));
          break;
        }
        case SCAN_FINISHED: {
          setScans((prevState) => ({
            ...prevState,
            [tempScanId]: {
              ...prevState[tempScanId],
              endedAt: new Date(),
              isScanning: false,
              isError: response.payload !== 'SUCCEEDED',
            },
          }));
          break;
        }
        case UNAUTHORIZED_ACCESS:
          setIsLoggedIn(false);
          break;
      }
    }
    setIsLoading(false);
    setScans((prevState) => ({
      ...prevState,
      [tempScanId]: {
        ...prevState[tempScanId],
        endedAt: new Date(),
        isScanning: false,
      },
    }));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);
    interval = setInterval(() => {
      if (!scan?.isScanning) {
        clearInterval(interval);
        return;
      }
      setDuration(Date.now() - scan?.createdAt.getTime());
    }, 500);

    return () => clearInterval(interval);
  }, [scan?.isScanning, scan?.createdAt]);

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <Link to={isLoading ? '.' : '/'} title='To Overview'>
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
      <div className='flex flex-col space-y-1'>
        <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='application'
          >
            Application Name
          </label>
          <Dropdown
            items={apps}
            name='Application'
            route={isLoading ? '.' : `/application`}
            handleChange={setApplicationName}
          />
        </div>
        <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='target-name'
          >
            Target Name
          </label>
          <Dropdown
            items={targets.map((target) => target.name)}
            name='Target'
            route={isLoading ? '.' : `/target`}
            handleChange={setTargetName}
          />
        </div>
      </div>
      <button
        onClick={handleScanClick}
        className={`rounded disabled:bg-neutral-800 hover:disabled:cursor-default ${scan?.isScanning ? 'bg-red-500 hover:bg-red-500 hover:brightness-90' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : scan?.isScanning ? 'Cancel' : 'Start Scan'}
      </button>

      <div className={`${scan && !isLoading ? 'visible' : 'invisible'}`}>
        <div className='mt-4 flex items-center justify-between'>
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
              className={`h-5 w-5 stroke-[--vscode-foreground] ${scan?.isScanning ? 'visible' : 'invisible'}`}
            >
              <circle
                cx='50'
                cy='50'
                fill='none'
                strokeWidth='8'
                r='35'
                strokeDasharray='164.93361431346415 56.97787143782138'
              >
                <animateTransform
                  attributeName='transform'
                  type='rotate'
                  repeatCount='indefinite'
                  dur='1s'
                  values='0 50 50;360 50 50'
                  keyTimes='0;1'
                ></animateTransform>
              </circle>
            </svg>

            {scan?.isError && (
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

            <span className='ml-2 font-bold'>{formatDuration(duration)}</span>
          </div>
        </div>
        <div className='mt-4 grid auto-cols-min grid-cols-1 gap-3 min-[280px]:grid-cols-2'>
          <IssueCard
            severity='critical'
            amount={
              scan?.issues.filter(
                (issue) => issue.severity.toLowerCase() === 'critical'
              ).length ?? 0
            }
            toggled={toggled}
            setToggled={setToggled}
          />
          <IssueCard
            severity='high'
            amount={
              scan?.issues.filter(
                (issue) => issue.severity.toLowerCase() === 'high'
              ).length ?? 0
            }
            toggled={toggled}
            setToggled={setToggled}
          />
          <IssueCard
            severity='medium'
            amount={
              scan?.issues.filter(
                (issue) => issue.severity.toLowerCase() === 'medium'
              ).length ?? 0
            }
            toggled={toggled}
            setToggled={setToggled}
          />
          <IssueCard
            severity='low'
            amount={
              scan?.issues.filter(
                (issue) => issue.severity.toLowerCase() === 'low'
              ).length ?? 0
            }
            toggled={toggled}
            setToggled={setToggled}
          />
        </div>
        {toggled && (
          <ul className='mt-4 pl-0'>
            {toggledIssues.length > 0
              ? toggledIssues.map((issue) => {
                  return (
                    <li key={issue.name + issue.severity}>{issue.name}</li>
                  );
                })
              : 'No issues found!'}
          </ul>
        )}
      </div>
    </div>
  );
};

const severityColor: { [key in Severity]: string } = {
  critical: 'after:bg-red-600',
  high: 'after:bg-orange-600',
  medium: 'after:bg-yellow-600',
  low: 'after:bg-green-600',
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

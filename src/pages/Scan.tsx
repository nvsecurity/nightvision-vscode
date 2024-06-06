import { v4 } from 'uuid';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { messageHandler } from '@utils/MessageHandler';

type Severity = 'critical' | 'high' | 'medium' | 'low';

export const Scan = () => {
  const [applicationName, setApplicationName] = useState('vuln_node_express');
  const [targetName, setTargetName] = useState('vuln_node_express');
  const [targetUrl, setTargetUrl] = useState('http://localhost:3001');

  const [requestId, setRequestId] = useState('');
  const [scanId, setScanId] = useState('');
  const [timestamp, setTimestamp] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toggled, setToggled] = useState<Severity | null>(null);

  const [issues, setIssues] = useState<{ name: string; severity: Severity }[]>(
    []
  );

  const handleScanClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isScanning) {
      const requestGenerator = messageHandler.requestGenerator(
        'kill',
        requestId
      );
      for await (const response of requestGenerator) {
        console.log('Received data:', response);
      }
      setIsError(true);
      setIsScanning(false);
      return;
    }

    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator('scan', reqId, {
      applicationName,
      targetName,
      targetUrl,
    });

    setDuration(0);
    setRequestId(reqId);
    setIsLoading(true);
    setIsError(false);
    setToggled(null);
    setIssues([]);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    for await (const response of requestGenerator) {
      console.log('Received data:', response);
      if (!isScanning) {
        setIsScanning(true);
        setIsLoading(false);
      }
      switch (response.command) {
        case 'scan-id': {
          setScanId(response.payload);
          setTimestamp(Date.now());
          await new Promise((resolve) => setTimeout(resolve, 5000));
          break;
        }
        case 'issues': {
          setIssues((prevIssues) => [...response.payload, ...prevIssues]);
          break;
        }
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);
    interval = setInterval(() => {
      if (!isScanning) {
        clearInterval(interval);
        return;
      }
      if (timestamp) {
        setDuration((Date.now() - timestamp) / 1000);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isScanning, timestamp]);

  // useEffect(() => {
  //   let interval: NodeJS.Timeout | undefined;
  //   setLastUpdatedText?.(calculateTimeDiff(lastUpdated));
  //   setTimeUntilReload(
  //     parseInt(process.env.NEXT_PUBLIC_REVALIDATION_SECONDS ?? '600') -
  //       Math.floor((new Date().getTime() - lastUpdated) / 1000)
  //   );
  //   clearInterval(interval);
  //   interval = setInterval(() => {
  //     setLastUpdatedText?.(calculateTimeDiff(lastUpdated));
  //     setDisableRefresh(
  //       new Date().getTime() - lastUpdated <
  //         parseInt(process.env.NEXT_PUBLIC_REVALIDATION_SECONDS ?? '600') * 1000
  //     );
  //     setTimeUntilReload(
  //       parseInt(process.env.NEXT_PUBLIC_REVALIDATION_SECONDS ?? '600') -
  //         Math.floor((new Date().getTime() - lastUpdated) / 1000)
  //     );
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [lastUpdated, setLastUpdatedText]);

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  const formattedTime = `${hours ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const toggledIssues = issues.filter(
    (issue) => issue.severity.toLowerCase() === toggled
  );

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <Link to={'/'} title='To Overview'>
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
            Application Name {scanId}
          </label>
          <input
            onChange={(e) => setApplicationName(e.target.value)}
            value={applicationName}
            className='w-full'
            id='application'
          />
        </div>
        <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='target-name'
          >
            Target Name
          </label>
          <input
            onChange={(e) => setTargetName(e.target.value)}
            value={targetName}
            className='w-full'
            id='target-name'
          />
        </div>
        {/* <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='target-url'
          >
            Target URL
          </label>
          <input
            onChange={(e) => setTargetUrl(e.target.value)}
            value={targetUrl}
            className='w-full'
            id='target-url'
          />
        </div> */}
      </div>
      {/* <select name='cars' id='cars' className='h-8 w-full bg-neutral-800'>
        <option value='volvo'>Volvo</option>
        <option value='saab'>Saab</option>
        <option value='mercedes'>Mercedes</option>
        <option value='audi'>Audi</option>
      </select> */}
      <button
        onClick={handleScanClick}
        className='rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : isScanning ? 'Cancel' : 'Start Scan'}
      </button>

      <div
        className={`${(isScanning || scanId) && !isLoading ? 'visible' : 'invisible'}`}
      >
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
              className={`h-5 w-5 ${isScanning ? 'visible' : 'invisible'}`}
            >
              <circle
                cx='50'
                cy='50'
                fill='none'
                stroke='#ffffff'
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

            {isError && (
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

            <span className='ml-2 font-bold'>{formattedTime}</span>
          </div>
        </div>
        {/* <span>No issues</span> */}
        <div className='mt-4 grid auto-cols-min grid-cols-1 gap-3 min-[280px]:grid-cols-2'>
          {/* <div className='efore:-translate-x-1/4 efore:-translate-y-1/4 efore:rotate-45 relative flex justify-between overflow-hidden before:absolute before:-top-5 before:right-0 before:-z-10 before:h-20 before:w-[20px] before:bg-red-600'>
            <span>Critical</span>
            <span>12</span>
          </div> */}
          <IssueCard
            severity='critical'
            amount={
              issues.filter(
                (issue) => issue.severity.toLowerCase() === 'critical'
              ).length
            }
            toggled={toggled}
            setToggled={setToggled}
          />
          <IssueCard
            severity='high'
            amount={
              issues.filter((issue) => issue.severity.toLowerCase() === 'high')
                .length
            }
            toggled={toggled}
            setToggled={setToggled}
          />
          <IssueCard
            severity='medium'
            amount={
              issues.filter(
                (issue) => issue.severity.toLowerCase() === 'medium'
              ).length
            }
            toggled={toggled}
            setToggled={setToggled}
          />
          <IssueCard
            severity='low'
            amount={
              issues.filter((issue) => issue.severity.toLowerCase() === 'low')
                .length
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
        {/* <svg
          width='18'
          height='18'
          viewBox='0 0 18 14'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='mx-auto my-10 h-20 w-20'
        >
          <path
            d='M12.1804 3.82001C12.5987 4.23794 12.9307 4.73424 13.1571 5.28053C13.3836 5.82682 13.5001 6.41239 13.5001 7.00376C13.5001 7.59513 13.3836 8.1807 13.1571 8.72699C12.9307 9.27328 12.5987 9.76958 12.1804 10.1875M5.82035 10.18C5.40196 9.76208 5.07004 9.26578 4.84358 8.71949C4.61712 8.1732 4.50056 7.58763 4.50056 6.99626C4.50056 6.40489 4.61712 5.81932 4.84358 5.27303C5.07004 4.72674 5.40196 4.23044 5.82035 3.81251M14.3029 1.69751C15.7089 3.10397 16.4987 5.01128 16.4987 7.00001C16.4987 8.98874 15.7089 10.8961 14.3029 12.3025M3.69785 12.3025C2.29182 10.8961 1.50195 8.98874 1.50195 7.00001C1.50195 5.01128 2.29182 3.10397 3.69785 1.69751M10.5004 7.00001C10.5004 7.82844 9.82878 8.50001 9.00035 8.50001C8.17192 8.50001 7.50035 7.82844 7.50035 7.00001C7.50035 6.17158 8.17192 5.50001 9.00035 5.50001C9.82878 5.50001 10.5004 6.17158 10.5004 7.00001Z'
            stroke='white'
            stroke-width='1.5'
            stroke-linecap='round'
            stroke-linejoin='round'
          ></path>
        </svg> */}
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
      className={`fter:focus:bg-opacity-100 relative flex h-24 flex-col items-center justify-center bg-transparent px-4 py-2 before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] after:absolute after:inset-y-0 after:left-0 after:w-1.5 after:rounded-bl after:rounded-tl after:bg-opacity-0 hover:cursor-pointer hover:bg-transparent before:hover:brightness-75 ${isToggled ? 'before:brightness-75 after:bg-opacity-100' : ''} ${severityColor[severity]}`}
      onClick={() => {
        if (isToggled) {
          setToggled(null);
          return;
        }
        setToggled(severity);
      }}
      // onMouseUp={() => {
      //   if (isToggled) {
      //     setToggled(null);
      //   }
      // }}
    >
      <span className='text-3xl font-bold'>{amount}</span>
      <span className='text-center font-medium capitalize brightness-50'>
        {severity} Severity
      </span>
    </div>
  );
};

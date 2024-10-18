import { useUser } from '@hooks/useUser';
import { ScanType, Severity, normalizedSeverity } from '@types_/scan';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { messageHandler } from '@utils/MessageHandler';
import formatDuration from '@utils/formatDuration';
import { PageHeader } from '@components/PageHeader';
import { API_URL } from '@constants/GlobalConstants';
import { AbortModal, DeleteModal, IssueCard } from './components';
import { ErrorIcon, ExtraLinkIcon, LoadingIcon, StopIcon, TrashIcon } from './assets';

export const Scan = () => {
  const { scanId } = useParams();

  const { setIsLoggedIn } = useUser();

  const [scan, setScan] = useState<ScanType>();
  const [toggled, setToggled] = useState<Severity | null>(null);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [abortModalOpen, setAbortModalOpen] = useState(false);

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
          `${API_URL}/api/v1/scans/${scanId}`
        );

        const issues = (
          await messageHandler.api(
            'get',
            `${API_URL}/api/v1/issues/kind/?scan=${scanId}`
          )
        ).results;

        if (!ignore) {
          setScan({
            id: response.id,
            authentication: response.credentials,
            target: response.target,
            project: response.project,
            createdAt: new Date(response.created_at),
            endedAt: response.ended_at
              ? new Date(response.ended_at)
              : undefined,
            status: response.status_value,
            isScanning: response.status_value === 'RUNNING',
            disrupted: response.status_value === 'TIMED_OUT' || response.status_value === 'FAILED',
            aborted: response.status_value === 'ABORTED',
            vulnPathsStatistics: response.vulnerable_paths_statistics,
            issues: issues.map((issue: any) => ({
              kind_id: issue.kind_id,
              name: issue.kind_name,
              severity: normalizedSeverity(issue.severity),
            })),
          });
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
  }, [scanId, abortModalOpen]);

  return (
    <div className='flex flex-col space-y-4'>
      <PageHeader title='Scan' backTo='/scans'/>

      {!scan || isFetchingApi ? (
        <Loading />
      ) : (
        <>
          <div className='flex flex-col space-y-1'>
            <div>
              <Label htmlFor='target-name'>
                Target ({scan.target.type === 'URL' ? 'WEB' : 'API'})
              </Label>
              <select
                className='w-full bg-[--vscode-settings-dropdownBackground] px-0.5 py-1.5'
                disabled
              >
                <option>
                  {scan.target.name} ({scan.target.location})
                </option>
              </select>
            </div>
            <div>
              <Label htmlFor='target-name'>
                Project
              </Label>
              <select
                className='w-full bg-[--vscode-settings-dropdownBackground] px-0.5 py-1.5'
                disabled
              >
                <option>
                  {scan.project.name}
                </option>
              </select>
            </div>
            <div>
              <Label htmlFor='target-name'>Authentication</Label>
              <select
                className='w-full bg-[--vscode-settings-dropdownBackground] px-0.5 py-1.5'
                disabled
              >
                <option>{scan.authentication?.name ?? '-'}</option>
              </select>
            </div>
          </div>

          <div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <a
                  href={`https://app.nightvision.net/scans/${scanId}/findings`}
                  title='View in Browser'
                >
                  <ExtraLinkIcon />
                </a>
                <button
                  className='unstyled'
                  title='Delete Scan'
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <TrashIcon />
                </button>
                {scan.isScanning && (
                  <button
                    className='unstyled'
                    title='Abort Scan'
                    onClick={() => setAbortModalOpen(true)}
                  >
                    <StopIcon />
                  </button>
                )}
              </div>
              <div className='flex items-center'>
                {scan.isScanning && (
                 <LoadingIcon />
                )}
                {scan.disrupted && (
                  <ErrorIcon />
                )}
                {scan.aborted && (
                  <StopIcon color='#F07F23'/>
                )}
                <span className='ml-2 font-bold'>
                  {formatDuration(
                    (scan.endedAt
                      ? scan.endedAt.getTime()
                      : currentTime.getTime()) - scan.createdAt.getTime()
                  )}
                </span>
              </div>
            </div>
            <div className='mt-4 grid auto-cols-min grid-cols-1 gap-3 min-[280px]:grid-cols-2'>
              <IssueCard
                severity='Critical'
                amount={
                  scan?.vulnPathsStatistics?.Critical ?? 0
                }
                toggled={toggled}
                setToggled={setToggled}
              />
              <IssueCard
                severity='High'
                amount={
                  scan?.vulnPathsStatistics?.High ?? 0
                }
                toggled={toggled}
                setToggled={setToggled}
              />
              <IssueCard
                severity='Medium'
                amount={
                  scan?.vulnPathsStatistics?.Medium ?? 0
                }
                toggled={toggled}
                setToggled={setToggled}
              />
              <IssueCard
                severity='Low'
                amount={
                  scan?.vulnPathsStatistics?.Low ?? 0
                }
                toggled={toggled}
                setToggled={setToggled}
              />
            </div>
            {toggled && (
              <EditList
                list={toggledIssues}
                emptyText='No issues found!'
                handleClick={() => {}}
                renderItem={(listItem) => (
                  <a
                    href={`https://app.nightvision.net/scans/${scanId}/findings/${listItem.kind_id}`}
                    title='View in Browser'
                  >
                    <span className='block max-w-full truncate'>
                      {listItem.name}
                    </span>
                  </a>
                )}
              />
            )}
          </div>
        </>
      )}

      {deleteModalOpen && (
        <DeleteModal
          scanId={scanId}
          scan={scan}
          setDeleteModalOpen={setDeleteModalOpen}
        />
      )}

      {abortModalOpen && (
        <AbortModal
          scanId={scanId}
          scan={scan}
          setAbortModalOpen={setAbortModalOpen}
        />
      )}
    </div>
  );
};
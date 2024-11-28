import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Project } from '@types_/project';
import { ScanType, Severity, normalizedSeverity } from '@types_/scan';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loading } from '@components/Loading';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';
import { API_URL } from '@constants/GlobalConstants';
import useItemSelection from '@hooks/use-item-selection';
import { BulkDeleteModal, ScansTable } from './components';
import { ProjectDropdown } from '@components/project-dropdown';

const ALL_PROJECTS_FILTER_OPTION: Project = { id: "<Internal-All>", name: "All" };

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

const getIssues = async (
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  scanId: string
) => {
  try {
    const response = await messageHandler.api({
      method: 'get',
      url: `${API_URL}/api/v1/issues/kind/?scan=${scanId}`,
      setIsLoggedIn: setIsLoggedIn,
    });
    return response.results;
  } catch (err: any) {
    console.error(err);
    return [];
  }
};

const getScans = async (
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  page: number,
  project?: string,
) => {
  try {
    const projectFilter = project ? `&project=${project}` : '';
    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/scans/?order=-created_at&page=${page}${projectFilter}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    const nextPage = response.next && new URL(response.next).searchParams.get('page');
    const totalCount = response.count;

    const scansPromises: Promise<ScanType>[] = response.results.map(
      async (scan: any): Promise<ScanType> => {
        let vulnPathsStatistics = {};
        if (!scan.vulnerable_paths_statistics) {
          const issues = await getIssues(setIsLoggedIn, scan.id);
          vulnPathsStatistics = countIssues(issues);
        }

        return {
          id: scan.id,
          authentication: scan.credentials,
          target: scan.target,
          project: scan.project,
          createdAt: new Date(scan.created_at),
          endedAt: scan.ended_at ? new Date(scan.ended_at) : undefined,
          status: scan.status_value,
          isScanning: scan.status_value === 'RUNNING',
          disrupted: scan.status_value === 'TIMED_OUT' || scan.status_value === 'FAILED',
          aborted: scan.status_value === 'ABORTED',
          vulnPathsStatistics:
            scan.vulnerable_paths_statistics ?? vulnPathsStatistics,
          issues: [],
        };
      }
    );

    const scans = await Promise.all(scansPromises);
    return {
      scans: scans,
      nextPage: nextPage,
      totalCount: totalCount,
    };
  } catch (err: any) {
    console.error(err);
  }
  return {
    scans: [],
  };
};

export const Scans = () => {
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn } = useUser();
  const [scans, setScans] = useState<ScanType[]>();
  const [projectFilter, setProjectFilter] = useState<Project>(currentProject);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [scansLoading, setScansLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  useEffect(() => {
    setPage(1);
    if (projectFilter && projectFilter?.id !== ALL_PROJECTS_FILTER_OPTION.id) {
      setCurrentProject(projectFilter);
    }
  }, [projectFilter]);

  // Periodically get scans
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);

    const fetchApiWrapper = async () => {
      setScansLoading(true);
      await fetchApi();
      setScansLoading(false);
    };

    const fetchApi = async () => {
      const project = projectFilter.id === ALL_PROJECTS_FILTER_OPTION.id ? undefined : projectFilter.id;
      const res = await getScans(setIsLoggedIn, page, project);
      setScans(res?.scans);
      setTotalCount(res?.totalCount);
    };

    fetchApiWrapper();

    interval = setInterval(async () => {
      await fetchApi();
    }, 20000);

    return () => clearInterval(interval);
  }, [deleteModalOpen, page, projectFilter]);

  // Get issues for scans that are still running
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);

    interval = setInterval(async () => {
      for (const scan of scans ?? []) {
        if (!scan.isScanning) {
          return;
        }

        const issues = await getIssues(setIsLoggedIn, scan.id);

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
    }, 5000);

    return () => clearInterval(interval);
  }, [scans]);

  const itemSelectionApi = useItemSelection<ScanType>({
    data: scans?.length ? scans : [],
    keyBy: item => item?.id || '',
    labelBy: item => item?.target.name || '',
  });

  React.useEffect(() => {
    if (scans) {
      const selectedItems = new Map(itemSelectionApi.selectedItems);
      itemSelectionApi.reinitializeData(scans);

      itemSelectionApi.selectedItems.forEach((item) => {
        if (selectedItems.has(item.id) && !scans.find((issue) => issue.id === item.id)) {
          selectedItems.delete(item.id);
        }
      });
      itemSelectionApi.reinitialize(selectedItems);
    }
  }, [JSON.stringify(scans)]);

  return (
    <div className='flex flex-col space-y-4'>
      <PageHeader title='Scans' backTo='/' />

      <div className='grid grid-cols-1 gap-3 min-[480px]:grid-cols-2'>
        <Link
          to='/scans/new-scan/url'
          className='relative flex h-24 flex-col items-center justify-around overflow-hidden px-4 py-2 text-[--vscode-foreground] before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] hover:cursor-pointer hover:text-[--vscode-foreground] before:hover:brightness-75'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 16 16'
            fill='none'
            className='size-10'
          >
            <circle cx='8' cy='8' r='8' fill='white' />
            <path
              d='M14.6666 7.99967C14.6666 11.6816 11.6818 14.6663 7.99992 14.6663M14.6666 7.99967C14.6666 4.31778 11.6818 1.33301 7.99992 1.33301M14.6666 7.99967H1.33325M7.99992 14.6663C4.31802 14.6663 1.33325 11.6816 1.33325 7.99967M7.99992 14.6663C9.66744 12.8408 10.6151 10.4717 10.6666 7.99967C10.6151 5.5277 9.66744 3.15858 7.99992 1.33301M7.99992 14.6663C6.3324 12.8408 5.38475 10.4717 5.33325 7.99967C5.38475 5.5277 6.3324 3.15858 7.99992 1.33301M1.33325 7.99967C1.33325 4.31778 4.31802 1.33301 7.99992 1.33301'
              stroke='#0059C8'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
              transform='scale(0.95) translate(.4 .4)'
            />
          </svg>
          <div className='w-full truncate text-center'>
            Scan Web Applications
          </div>
        </Link>

        <Link
          to='/scans/new-scan/openapi'
          className='relative flex h-24 flex-col items-center justify-around overflow-hidden px-4 py-2 text-[--vscode-foreground] before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] hover:cursor-pointer hover:text-[--vscode-foreground] before:hover:brightness-75'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 32 32'
            fill='none'
            className='size-10'
          >
            <g clipPath='url(#clip0_4580_64227)'>
              <path
                d='M15.8825 31.9996C7.35633 31.9408 -0.0571342 24.8648 0.000331883 15.8748C0.0555812 7.22448 7.24396 -0.0586209 16.1388 0.000355694C24.7834 0.0577983 32.0766 7.23335 31.9994 16.0243C32.071 24.7354 24.7418 32.0611 15.8825 31.9996ZM15.8825 31.9996C7.35633 31.9408 -0.0571342 24.8648 0.000331883 15.8748C0.0555812 7.22448 7.24396 -0.0586209 16.1388 0.000355694C24.7834 0.0577983 32.0766 7.23335 31.9994 16.0243C32.071 24.7354 24.7418 32.0611 15.8825 31.9996Z'
                className='fill-white'
              />
              <path
                d='M15.8981 29.8747C8.50405 29.8237 2.07545 23.6873 2.12529 15.8914C2.17325 8.38982 8.40693 2.07396 16.1204 2.12531C23.6168 2.17513 29.9415 8.39782 29.8745 16.0212C29.9366 23.5753 23.5809 29.9281 15.8981 29.8747ZM15.8981 29.8747C8.50405 29.8237 2.07545 23.6873 2.12529 15.8914C2.17325 8.38982 8.40693 2.07396 16.1204 2.12531C23.6168 2.17513 29.9415 8.39782 29.8745 16.0212C29.9366 23.5753 23.5809 29.9281 15.8981 29.8747Z'
                fill='#49A32B'
              />
              <path
                d='M21.1659 15.9945C21.1303 16.6558 20.5526 17.2049 19.9833 17.1091C19.9806 17.1091 19.9777 17.1091 19.9748 17.1091C19.3441 17.1099 18.8323 16.5993 18.8316 15.9686C18.8531 15.3363 19.3775 14.8379 20.01 14.8486C20.6406 14.8517 21.2 15.3846 21.1659 15.9945ZM11.0251 22.4025C11.2629 22.4095 11.5009 22.4044 11.7751 22.4044V24.1276C10.0708 24.4158 8.66685 23.9319 8.32234 22.4912C8.20438 21.9615 8.13187 21.4226 8.10532 20.8805C8.06872 20.3065 8.13204 19.7261 8.0883 19.1532C7.96711 17.5766 7.76285 17.0384 6.25 16.9639V15.0018C6.35843 14.9765 6.46838 14.9578 6.57902 14.9453C7.40847 14.9045 7.75809 14.6502 7.94362 13.8332C8.02804 13.3741 8.07809 12.9094 8.09289 12.4429C8.1586 11.5407 8.13528 10.624 8.28557 9.73648C8.50277 8.45307 9.29953 7.82958 10.6156 7.7598C10.9901 7.73971 11.3657 7.75673 11.7901 7.75673V9.51809C11.6154 9.53052 11.4554 9.55588 11.2965 9.55112C10.224 9.51826 10.1685 9.88354 10.0902 10.7714C10.0413 11.3281 10.1087 11.8944 10.0708 12.4531C10.0311 13.009 9.95672 13.562 9.84813 14.1087C9.6934 14.9011 9.20626 15.4903 8.53119 15.9904C9.84166 16.8432 9.99077 18.1683 10.0759 19.5138C10.1217 20.2369 10.1007 20.9651 10.1741 21.6846C10.2313 22.243 10.4485 22.3855 11.0251 22.4025ZM12.1297 14.8486C12.1365 14.8486 12.1431 14.8486 12.1499 14.8486C12.7765 14.859 13.2762 15.3753 13.2658 16.002C13.2658 16.0226 13.2651 16.043 13.264 16.0635C13.2287 16.6759 12.7038 17.1436 12.0914 17.1084C12.0667 17.1089 12.0422 17.1084 12.0175 17.1072C11.3938 17.0762 10.9133 16.5455 10.9443 15.9218C10.9753 15.2982 11.506 14.8177 12.1297 14.8486ZM16.0342 14.8486C16.7194 14.8434 17.1746 15.2875 17.1782 15.9649C17.1819 16.6606 16.7504 17.1057 16.0696 17.1086C15.3771 17.1116 14.9213 16.6737 14.9176 16.0003C14.9155 15.9659 14.915 15.9315 14.916 15.8972C14.9353 15.2989 15.4359 14.8294 16.0342 14.8486ZM24.2091 13.9904C24.3914 14.6713 24.7463 14.9106 25.4631 14.9433C25.5806 14.9487 25.6975 14.9686 25.8585 14.9865V16.9481C25.7714 16.9766 25.682 16.9981 25.5913 17.0121C24.6308 17.0718 24.193 17.4658 24.096 18.4289C24.034 19.0437 24.0391 19.6653 23.9966 20.2824C23.9787 20.9598 23.9171 21.6354 23.812 22.3048C23.5669 23.5178 22.8097 24.1229 21.5584 24.1967C21.1557 24.2206 20.7501 24.2005 20.3159 24.2005V22.4473C20.5496 22.4328 20.7559 22.4129 20.9627 22.408C21.7103 22.3901 21.9746 22.1491 22.0112 21.4066C22.0517 20.5909 22.0694 19.7743 22.1058 18.9584C22.1588 17.7792 22.4817 16.7258 23.5802 15.9903C22.9516 15.5421 22.4469 14.9993 22.3162 14.2674C22.1581 13.3802 22.107 12.4735 22.0219 11.5739C21.9799 11.1242 21.9819 10.6706 21.938 10.2212C21.8907 9.73614 21.5574 9.56831 21.1159 9.55741C20.8629 9.55129 20.609 9.55622 20.2856 9.55622V7.84422C22.3492 7.50158 23.7748 8.18822 23.9072 10.1627C23.9627 10.9918 23.9545 11.8248 24.0076 12.6539C24.0309 13.105 24.0983 13.5526 24.2091 13.9904Z'
                className='fill-white'
              />
            </g>
          </svg>
          <div className='w-full truncate text-center'>Scan APIs</div>
        </Link>
      </div>

      <div className='!mb-2 !mt-6 flex items-end justify-between'>
        <h2 className='truncate text-sm uppercase'>Previous Scans</h2>
        <div className='w-[calc(50%-.375rem)]'>
          <ProjectDropdown
            project={projectFilter}
            onProjectChange={setProjectFilter}
            includeAllOption
          />
        </div>
      </div>

      {scansLoading ? (
        <Loading />
      ) : (
        scans?.length ? (
          <ScansTable
            scans={scans}
            itemSelectionApi={itemSelectionApi}
            page={page}
            setPage={setPage}
            totalScansCount={totalCount}
            setDeleteModalOpen={setDeleteModalOpen}
          />
        ) : (
          <span className='!mt-10 w-full text-center'>No scans found</span>
        )
      )}

      {deleteModalOpen && (
        <BulkDeleteModal
          scans={Array.from(itemSelectionApi.selectedItems.values()).map(scan => scan.id)}
          setDeleteModalOpen={setDeleteModalOpen}
        />
      )}
    </div>
  );
};
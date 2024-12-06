import React from 'react';
import { Checkbox } from '@components/checkbox';
import { Pagination } from '@components/pagination';
import { ItemSelectionApi } from '@hooks/use-item-selection';
import { TrashIcon } from '@pages/scan/assets';
import { ScanType } from '@types_/scan';
import { Link } from 'react-router-dom';
import { formatDuration } from '@utils/globalUtils';

interface ScansTableProps {
  scans: ScanType[];
  itemSelectionApi: ItemSelectionApi<ScanType>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalScansCount: number;
  setDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ScansTable: React.FC<ScansTableProps> = ({
  scans,
  itemSelectionApi,
  page,
  setPage,
  totalScansCount,
  setDeleteModalOpen,
}) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);
    interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 500);

    return () => clearInterval(interval);
  }, [currentTime]);

  return (
    <div className='!mt-1'>
      <div className='grid gap-3' style={{ gridTemplateColumns: '4rem repeat(3, minmax(0, 1fr))' }} >
        {/* Table Headers */}
        <div className='font-bold uppercase flex justify-start items-center px-4 gap-1 pl-4'>
          <Checkbox
            checked={itemSelectionApi.isAllSelected}
            onChange={() => itemSelectionApi.onToggleAll()}
            indeterminate={itemSelectionApi.isPartiallySelected}
          />
          <button
            className='unstyled'
            title='Delete Selected Scans'
            disabled={!itemSelectionApi.selectedItems.size}
            onClick={() => setDeleteModalOpen(true)}
          >
            <TrashIcon color={!itemSelectionApi.selectedItems.size ? '#5A657C' : undefined} />
          </button>
        </div>
        <div className='font-bold uppercase flex justify-start items-center'>Target</div>
        <div className='flex font-bold uppercase flex justify-start items-center'>Project</div>
        <div className='font-bold uppercase flex justify-start items-center'>
          <span className='block s-400px:hidden'>Vuln.</span>
          <span className='hidden s-400px:block'>Vulnerabilities</span>
        </div>
      </div>

      {scans.map((scan) => (
        <Link
          to={`/scans/${scan.id}`}
          key={scan.id}
          className='!mt-2 relative flex h-24 flex-col justify-center items-center overflow-hidden px-4 py-2 text-[--vscode-foreground] before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] hover:cursor-pointer hover:text-[--vscode-foreground] before:hover:brightness-75'
        >
          <div className='grid gap-3 w-full h-full' style={{ gridTemplateColumns: '3rem repeat(3, minmax(0, 1fr))' }}>
            {/* Checkbox Column */}
            <div className='truncate flex flex-col justify-center'>
              <div className='flex w-fit' onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={itemSelectionApi.selectedItems.has(scan.id)}
                  onChange={() => itemSelectionApi?.onToggleItem(scan)}
                />
              </div>
            </div>

            {/* Target Column */}
            <div className='truncate flex flex-col justify-center'>
              <span className='truncate font-bold'>
                {scan.target?.name ?? '-'}
              </span>
              <div className='flex items-center mt-1'>
                {scan.isScanning ? (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 100 100'
                    className='mr-2 h-5 w-5 animate-spin stroke-[--vscode-foreground]'
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
                ) : scan.disrupted ? (
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 16 16'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='currentColor'
                    className='mr-2 h-5 w-5 stroke-red-600'
                  >
                    <path
                      fillRule='evenodd'
                      clipRule='evenodd'
                      d='M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.7L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z'
                    />
                  </svg>
                ) : scan.aborted && (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='18'
                    height='18'
                    viewBox='0 0 256 256'
                    fill='#F07F23'
                    className={`mt-0 mr-2 fill-#F07F23`}
                  >
                    <path d='M176,128a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,128Zm56,0A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z'></path>
                  </svg>
                )}
                <span className='text-sm font-bold'>
                  {formatDuration(
                    (scan.endedAt ? scan.endedAt.getTime() : currentTime.getTime()) - scan.createdAt.getTime()
                  )}
                </span>
              </div>
            </div>

            {/* Project Column */}
            <div className='flex truncate flex flex-col justify-center items-center'>
              <span className='truncate font-bold'>
                {scan.project?.name ?? '-'}
              </span>
            </div>

            {/* Vulnerabilities Column */}
            <div className='flex flex-wrap space-x-3 justify-center'>
              {!!scan.vulnPathsStatistics?.Critical && (
                <div className='flex items-center space-x-0.5'>
                  <div className='mt-0.5 h-2 w-2 rounded-full bg-red-600' />
                  <span>{scan.vulnPathsStatistics.Critical}</span>
                </div>
              )}
              {!!scan.vulnPathsStatistics?.High && (
                <div className='flex items-center space-x-0.5'>
                  <div className='mt-0.5 h-2 w-2 rounded-full bg-orange-600' />
                  <span>{scan.vulnPathsStatistics.High}</span>
                </div>
              )}
              {!!scan.vulnPathsStatistics?.Medium && (
                <div className='flex items-center space-x-0.5'>
                  <div className='mt-0.5 h-2 w-2 rounded-full bg-yellow-600' />
                  <span>{scan.vulnPathsStatistics.Medium}</span>
                </div>
              )}
              {!!scan.vulnPathsStatistics?.Low && (
                <div className='flex items-center space-x-0.5'>
                  <div className='mt-0.5 h-2 w-2 rounded-full bg-green-600' />
                  <span>{scan.vulnPathsStatistics.Low}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
      <Pagination
        page={page}
        setPage={setPage}
        totalCount={totalScansCount}
      />
    </div>
  );
};
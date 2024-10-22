import { useUser } from '@hooks/useUser';
import { ScanType } from '@types_/scan';
import React from 'react';
import { messageHandler } from '@utils/MessageHandler';
import { ConfirmationModal } from '@components/ConfirmationModal';
import { API_URL } from '@constants/GlobalConstants';

interface BulkDeleteProps {
  scans?: string[];
  setDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BulkDeleteModal: React.FC<BulkDeleteProps> = ({
  scans,
  setDeleteModalOpen,
}) => {
  const [scanDeleteInProgress, setScanDeleteInProgress] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  const { setIsLoggedIn } = useUser();

  const onDeleteScan = async () => {
    try {
      setScanDeleteInProgress(true);
      await messageHandler.api(
        'POST',
        `${API_URL}/api/v1/scans/drop/`,
        { ids: scans }
      );
      setDeleteModalOpen(false);
    }
    catch (error: any) {
      const err = JSON.parse(error);
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
              break;
            }
            default: {
              setDeleteError(`Failed to delete selected Scans`);
            }
          }
        }
      } else {
        console.error(err);
      }
    }
    finally {
      setScanDeleteInProgress(false);
    }
  };

  const body = React.useMemo(() => (
    <>
      <p className='overflow-hidden'>
        {`Are you sure you want to delete ${scans?.length} selected scans from your account?`}
      </p>
      <p>This action is irreversible.</p>
      {deleteError && (
        <ul className='list-disc'>
          <li className='font-semibold text-red-600'>
            {deleteError}
          </li>
        </ul>
      )}
    </>
  ), [JSON.stringify(scans), deleteError]);

  return (
    <ConfirmationModal
      onClose={() => setDeleteModalOpen(false)}
      title={'Delete selected Scans?'}
      body={body}
      action={onDeleteScan}
      buttonText={scanDeleteInProgress ? 'Deleteing...' : 'Delete'}
      isSubmitting={scanDeleteInProgress}
    />
  );
};
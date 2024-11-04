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
      await messageHandler.api({
        method: 'POST',
        url: `${API_URL}/api/v1/scans/drop/`,
        body: { ids: scans },
        setIsLoggedIn: setIsLoggedIn,
    });
      setDeleteModalOpen(false);
    }
    catch (error: any) {
      setDeleteError(`Failed to delete selected Scans`);
      console.error(error);
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
      buttonText={scanDeleteInProgress ? 'Deleting...' : 'Delete'}
      isSubmitting={scanDeleteInProgress}
    />
  );
};
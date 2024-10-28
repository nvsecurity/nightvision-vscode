import { useUser } from '@hooks/useUser';
import { ScanType } from '@types_/scan';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { messageHandler } from '@utils/MessageHandler';
import { ConfirmationModal } from '@components/ConfirmationModal';
import { API_URL } from '@constants/GlobalConstants';

interface DeleteModalProps {
  scanId?: string;
  scan?: ScanType;
  setDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  scanId,
  scan,
  setDeleteModalOpen,
}) => {
  const [scanDeleteInProgress, setScanDeleteInProgress] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  const { setIsLoggedIn } = useUser();
  const navigate = useNavigate();

  const onDeleteScan = async () => {
    try {
      setScanDeleteInProgress(true);
      await messageHandler.api({
        method: 'delete',
        url: `${API_URL}/api/v1/scans/${scanId}`,
        setIsLoggedIn: setIsLoggedIn,
      });
      setDeleteModalOpen(false);
      navigate(-1);
    }
    catch (error: any) {
      setDeleteError(`Failed to delete ${scan?.target.name} Scan`);
      console.error(error);
    }
    finally {
      setScanDeleteInProgress(false);
    }
  };

  const body = React.useMemo(() => (
    <>
      <p className='overflow-hidden'>
        Are you sure you want to delete this Scan of <strong>{scan?.target.name}</strong>{' '}
        from your account?
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
  ), [scan, deleteError]);

  return (
    <ConfirmationModal
      onClose={() => setDeleteModalOpen(false)}
      title={'Delete Scan?'}
      body={body}
      action={onDeleteScan}
      buttonText={scanDeleteInProgress ? 'Deleting...' : 'Delete'}
      isSubmitting={scanDeleteInProgress}
    />
  );
};
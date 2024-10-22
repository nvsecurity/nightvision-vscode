import { useUser } from '@hooks/useUser';
import { ScanType } from '@types_/scan';
import React from 'react';
import { messageHandler } from '@utils/MessageHandler';
import { ConfirmationModal } from '@components/ConfirmationModal';
import { API_URL } from '@constants/GlobalConstants';

interface AbortModalProps {
  scanId?: string;
  scan?: ScanType;
  setAbortModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AbortModal: React.FC<AbortModalProps> = ({
  scanId,
  scan,
  setAbortModalOpen,
}) => {
  const [scanAbortInProgress, setScanAbortInProgress] = React.useState(false);
  const [abortError, setAbortError] = React.useState('');

  const { setIsLoggedIn } = useUser();

  const onAbortScan = async () => {
    try {
      setScanAbortInProgress(true);
      await messageHandler.api(
        'POST',
        `${API_URL}/api/v1/scans/${scanId}/kill/`,
      );
      setAbortModalOpen(false);
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
            case 'not_found': {
              setAbortError(`Failed to abort ${scan?.target.name} Scan`);
            }
          }
        }
      } else {
        console.error(err);
      }
    }
    finally {
      setScanAbortInProgress(false);
    }
  };

  const body = React.useMemo(() => (
    <>
      <p className='overflow-hidden'>
        Are you sure you want to abort this Scan of <strong>{scan?.target.name}</strong>{' '}
        from your account?
      </p>
      <p>This action is irreversible.</p>
      {abortError && (
        <ul className='list-disc'>
          <li className='font-semibold text-red-600'>
            {abortError}
          </li>
        </ul>
      )}
    </>
  ), [scan, abortError]);

  return (
    <ConfirmationModal
      onClose={() => setAbortModalOpen(false)}
      title={'Abort Scan?'}
      body={body}
      action={onAbortScan}
      buttonText={scanAbortInProgress ? 'Aborting...' : 'Abort'}
      isSubmitting={scanAbortInProgress}
    />
  );
};
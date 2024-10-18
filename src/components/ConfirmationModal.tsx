import React from "react";
import useClickOutside from "@hooks/useClickOutside";
import { Modal } from "./Modal";
import { SecondaryButton } from "./SecondaryButton";

interface ConfirmationModalProps {
  onClose: () => void;
  title: string;
  body: React.ReactElement;
  isSubmitting?: boolean;
  action: () => void;
  buttonText: string;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onClose,
  title,
  body,
  isSubmitting,
  action,
  buttonText,
}) => {
  const {
    componentRef,
    showComponent,
    setShowComponent,
  } = useClickOutside(true);

  React.useEffect(() => {
    if (!showComponent) {
      onClose();
    }
  }, [showComponent]);

  const onCloseModal = () => {
    setShowComponent(false);
    onClose();
  };

  return (
    <Modal componentRef={componentRef}>
      <div className='flex flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='truncate font-bold uppercase'>
            {title}
          </span>
          <button
            className='unstyled'
            title='Close'
            onClick={onCloseModal}
          >
            <svg
              viewBox='0 0 16 16'
              xmlns='http://www.w3.org/2000/svg'
              fill='currentColor'
              className='h-6 w-6 fill-[--vscode-foreground]'
            >
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z'
              />
            </svg>
          </button>
        </div>

        {body}

        <div className='flex space-x-2'>
          <SecondaryButton
            onClick={onCloseModal}
            disabled={isSubmitting}
          >
            Cancel
          </SecondaryButton>
          <button
            onClick={() => action()}
            disabled={isSubmitting}
            className='truncate rounded bg-red-500 hover:bg-red-500 hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-75 hover:disabled:brightness-100'
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
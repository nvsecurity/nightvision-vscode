import React, { useState } from 'react';
import { CLI_INSTALL } from '@commands/CommandConstants';
import { messageHandler } from '@utils/MessageHandler';

export const InstallButton = ({
  installText,
  installingText,
  setIsCliInstalled,
}: {
  installText: string;
  installingText: string;
  setIsCliInstalled: (val: boolean) => void;
}) => {
  const [isInstalling, setIsInstalling] = useState(false);

  return (
    <button
      className='mt-4 truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
      disabled={isInstalling}
      onClick={async () => {
        setIsInstalling(true);
        try {
          await messageHandler.request(CLI_INSTALL);
          setIsCliInstalled(true);
        } catch (err) {
          console.error(err);
        }
        setIsInstalling(false);
      }}
    >
      {isInstalling ? installingText : installText}
    </button>
  );
};

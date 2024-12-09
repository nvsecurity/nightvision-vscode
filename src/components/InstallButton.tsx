import { v4 } from 'uuid';
import React, { useState } from 'react';
import { CLI_INSTALL, CLI_INSTALL_FAILED } from '@commands/CommandConstants';
import { messageHandler } from '@utils/MessageHandler';

export const InstallButton = ({
  installText,
  installingText,
  cliVersion,
  isUpdateCLI,
  setIsCliInstalled,
}: {
  installText: string;
  installingText: string;
  cliVersion?: string;
  isUpdateCLI: boolean;
  setIsCliInstalled: (val: boolean) => void;
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installFailed, setInstallFailed] = useState(false);

  const handleCliInstall = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setIsInstalling(true);
    setInstallFailed(false);

    const requestGenerator = messageHandler.requestGenerator(CLI_INSTALL, v4(),
      {
        isUpdateCLI: isUpdateCLI,
      });

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CLI_INSTALL: {
            setIsCliInstalled(true);
            break;
          }
          case CLI_INSTALL_FAILED: {
            setInstallFailed(true);
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }

    setIsInstalling(false);
  };

  return (
    <>
      <button
        className='mt-4 truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
        disabled={isInstalling}
        onClick={handleCliInstall}
      >
        {isInstalling ? installingText : installText}
      </button>

      {(installingText === 'Updating...' || installFailed) && (
        <ul className='mt-4 list-disc'>
          {installingText === 'Updating...' && (
            <li className='font-semibold text-red-600'>
              <span>
                You have version {cliVersion} of the NightVison CLI, but the
                plugin requires version {process.env.CLI_VERSION} to be fully
                operational.
              </span>
            </li>
          )}
          {installFailed && (
            <li className='font-semibold text-red-600'>
              <span>
                Failed to install the NightVision CLI. You can manually install
                by following the{' '}
                <a href='https://docs.nightvision.net/docs/installing-the-cli'>
                  installation
                </a>{' '}
                steps.
              </span>
            </li>
          )}
        </ul>
      )}
    </>
  );
};

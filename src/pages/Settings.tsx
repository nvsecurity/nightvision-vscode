import { useUser } from '@hooks/useUser';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGOUT } from '@commands/CommandConstants';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';

export const Settings = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useUser();

  const [isLoggingOut, setIsLogginOut] = useState(false);

  const handleLogOut = async () => {
    setIsLogginOut(true);

    const requestGenerator = messageHandler.requestGenerator(LOGOUT);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case LOGOUT: {
            navigate('/');
            setIsLoggedIn(false);
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }

    setIsLogginOut(false);
  };

  return (
    <div className='flex flex-col space-y-4'>
      <PageHeader title='Settings'/>

      <button
        onClick={handleLogOut}
        className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
        disabled={isLoggingOut}
      >
        {isLoggingOut ? 'Logging out...' : 'Log Out'}
      </button>
    </div>
  );
};

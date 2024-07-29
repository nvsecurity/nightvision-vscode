import { useUser } from '@hooks/useUser';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOGOUT } from '@commands/CommandConstants';
import { ReloadButton } from '@components/ReloadButton';
import { messageHandler } from '@utils/MessageHandler';

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
          case LOGOUT:
            navigate('/');
            setIsLoggedIn(false);
            break;
        }
      }
    } catch (err) {
      console.error(err);
    }

    setIsLogginOut(false);
  };

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <a
          onClick={() => navigate(-1)}
          className='hover:cursor-pointer'
          href='#'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            xmlns='http://www.w3.org/2000/svg'
            fill='currentColor'
            className='h-5 w-5'
          >
            <path
              fillRule='evenodd'
              clipRule='evenodd'
              d='M7 3.093l-5 5V8.8l5 5 .707-.707-4.146-4.147H14v-1H3.56L7.708 3.8 7 3.093z'
            />
          </svg>
        </a>
        <h1 className='truncate font-bold uppercase'>Settings</h1>
        <ReloadButton />
      </div>

      <button
        onClick={handleLogOut}
        className='truncate rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
        disabled={isLoggingOut}
      >
        {isLoggingOut ? 'Logging out...' : 'Log Out'}
      </button>
    </div>
  );
};

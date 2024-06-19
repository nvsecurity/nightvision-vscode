import { useApps } from '@hooks/useApps';
import { v4 } from 'uuid';
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageHandler } from '@utils/MessageHandler';

export const Application = () => {
  const navigate = useNavigate();
  const { apps, setApps } = useApps();

  const [applicationName, setApplicationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateApp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator(
      'create-app',
      reqId,
      {
        applicationName,
      }
    );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case 'created-app':
            setApps((prevState) => [response.payload, ...prevState]);
            break;
          case 'invalid-app-name': {
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
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
        <h1 className='font-bold uppercase'>Application</h1>
      </div>
      <div className='flex flex-col space-y-1'>
        <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='application'
          >
            Application Name
          </label>

          <input
            onChange={(e) => setApplicationName(e.target.value)}
            value={applicationName}
            className='w-full'
            id='application'
          />
        </div>
      </div>
      <button
        onClick={handleCreateApp}
        className='rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
        disabled={isLoading}
      >
        {isLoading ? 'Creating...' : 'Create Application'}
      </button>

      <ul className='mt-4 pl-0'>
        {apps.map((app) => {
          return <li key={app}>{app}</li>;
        })}
      </ul>
    </div>
  );
};

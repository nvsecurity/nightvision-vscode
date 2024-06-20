import { useTarget } from '@hooks/useTarget';
import { useUser } from '@hooks/useUser';
import { v4 } from 'uuid';
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CREATE_TARGET,
  DUPLICATE_TARGET,
  INVALID_TARGET_NAME,
  INVALID_URL,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { messageHandler } from '@utils/MessageHandler';

export const Target = () => {
  const navigate = useNavigate();
  const { targets, setTargetNames, setTargetUrls } = useTarget();
  const { setIsLoggedIn } = useUser();

  console.log(targets);
  const [targetName, setTargetName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateApp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator(
      CREATE_TARGET,
      reqId,
      {
        targetName,
        targetUrl,
      }
    );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_TARGET:
            setTargetNames((prevState) => [
              ...prevState,
              response.payload.targetName,
            ]);
            setTargetUrls((prevState) => [
              ...prevState,
              response.payload.targetName,
            ]);
            break;
          case DUPLICATE_TARGET: {
            // TODO
            console.log(DUPLICATE_TARGET);
            break;
          }
          case INVALID_TARGET_NAME: {
            // TODO
            console.log(INVALID_TARGET_NAME);
            break;
          }
          case INVALID_URL: {
            // TODO
            console.log(INVALID_URL);
            break;
          }
          case UNAUTHORIZED_ACCESS:
            setIsLoggedIn(false);
            break;
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
        <h1 className='font-bold uppercase'>Target</h1>
      </div>
      <div className='flex flex-col space-y-1'>
        <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='target-name'
          >
            Target Name
          </label>

          <input
            onChange={(e) => setTargetName(e.target.value)}
            value={targetName}
            className='w-full'
            id='target-name'
          />
        </div>
        <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='target-url'
          >
            Target URL
          </label>

          <input
            onChange={(e) => setTargetUrl(e.target.value)}
            value={targetUrl}
            className='w-full'
            id='target-url'
          />
        </div>
      </div>
      <button
        onClick={handleCreateApp}
        className='rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
        disabled={isLoading}
      >
        {isLoading ? 'Creating...' : 'Create Target'}
      </button>

      <ul className='mt-4 pl-0'>
        {targets.map((target) => {
          return <li key={target.name}>{target.name}</li>;
        })}
      </ul>
    </div>
  );
};

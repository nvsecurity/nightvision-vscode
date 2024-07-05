import { Target } from '@contexts/TargetContext';
import useClickOutside from '@hooks/useClickOutside';
import { useTarget } from '@hooks/useTarget';
import { useUser } from '@hooks/useUser';
import { v4 } from 'uuid';
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CREATE_TARGET,
  DELETE_TARGET,
  DUPLICATE_TARGET,
  INVALID_NAME,
  INVALID_TARGET,
  INVALID_URL,
  INVALID_UUID,
  UNAUTHORIZED_ACCESS,
  UPDATE_TARGET,
} from '@commands/CommandConstants';
import { EditList } from '@components/EditList';
import { Modal } from '@components/Modal';
import { messageHandler } from '@utils/MessageHandler';

export const Targets = () => {
  const navigate = useNavigate();
  const { targets, setTargets } = useTarget();
  const { setIsLoggedIn } = useUser();

  const {
    componentRef: updateRef,
    showComponent: showUpdateModal,
    setShowComponent: setShowUpdateModal,
  } = useClickOutside();
  const {
    componentRef: deleteRef,
    showComponent: showDeleteModal,
    setShowComponent: setShowDeleteModal,
  } = useClickOutside();

  const [targetName, setTargetName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedTarget, setSelectedTarget] = useState<Target>();
  const [updateValues, setUpdateValues] = useState<{
    name: string;
    url: string;
  }>({ name: '', url: '' });
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setIsUpdateLoading(true);

    const requestGenerator = messageHandler.requestGenerator(
      UPDATE_TARGET,
      v4(),
      {
        id: selectedTarget?.id,
        name: updateValues.name,
        url: updateValues.url,
      }
    );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case UPDATE_TARGET: {
            setTargets((prevState) =>
              prevState.map((target) =>
                target.id === selectedTarget?.id
                  ? {
                      ...target,
                      name: response.payload.name,
                      url: response.payload.url,
                    }
                  : target
              )
            );
            setSelectedTarget(response.payload as Target);
            break;
          }
          case INVALID_TARGET: {
            // TODO
            console.log(INVALID_TARGET);
            break;
          }
          case INVALID_NAME: {
            // TODO
            console.log(INVALID_NAME);
            break;
          }
          case INVALID_UUID: {
            // TODO
            console.log(INVALID_UUID);
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
    setIsUpdateLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setIsDeleteLoading(true);

    const requestGenerator = messageHandler.requestGenerator(
      DELETE_TARGET,
      v4(),
      {
        id: selectedTarget?.id,
      }
    );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case DELETE_TARGET: {
            setTargets((prevState) =>
              prevState.filter((target) => target.id !== response.payload.id)
            );
            setShowDeleteModal(false);
            setShowUpdateModal(false);
            break;
          }
          case INVALID_TARGET: {
            // TODO
            console.log(INVALID_TARGET);
            break;
          }
          case INVALID_UUID: {
            // TODO
            console.log(INVALID_UUID);
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
    setIsDeleteLoading(false);
  };

  const handleCreateTarget = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
          case CREATE_TARGET: {
            setTargets((prevState) => [response.payload, ...prevState]);
            break;
          }
          case DUPLICATE_TARGET: {
            // TODO
            console.log(DUPLICATE_TARGET);
            break;
          }
          case INVALID_NAME: {
            // TODO
            console.log(INVALID_NAME);
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
    <>
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
          onClick={handleCreateTarget}
          className='rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Target'}
        </button>

        <EditList
          list={targets}
          handleClick={(listItem) => {
            setShowUpdateModal((prevState) => !prevState);
            setUpdateValues({ name: listItem.name, url: listItem.url });
            setSelectedTarget(listItem);
          }}
        />
      </div>
      {showUpdateModal && (
        <Modal componentRef={updateRef} visible={!showDeleteModal}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='font-bold uppercase'>Update Target</span>
              <div className='flex items-center justify-center space-x-2'>
                <button
                  className='unstyled'
                  onClick={() => setShowDeleteModal(true)}
                >
                  <svg
                    viewBox='0 0 16 16'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='currentColor'
                    className='mt-0.5 h-5 w-5 fill-[--vscode-foreground]'
                  >
                    <path
                      fillRule='evenodd'
                      clipRule='evenodd'
                      d='M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z'
                    />
                  </svg>
                </button>
                <button
                  className='unstyled'
                  onClick={() => setShowUpdateModal(false)}
                >
                  <svg
                    viewBox='0 0 16 16'
                    xmlns='http://www.w3.org/2000/svg'
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
            </div>
            <div>
              <label
                className='mb-1 text-sm uppercase opacity-50'
                htmlFor='target-name'
              >
                Target Name
              </label>
              <input
                onChange={(e) =>
                  setUpdateValues((prevState) => ({
                    ...prevState,
                    name: e.target.value,
                  }))
                }
                value={updateValues.name}
                className='w-full'
                id='target-name'
              />
            </div>
            <div>
              <label
                className='mb-1 text-sm uppercase opacity-50'
                htmlFor='target-url'
              >
                Target Url
              </label>
              <input
                onChange={(e) =>
                  setUpdateValues((prevState) => ({
                    ...prevState,
                    url: e.target.value,
                  }))
                }
                value={updateValues.url}
                className='w-full'
                id='target-url'
              />
            </div>
            <button
              onClick={handleUpdate}
              disabled={isUpdateLoading}
              className='rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
            >
              {isUpdateLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
          {showDeleteModal && (
            <Modal componentRef={deleteRef}>
              <div className='flex flex-col space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='font-bold uppercase'>Delete Target</span>
                  <button
                    className='unstyled'
                    onClick={() => setShowDeleteModal(false)}
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
                <p>
                  Are you sure you want to delete{' '}
                  <strong>{selectedTarget?.name}</strong> from your account?
                </p>
                <p>This action is irreversible.</p>

                <div className='flex space-x-2'>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className='rounded bg-neutral-800 hover:bg-neutral-800 hover:brightness-90  hover:disabled:cursor-default hover:disabled:brightness-100'
                    disabled={isDeleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleteLoading}
                    className='rounded bg-red-500 hover:bg-red-500 hover:brightness-90 disabled:bg-neutral-800 hover:disabled:cursor-default hover:disabled:brightness-100'
                  >
                    {isDeleteLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </Modal>
      )}
    </>
  );
};

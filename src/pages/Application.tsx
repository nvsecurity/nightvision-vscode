import useClickOutside from '@hooks/useClickOutside';
import { useUser } from '@hooks/useUser';
import { AppInfo } from '@types_/app';
import { useDebounce } from 'use-debounce';
import { v4 } from 'uuid';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DELETE_APP,
  DUPLICATE_NAME,
  INVALID_APP,
  INVALID_APP_DELETE,
  INVALID_NAME,
  INVALID_UUID,
  UNAUTHORIZED_ACCESS,
  UPDATE_APP,
} from '@commands/CommandConstants';
import { DeleteAppParams } from '@commands/DeleteApp';
import { UpdateAppParams } from '@commands/UpdateApp';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { ReloadButton } from '@components/ReloadButton';
import { SecondaryButton } from '@components/SecondaryButton';
import { TextInput } from '@components/TextInput';
import { messageHandler } from '@utils/MessageHandler';

export const getApp = async (
  setApp: React.Dispatch<React.SetStateAction<AppInfo | undefined>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  appId: string | undefined,
  ignore: boolean = false
) => {
  try {
    const app = await messageHandler.api(
      'get',
      `https://api.nightvision.net/api/v1/applications/${appId}/`
    );

    const results = (
      await messageHandler.api(
        'get',
        `https://api.nightvision.net/api/v1/applications/?filter=${app.name}&project=${app.project}`
      )
    ).results;

    const result = results.filter(
      (result: { id: string }) => app.id === result.id
    )?.[0];

    if (ignore) {
      return;
    }

    setApp({
      id: app.id,
      name: app.name,
      projectId: app.project,
      projectName: app.project_name,
      createdAt: new Date(app.created_at),
      lastScanEndedAt: result?.last_scan_ended_at
        ? new Date(result?.last_scan_ended_at)
        : null,
      lastUpdatedAt: app.last_updated_at ? new Date(app.last_updated_at) : null,
    });
  } catch (err: any) {
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
          }
        }
      }
    } else {
      console.error(err);
    }
  }
};

export const ApplicationPage = () => {
  const { appId } = useParams();

  const navigate = useNavigate();
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

  const [app, setApp] = useState<AppInfo>();

  const [_updateName, setUpdateName] = useState('');
  const [updateName] = useDebounce(_updateName, 500);

  const [applicationNameErrors, setApplicationNameErrors] = useState<string[]>(
    []
  );
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);

  const [isValidatingInput, setIsValidatingInput] = useState(true);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [isAppIdCopied, setIsAppIdCopied] = useState(false);
  const appIdCopyTimer = useRef<NodeJS.Timeout>();

  const hasEmptyRequiredInputs = !updateName;
  const hasErrors = applicationNameErrors.length > 0;
  const hasChanges = updateName !== app?.name;

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getApp(setApp, setIsLoggedIn, appId, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [appId]);

  useEffect(() => {
    setUpdateName(app?.name ?? '');

    setApplicationNameErrors([]);
    setDeleteErrors([]);
  }, [app, showUpdateModal]);

  useEffect(() => {
    setIsValidatingInput(true);
  }, [_updateName]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!updateName) {
      errors.push('Name is required');
    }

    if (updateName.length > 100) {
      errors.push('Name must be at most 100 characters');
    }

    if (/[^\w_-]/.test(updateName)) {
      errors.push(
        "Only characters 'A-Z', 'a-z', '0-9', '-', and '_' are allowed"
      );
    }

    setApplicationNameErrors(errors);
    setIsValidatingInput(false);
  }, [updateName]);

  const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!appId) {
      return;
    }

    setIsUpdateLoading(true);

    const requestGenerator = messageHandler.requestGenerator<UpdateAppParams>(
      UPDATE_APP,
      v4(),
      {
        appId: appId,
        newAppName: updateName,
      }
    );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case UPDATE_APP: {
            await getApp(setApp, setIsLoggedIn, appId);
            setShowUpdateModal(false);
            break;
          }
          case INVALID_APP:
          case INVALID_UUID: {
            navigate(-1);
            break;
          }
          case INVALID_NAME: {
            setApplicationNameErrors((prevState) => [
              ...prevState,
              "Name should have a max length of 100 and should have characters 'A-Z', 'a-z', '0-9', '-', and '_' only",
            ]);
            break;
          }
          case DUPLICATE_NAME: {
            setApplicationNameErrors((prevState) => [
              ...prevState,
              'Application name already exists',
            ]);
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

    if (!appId) {
      return;
    }

    setIsDeleteLoading(true);

    const requestGenerator = messageHandler.requestGenerator<DeleteAppParams>(
      DELETE_APP,
      v4(),
      {
        id: appId,
      }
    );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case DELETE_APP:
          case INVALID_APP:
          case INVALID_UUID: {
            navigate(-1);
            break;
          }
          case INVALID_APP_DELETE: {
            setDeleteErrors((prevState) => [
              ...prevState,
              'Cannot delete current application',
            ]);
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
          <h1 className='truncate font-bold uppercase'>Application</h1>
          <ReloadButton />
        </div>

        {!app && <Loading />}
        {app && (
          <>
            {isFetching && <Loading />}
            {!isFetching && (
              <div className='flex flex-col'>
                <div className='flex items-center justify-between'>
                  <h2 className='bold mt-2 truncate text-3xl'>{app.name}</h2>
                  <div className='flex items-center justify-center space-x-4'>
                    <button
                      className='unstyled'
                      title='Update'
                      onClick={() => setShowUpdateModal(true)}
                    >
                      <svg
                        viewBox='0 0 16 16'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='currentColor'
                        className='mt-0 h-6 w-6 fill-[--vscode-foreground]'
                      >
                        <path d='M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l8-8 1.77 1.77-8 8z' />
                      </svg>
                    </button>
                    <button
                      className='unstyled'
                      title='Delete'
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <svg
                        viewBox='0 0 16 16'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='currentColor'
                        className='mt-0 h-6 w-6 fill-[--vscode-foreground]'
                      >
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className='mt-5 flex flex-col [&>*:nth-child(even)]:mb-4 [&>*:nth-child(even)]:ml-4 [&>*:nth-child(odd)]:font-bold'>
                  <span className=''>Project:</span>
                  <span className=''>{app.projectName}</span>

                  <span>Application ID:</span>
                  <div className='flex items-center space-x-2'>
                    <span>{appId}</span>
                    <button
                      className='unstyled relative'
                      title='Copy'
                      onClick={() => {
                        navigator.clipboard.writeText(appId ?? '');

                        setIsAppIdCopied(true);
                        clearTimeout(appIdCopyTimer.current);
                        appIdCopyTimer.current = setTimeout(() => {
                          setIsAppIdCopied(false);
                        }, 1000);
                      }}
                    >
                      <div
                        className={`pointer-events-none absolute bottom-[125%] right-0 z-40 h-min w-min select-none rounded bg-black px-2 transition duration-200 ${isAppIdCopied ? 'opacity-100' : 'opacity-0'}`}
                      >
                        Copied!
                      </div>

                      <svg
                        viewBox='0 0 16 16'
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-6 w-6 fill-[--vscode-foreground]'
                      >
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M4 4l1-1h5.414L14 6.586V14l-1 1H5l-1-1V4zm9 3l-3-3H5v10h8V7z'
                        />
                        <path
                          fillRule='evenodd'
                          clipRule='evenodd'
                          d='M3 1L2 2v10l1 1V2h6.414l-1-1H3z'
                        />
                      </svg>
                    </button>
                  </div>

                  <span>Date Created:</span>
                  <span>
                    {new Date(app.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })}
                  </span>

                  <span>Last Updated:</span>
                  <span>
                    {app.lastUpdatedAt
                      ? new Date(app.lastUpdatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })
                      : 'N/A'}
                  </span>

                  <span>Last Scanned:</span>
                  <span>
                    {app.lastScanEndedAt
                      ? new Date(app.lastScanEndedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showUpdateModal && (
        <Modal componentRef={updateRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Update Application
              </span>
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
            <TextInput
              value={_updateName}
              handleOnChange={setUpdateName}
              label='Application Name'
              id='update-app-name'
              errors={applicationNameErrors}
            />
            <div className='!mt-6 flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowUpdateModal(false)}
                disabled={isUpdateLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleUpdate}
                className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
                disabled={
                  isUpdateLoading ||
                  isValidatingInput ||
                  hasEmptyRequiredInputs ||
                  hasErrors ||
                  !hasChanges
                }
              >
                {isUpdateLoading ? 'Updating...' : 'Update Application'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal componentRef={deleteRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Delete Application
              </span>
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
            <p className='overflow-hidden'>
              Are you sure you want to delete <strong>{app?.name}</strong> from
              your account?
            </p>
            <p>This action is irreversible.</p>

            <div className='flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleteLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleDelete}
                disabled={isDeleteLoading}
                className='truncate rounded bg-red-500 hover:bg-red-500 hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-75 hover:disabled:brightness-100'
              >
                {isDeleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
            {deleteErrors.length > 0 && (
              <ul className='list-disc'>
                {Array.from(new Set(deleteErrors)).map((error) => (
                  <li key={error} className='font-semibold text-red-600'>
                    {error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

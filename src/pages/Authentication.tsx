import useClickOutside from '@hooks/useClickOutside';
import { useUser } from '@hooks/useUser';
import { AuthHeader, AuthInfo, AuthType } from '@types_/auth';
import { useDebounce } from 'use-debounce';
import { v4 } from 'uuid';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import a11yDark from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';
import {
  AUTH_DESCRIPTION_LENGTH,
  AUTH_MISSING_HEADERS,
  CLI_MISSING,
  DELETE_AUTH,
  DUPLICATE_NAME,
  INVALID_AUTH,
  INVALID_AUTH_FORM,
  INVALID_NAME,
  INVALID_URL,
  INVALID_UUID,
  NO_UPDATED_FIELD,
  UNAUTHORIZED_ACCESS,
  UPDATE_AUTH,
} from '@commands/CommandConstants';
import { DeleteAuthParams } from '@commands/DeleteAuth';
import { UpdateAuthParams } from '@commands/UpdateAuth';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { SecondaryButton } from '@components/SecondaryButton';
import { TextInput } from '@components/TextInput';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';
import { API_URL } from '@constants/GlobalConstants';

SyntaxHighlighter.registerLanguage('python', python);

export const getAuth = async (
  setAuth: React.Dispatch<React.SetStateAction<AuthInfo | undefined>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  authId: string | undefined,
  ignore: boolean = false
) => {
  if (!authId) {
    return;
  }

  try {
    const auth = await messageHandler.api(
      'get',
      `${API_URL}/api/v1/credentials/${authId}/`
    );

    if (ignore) {
      return;
    }

    setAuth({
      id: auth.id,
      name: auth.name,
      type: auth.type,
      description: auth.description,
      headers: auth.cookie ?? auth.headers ?? [],
      url: auth.script_first_url,
      projectId: auth.project,
      projectName: auth.project_name,
      createdAt: new Date(auth.created_at),
      lastUpdatedAt: auth.last_updated_at
        ? new Date(auth.last_updated_at)
        : null,
      scriptContent: auth.script_content,
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

const types: { type: AuthType; name: string }[] = [
  { type: 'COOKIE', name: 'Cookie' },
  { type: 'HEADER', name: 'Header' },
  { type: 'SCRIPT', name: 'Playwright' },
];

export const AuthenticationPage = () => {
  const { authId } = useParams();

  const navigate = useNavigate();
  const { setIsLoggedIn, setIsCliInstalled } = useUser();

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

  const [auth, setAuth] = useState<AuthInfo>();

  const [_updateName, setUpdateName] = useState('');
  const [_updateDescription, setUpdateDescription] = useState('');
  const [_updateHeaders, setUpdateHeaders] = useState<AuthHeader[]>([]);
  const [_updateUrl, setUpdateUrl] = useState('');

  const [updateName] = useDebounce(_updateName, 500);
  const [updateDescription] = useDebounce(_updateDescription, 500);
  const [updateHeaders] = useDebounce(_updateHeaders, 500);
  const [updateUrl] = useDebounce(_updateUrl, 500);

  const [authNameErrors, setAuthNameErrors] = useState<string[]>([]);
  const [authDescriptionErrors, setAuthDescriptionErrors] = useState<string[]>(
    []
  );
  const [authHeaderErrors, setAuthHeaderErrors] = useState<string[]>([]);
  const [authUrlErrors, setAuthUrlErrors] = useState<string[]>([]);
  const [playwrightFormErrors, setPlaywrightFormErrors] = useState<string[]>(
    []
  );

  const [isValidatingInput, setIsValidatingInput] = useState(true);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isRerecording, setIsRerecording] = useState(false);

  const [isAuthIdCopied, setIsAuthIdCopied] = useState(false);
  const [isScriptCopied, setIsScriptCopied] = useState(false);
  const authIdCopyTimer = useRef<NodeJS.Timeout>();
  const scriptCopyTimer = useRef<NodeJS.Timeout>();

  const hasEmptyRequiredInputs =
    !updateName || (auth?.type === 'SCRIPT' && !updateUrl);

  const hasErrors =
    authNameErrors.length > 0 ||
    authDescriptionErrors.length > 0 ||
    (auth?.type === 'HEADER' && authHeaderErrors.length > 0) ||
    (auth?.type === 'SCRIPT' && authUrlErrors.length > 0);

  const hasChanges =
    updateName !== auth?.name ||
    updateDescription !== (auth?.description ?? '') ||
    (auth?.type !== 'SCRIPT' &&
      JSON.stringify(auth?.headers) !== JSON.stringify(updateHeaders)) ||
    (auth?.type === 'SCRIPT' && updateUrl !== auth?.url);

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getAuth(setAuth, setIsLoggedIn, authId, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [authId]);

  useEffect(() => {
    return () => {
      clearTimeout(authIdCopyTimer.current);
      clearTimeout(scriptCopyTimer.current);
    };
  }, []);

  useEffect(() => {
    setUpdateName(auth?.name ?? '');
    setUpdateDescription(auth?.description ?? '');
    setUpdateHeaders([...(auth?.headers ?? [])]);
    setUpdateUrl(auth?.url ?? '');

    setAuthNameErrors([]);
    setAuthDescriptionErrors([]);
    setAuthHeaderErrors([]);
    setAuthUrlErrors([]);
    setPlaywrightFormErrors([]);
  }, [auth, showUpdateModal]);

  useEffect(() => {
    setIsValidatingInput(true);
  }, [_updateName, _updateDescription, _updateHeaders, _updateUrl]);

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

    setAuthNameErrors(errors);
    setIsValidatingInput(false);
  }, [updateName]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (updateDescription.length > 100) {
      errors.push('Description must be at most 500 characters');
    }

    setAuthDescriptionErrors(errors);
    setIsValidatingInput(false);
  }, [updateDescription]);

  useEffect(() => {
    setIsValidatingInput(false);
    setAuthHeaderErrors([]);
  }, [updateHeaders]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!updateUrl) {
      errors.push('URL is required');
    }

    setAuthUrlErrors(errors);
    setIsValidatingInput(false);
  }, [updateUrl]);

  const handleUpdate = async (
    e: React.MouseEvent<HTMLButtonElement>,
    rerecord?: boolean
  ) => {
    e.preventDefault();

    if (!auth) {
      return;
    }

    if (updateHeaders.some((header) => !header.name || !header.value)) {
      setAuthHeaderErrors([
        `${auth.type === 'COOKIE' ? 'Cookie' : 'Header'} names and values are required`,
      ]);
      return;
    }

    setIsUpdateLoading(true);

    const requestGenerator = messageHandler.requestGenerator<UpdateAuthParams>(
      UPDATE_AUTH,
      v4(),
      {
        project: { id: auth.projectId, name: auth.projectName },
        authentication: auth,
        name: updateName,
        headers: updateHeaders,
        url: updateUrl,
        rerecord: rerecord,
      }
    );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case UPDATE_AUTH:
          case NO_UPDATED_FIELD: {
            if (!rerecord) {
              await messageHandler.api(
                'PUT',
                `${API_URL}/api/v1/credentials/${auth.id}/`,

                { description: updateDescription }
              );
            }
            await getAuth(setAuth, setIsLoggedIn, authId);
            setShowUpdateModal(false);
            break;
          }
          case INVALID_AUTH:
          case INVALID_UUID: {
            navigate(-1);
            break;
          }
          case INVALID_URL: {
            setAuthUrlErrors((prevState) => [...prevState, 'Invalid URL']);
            break;
          }
          case AUTH_MISSING_HEADERS: {
            setAuthHeaderErrors([
              `${auth.type === 'COOKIE' ? 'Cookie' : 'Header'} names and values are required`,
            ]);
            break;
          }
          case AUTH_DESCRIPTION_LENGTH: {
            setAuthDescriptionErrors((prevState) => [
              ...prevState,
              'Name must be at most 500 characters',
            ]);
            break;
          }
          case DUPLICATE_NAME: {
            setAuthNameErrors((prevState) => [
              ...prevState,
              'Authentication name already exists',
            ]);
            break;
          }
          case INVALID_NAME: {
            setAuthNameErrors((prevState) => [
              ...prevState,
              "Name should have a max length of 100 and should have characters 'A-Z', 'a-z', '0-9', '-', and '_' only",
            ]);
            break;
          }
          case INVALID_AUTH_FORM: {
            setPlaywrightFormErrors((prevState) => [
              ...prevState,
              'No authentication workflow recorded. Please log in to get authentication credentials.',
            ]);
            break;
          }
          case UNAUTHORIZED_ACCESS: {
            setIsLoggedIn(false);
            break;
          }
          case CLI_MISSING: {
            setIsCliInstalled(false);
            break;
          }
        }
      }
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
            case 'invalid':
            case 'max_length': {
              setAuthDescriptionErrors((prevState) => [
                ...prevState,
                'Name must be at most 500 characters',
              ]);
              break;
            }
            case 'null_characters_not_allowed':
            case 'surrogate_characters_not_allowed': {
              setAuthDescriptionErrors((prevState) => [
                ...prevState,
                error.detail,
              ]);
              break;
            }
          }
        }
      } else {
        console.error(err);
      }
    }
    setIsUpdateLoading(false);
    setIsRerecording(false);
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!authId || !auth) {
      return;
    }

    setIsDeleteLoading(true);

    const requestGenerator = messageHandler.requestGenerator<DeleteAuthParams>(
      DELETE_AUTH,
      v4(),
      {
        authId: authId,
        auth: auth,
      }
    );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case DELETE_AUTH:
          case INVALID_AUTH:
          case INVALID_UUID: {
            navigate(-1);
            break;
          }
          case UNAUTHORIZED_ACCESS: {
            setIsLoggedIn(false);
            break;
          }
          case CLI_MISSING: {
            setIsCliInstalled(false);
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    setIsDeleteLoading(false);
  };

  const script = auth
    ? auth.scriptContent ??
      `${types.filter((type) => type.type === auth?.type)[0].name}s\n\n${(auth?.headers ?? []).map((header) => header.name + ': ' + header.value).join('\n')}`
    : '';

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <PageHeader title='Authentication'/>
        {!auth && <Loading />}
        {auth && (
          <>
            {isFetching && <Loading />}
            {!isFetching && (
              <div className='flex flex-col'>
                <div className='flex items-center justify-between'>
                  <h2 className='bold mt-2 truncate text-3xl'>{auth.name}</h2>
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
                  <span className=''>{auth.projectName}</span>

                  <span>Authentication Type:</span>
                  <span>
                    {types.filter((type) => type.type === auth.type)[0].name}
                  </span>

                  <span>Authentication ID:</span>
                  <div className='flex items-center space-x-2'>
                    <span>{authId}</span>
                    <button
                      className='unstyled relative'
                      title='Copy'
                      onClick={() => {
                        navigator.clipboard.writeText(authId ?? '');

                        setIsAuthIdCopied(true);
                        clearTimeout(authIdCopyTimer.current);
                        authIdCopyTimer.current = setTimeout(() => {
                          setIsAuthIdCopied(false);
                        }, 1000);
                      }}
                    >
                      <div
                        className={`pointer-events-none absolute bottom-[125%] right-0 z-40 h-min w-min select-none rounded bg-black px-2 transition duration-200 ${isAuthIdCopied ? 'opacity-100' : 'opacity-0'}`}
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

                  {auth.url && (
                    <>
                      <span>Target URL:</span>
                      <span>{auth.url}</span>
                    </>
                  )}

                  <span>Date Created:</span>
                  <span>
                    {new Date(auth.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })}
                  </span>

                  {auth.lastUpdatedAt && (
                    <>
                      <span>Latest Updated:</span>
                      <span>
                        {new Date(auth.lastUpdatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </span>
                    </>
                  )}

                  <span>Description:</span>
                  <span>{auth.description ?? 'N/A'}</span>

                  <span>Authentication Script:</span>
                  <div className='relative !ml-0'>
                    <SyntaxHighlighter language='python' style={a11yDark}>
                      {script ?? ''}
                    </SyntaxHighlighter>
                    <button
                      className='unstyled absolute right-3 top-3 !size-10 rounded !bg-white'
                      title='Copy'
                      onClick={() => {
                        navigator.clipboard.writeText(script ?? '');

                        setIsScriptCopied(true);
                        clearTimeout(scriptCopyTimer.current);
                        scriptCopyTimer.current = setTimeout(() => {
                          setIsScriptCopied(false);
                        }, 1000);
                      }}
                    >
                      <div
                        className={`pointer-events-none absolute bottom-[125%] right-0 z-40 h-min w-min select-none rounded bg-black px-2 transition duration-200 ${isScriptCopied ? 'opacity-100' : 'opacity-0'}`}
                      >
                        Copied!
                      </div>

                      <svg
                        viewBox='0 0 16 16'
                        xmlns='http://www.w3.org/2000/svg'
                        className='m-auto h-6 w-6 fill-black'
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
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {auth && showUpdateModal && (
        <Modal componentRef={updateRef}>
          <div className='flex flex-col space-y-1'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Update Authentication
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
            {!isRerecording && (
              <>
                <TextInput
                  value={_updateName}
                  handleOnChange={setUpdateName}
                  label='Authentication Name'
                  id='auth-name-update'
                  errors={authNameErrors}
                />
                <TextInput
                  value={_updateDescription}
                  handleOnChange={setUpdateDescription}
                  label='Description (Optional)'
                  id='description-update'
                  errors={authDescriptionErrors}
                />
              </>
            )}
            {auth.type === 'SCRIPT' && (
              <>
                {!isRerecording && (
                  <TextInput
                    value={_updateUrl}
                    handleOnChange={setUpdateUrl}
                    label='Authentication URL'
                    id='auth-url'
                    errors={authUrlErrors}
                    touched={true}
                  />
                )}

                {(_updateUrl !== auth.url || isRerecording) && (
                  <>
                    <p className='!mt-6'>
                      Will launch an incognito Chrome Window to record the login
                      process. <b>Instructions</b>:
                    </p>
                    <ul className='!mb-4 list-disc'>
                      <li>
                        Follow the steps to log into the application (type in
                        the username and password)
                      </li>
                      <li>
                        When you are done, exit the Chrome window. This will
                        upload the login sequence to NightVision Cloud.
                      </li>
                    </ul>
                    {auth.type === 'SCRIPT' &&
                      playwrightFormErrors.length > 0 && (
                        <ul className='list-disc'>
                          {Array.from(new Set(playwrightFormErrors)).map(
                            (error) => (
                              <li
                                key={error}
                                className='font-semibold text-red-600'
                              >
                                {error}
                              </li>
                            )
                          )}
                        </ul>
                      )}
                  </>
                )}
                {_updateUrl === auth.url &&
                  (!isUpdateLoading || isRerecording) && (
                    <button
                      onClick={(e) => {
                        setIsRerecording(true);
                        handleUpdate(e, true);
                      }}
                      disabled={isRerecording}
                      className='relative !mt-4 rounded !bg-transparent text-[--vscode-foreground] before:absolute before:inset-0 before:-z-10 before:rounded before:bg-[--vscode-input-background] before:hover:bg-[--vscode-input-background] before:hover:brightness-75 disabled:cursor-default disabled:before:hover:brightness-100'
                    >
                      {isRerecording ? 'Recording...' : 'Re-record Script'}
                    </button>
                  )}
              </>
            )}
            {auth && auth.type !== 'SCRIPT' && (
              <>
                {(_updateHeaders ?? []).map((header, index) => (
                  <div className='flex flex-nowrap' key={index}>
                    <div className='grid w-full grid-cols-2 gap-2'>
                      <TextInput
                        value={header.name}
                        handleOnChange={(value) =>
                          setUpdateHeaders((prevState) =>
                            prevState.map((header, i) =>
                              index === i ? { ...header, name: value } : header
                            )
                          )
                        }
                        label={`${types.filter((type) => type.type === auth.type)[0].name} Name`}
                        id={`header-name-${index}`}
                      />
                      <TextInput
                        value={header.value}
                        handleOnChange={(value) =>
                          setUpdateHeaders((prevState) =>
                            prevState.map((header, i) =>
                              index === i ? { ...header, value: value } : header
                            )
                          )
                        }
                        label={`${types.filter((type) => type.type === auth.type)[0].name} Value`}
                        id={`header-value-${index}`}
                      />
                    </div>
                    <button
                      className='unstyled h-min w-min hover:brightness-75'
                      onClick={() =>
                        setUpdateHeaders((prevState) =>
                          prevState.length > 1
                            ? prevState.filter((_, i) => i !== index)
                            : prevState
                        )
                      }
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
                ))}
                <button
                  className='unstyled flex !w-min flex-nowrap items-center justify-center self-end text-[--vscode-foreground] hover:brightness-75'
                  onClick={() =>
                    setUpdateHeaders((prevState) => [
                      ...prevState,
                      { name: '', value: '' },
                    ])
                  }
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='mt-0.5 h-5 w-5'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 4.5v15m7.5-7.5h-15'
                    />
                  </svg>
                  <span className='text-nowrap'>
                    Add{' '}
                    {types.filter((type) => type.type === auth.type)[0].name}
                  </span>
                </button>
                {authHeaderErrors.length > 0 && (
                  <ul className='list-disc'>
                    {Array.from(new Set(authHeaderErrors)).map((error) => (
                      <li key={error} className='font-semibold text-red-600'>
                        {error}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {!isRerecording && (
              <button
                onClick={handleUpdate}
                className='!mt-4 truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
                disabled={
                  isUpdateLoading ||
                  isValidatingInput ||
                  hasEmptyRequiredInputs ||
                  hasErrors ||
                  !hasChanges
                }
              >
                {isUpdateLoading ? 'Updating...' : 'Update Authentication'}
              </button>
            )}
          </div>
        </Modal>
      )}

      {auth && showDeleteModal && (
        <Modal componentRef={deleteRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Delete Authentication
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
              Are you sure you want to delete <strong>{auth.name}</strong> from
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
          </div>
        </Modal>
      )}
    </>
  );
};

import useClickOutside from '@hooks/useClickOutside';
import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Auth, AuthHeader, AuthType } from '@types_/auth';
import { Project } from '@types_/project';
import { useDebounce } from 'use-debounce';
import { v4 } from 'uuid';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AUTH_DESCRIPTION_LENGTH,
  AUTH_MISSING_HEADERS,
  CLI_MISSING,
  CREATE_AUTH,
  DUPLICATE_NAME,
  INVALID_AUTH_FORM,
  INVALID_NAME,
  INVALID_URL,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { CreateAuthParams } from '@commands/CreateAuth';
import { Dropdown } from '@components/Dropdown';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { SecondaryButton } from '@components/SecondaryButton';
import { TabSelector } from '@components/TabSelector';
import { TextInput } from '@components/TextInput';
import { getProjects } from '@pages/Projects';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';

export const getAuths = async (
  setAuths: React.Dispatch<React.SetStateAction<Auth[] | undefined>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string,
  ignore: boolean = false
) => {
  try {
    const auths = (
      await messageHandler.api(
        'get',
        `https://api.nightvision.net/api/v1/credentials/?order=name&project=${projectId}`
      )
    ).results;

    if (ignore) {
      return;
    }

    setAuths(
      auths.map(
        (auth: any): Auth => ({
          id: auth.id,
          name: auth.name,
          type: auth.type,
          description: auth.description,
          headers: auth.cookie ?? auth.headers ?? [],
          url: auth.script_first_url,
        })
      )
    );
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

export const Authentications = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn, setIsCliInstalled } = useUser();

  const {
    componentRef: createRef,
    showComponent: showCreateModal,
    setShowComponent: setShowCreateModal,
  } = useClickOutside();

  const [auths, setAuths] = useState<Auth[]>();
  const [projects, setProjects] = useState<Project[]>();

  const [_authName, setAuthName] = useState('');
  const [_authDescription, setAuthDescription] = useState('');
  const [_authHeaders, setAuthHeaders] = useState<AuthHeader[]>([
    { name: '', value: '' },
  ]);
  const [_authCookies, setAuthCookies] = useState<AuthHeader[]>([
    { name: '', value: '' },
  ]);
  const [_authUrl, setAuthUrl] = useState('');

  const [authName] = useDebounce(_authName, 500);
  const [authDescription] = useDebounce(_authDescription, 500);
  const [authHeaders] = useDebounce(_authHeaders, 500);
  const [authCookies] = useDebounce(_authCookies, 500);
  const [authUrl] = useDebounce(_authUrl, 500);

  const [authNameErrors, setAuthNameErrors] = useState<string[]>([]);
  const [authDescriptionErrors, setAuthDescriptionErrors] = useState<string[]>(
    []
  );
  const [authHeaderErrors, setAuthHeaderErrors] = useState<string[]>([]);
  const [authCookieErrors, setAuthCookieErrors] = useState<string[]>([]);
  const [authUrlErrors, setAuthUrlErrors] = useState<string[]>([]);
  const [playwrightFormErrors, setPlaywrightFormErrors] = useState<string[]>(
    []
  );

  const [isValidatingInput, setIsValidatingInput] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [selectedType, setSelectedType] = useState(types[0]);

  const hasEmptyRequiredInputs =
    !authName || (selectedType.type === 'SCRIPT' && !authUrl);

  const hasErrors =
    authNameErrors.length > 0 ||
    authDescriptionErrors.length > 0 ||
    (selectedType.type === 'COOKIE' && authCookieErrors.length > 0) ||
    (selectedType.type === 'HEADER' && authHeaderErrors.length > 0) ||
    (selectedType.type === 'SCRIPT' && authUrlErrors.length > 0);

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getAuths(setAuths, setIsLoggedIn, currentProject.id);
      await getProjects(setProjects, setIsLoggedIn, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [currentProject]);

  useEffect(() => {
    setAuthName('');
    setAuthDescription('');
    setAuthHeaders([{ name: '', value: '' }]);
    setAuthCookies([{ name: '', value: '' }]);
    setAuthUrl('');

    setAuthNameErrors([]);
    setAuthDescriptionErrors([]);
    setAuthHeaderErrors([]);
    setAuthCookieErrors([]);
    setAuthUrlErrors([]);
    setPlaywrightFormErrors([]);

    setSelectedType(types[0]);
  }, [showCreateModal]);

  useEffect(() => {
    setIsValidatingInput(true);
  }, [_authName, _authDescription, _authCookies, _authHeaders, _authUrl]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!authName) {
      errors.push('Name is required');
    }

    if (authName.length > 100) {
      errors.push('Name must be at most 100 characters');
    }

    if (/[^\w_-]/.test(authName)) {
      errors.push(
        "Only characters 'A-Z', 'a-z', '0-9', '-', and '_' are allowed"
      );
    }

    if (auths?.some((auth) => auth.name === authName)) {
      errors.push('Authentication name already exists');
    }

    setAuthNameErrors(errors);
    setIsValidatingInput(false);
  }, [auths, authName]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (authDescription.length > 100) {
      errors.push('Description must be at most 500 characters');
    }

    setAuthDescriptionErrors(errors);
    setIsValidatingInput(false);
  }, [authDescription]);

  useEffect(() => {
    setIsValidatingInput(false);
    setAuthCookieErrors([]);
  }, [authCookies]);

  useEffect(() => {
    setIsValidatingInput(false);
    setAuthHeaderErrors([]);
  }, [authHeaders]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!authUrl) {
      errors.push('URL is required');
    }

    setAuthUrlErrors(errors);
    setIsValidatingInput(false);
  }, [authUrl]);

  const handleCreateAuth = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!authName) {
      return;
    }

    if (
      selectedType.type === 'COOKIE' &&
      authCookies.some((cookie) => !cookie.name || !cookie.value)
    ) {
      setAuthCookieErrors(['Cookie names and values are required']);
      return;
    }

    if (
      selectedType.type === 'HEADER' &&
      authHeaders.some((header) => !header.name || !header.value)
    ) {
      setAuthHeaderErrors(['Header names and values are required']);
      return;
    }

    if (selectedType.type === 'SCRIPT') {
      if (!authUrl) {
        return;
      }
    }

    const requestGenerator = messageHandler.requestGenerator<CreateAuthParams>(
      CREATE_AUTH,
      v4(),
      {
        project: currentProject,
        name: authName,
        type: selectedType.type,
        description: authDescription,
        headers: selectedType.type === 'COOKIE' ? authCookies : authHeaders,
        url: authUrl,
      }
    );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_AUTH: {
            await getAuths(setAuths, setIsLoggedIn, currentProject.id);
            setShowCreateModal(false);
            break;
          }
          case AUTH_MISSING_HEADERS: {
            if (
              selectedType.type === 'COOKIE' &&
              authCookies.some((cookie) => !cookie.name || !cookie.value)
            ) {
              setAuthCookieErrors(['Cookie names and values are required']);
              return;
            }

            if (
              selectedType.type === 'HEADER' &&
              authHeaders.some((header) => !header.name || !header.value)
            ) {
              setAuthHeaderErrors(['Header names and values are required']);
              return;
            }

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
          case INVALID_URL: {
            setAuthUrlErrors((prevState) => [...prevState, 'Invalid URL']);
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
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
  };

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <PageHeader title='Authentications'/>
        {auths && projects && (
          <>
            <div>
              <Label htmlFor='current-project'>Current Project</Label>
              <Dropdown
                selectedItem={currentProject}
                items={projects}
                name='Project'
                handleChange={setCurrentProject}
                id='current-project'
              />
            </div>
            <button
              onClick={() => {
                setShowCreateModal(true);
              }}
              className='truncate rounded'
            >
              Create Authentication
            </button>

            {isFetching && <Loading />}
            {!isFetching && (
              <EditList
                list={auths}
                emptyText='No authentications found'
                handleClick={(listItem) => {
                  navigate(`/authentications/${listItem.id}`);
                }}
                renderItem={(listItem) => (
                  <div className='flex max-w-full flex-nowrap justify-between truncate'>
                    <span className='mr-2 truncate'>{listItem.name}</span>
                    <span>
                      {
                        types.filter((type) => type.type === listItem.type)[0]
                          .name
                      }
                    </span>
                  </div>
                )}
              />
            )}
          </>
        )}
        {(!auths || !projects) && <Loading />}
      </div>

      {showCreateModal && (
        <Modal componentRef={createRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Create Authentication
              </span>
              <button
                className='unstyled'
                onClick={() => setShowCreateModal(false)}
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
            <div className='flex flex-col space-y-1'>
              <TabSelector
                values={types}
                selected={selectedType}
                setSelected={setSelectedType}
              />
              <TextInput
                value={_authName}
                handleOnChange={setAuthName}
                label='Authentication Name'
                id='auth-name'
                errors={authNameErrors}
              />
              <TextInput
                value={_authDescription}
                handleOnChange={setAuthDescription}
                label='Description (Optional)'
                id='auth-description'
                errors={authDescriptionErrors}
              />

              <div
                className={`${selectedType.type === 'SCRIPT' ? 'block' : 'hidden'}`}
              >
                <TextInput
                  value={_authUrl}
                  handleOnChange={setAuthUrl}
                  label='Authentication URL'
                  id='auth-url'
                  errors={authUrlErrors}
                />

                <p className='!mt-6'>
                  Will launch an incognito Chrome Window to record the login
                  process. <b>Instructions</b>:
                </p>
                <ul className='!mb-4 list-disc'>
                  <li>
                    Follow the steps to log into the application (type in the
                    username and password)
                  </li>
                  <li>
                    When you are done, exit the Chrome window. This will upload
                    the login sequence to NightVision Cloud.
                  </li>
                </ul>
              </div>

              <div
                className={`flex flex-col ${selectedType.type !== 'SCRIPT' ? 'block' : 'hidden'}`}
              >
                <div
                  className={`${selectedType.type === 'COOKIE' ? 'block' : 'hidden'}`}
                >
                  {_authCookies.map((cookie, index) => (
                    <Headers
                      key={index}
                      name={cookie.name}
                      value={cookie.value}
                      setHeaders={setAuthCookies}
                      index={index}
                      selectedType={selectedType}
                    />
                  ))}
                </div>

                <div
                  className={`${selectedType.type === 'HEADER' ? 'block' : 'hidden'}`}
                >
                  {_authHeaders.map((header, index) => (
                    <Headers
                      key={index}
                      name={header.name}
                      value={header.value}
                      setHeaders={setAuthHeaders}
                      index={index}
                      selectedType={selectedType}
                    />
                  ))}
                </div>
                <button
                  className='unstyled mt-1 flex !w-min flex-nowrap items-center justify-center self-end text-[--vscode-foreground] hover:brightness-75'
                  onClick={() =>
                    selectedType.type === 'HEADER'
                      ? setAuthHeaders((prevState) => [
                          ...prevState,
                          { name: '', value: '' },
                        ])
                      : setAuthCookies((prevState) => [
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
                  <span className='text-nowrap'>Add {selectedType.name}</span>
                </button>
              </div>
              {selectedType.type === 'SCRIPT' &&
                playwrightFormErrors.length > 0 && (
                  <ul className='list-disc'>
                    {Array.from(new Set(playwrightFormErrors)).map((error) => (
                      <li key={error} className='font-semibold text-red-600'>
                        {error}
                      </li>
                    ))}
                  </ul>
                )}
              {selectedType.type !== 'SCRIPT' &&
                (selectedType.type === 'HEADER'
                  ? authHeaderErrors
                  : authCookieErrors
                ).length > 0 && (
                  <ul className='list-disc'>
                    {Array.from(
                      new Set(
                        selectedType.type === 'HEADER'
                          ? authHeaderErrors
                          : authCookieErrors
                      )
                    ).map((error) => (
                      <li key={error} className='font-semibold text-red-600'>
                        {error}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
            <div className='flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleCreateAuth}
                className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
                disabled={
                  isLoading ||
                  isValidatingInput ||
                  hasEmptyRequiredInputs ||
                  hasErrors
                }
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

const Headers = ({
  name,
  value,
  setHeaders,
  index,
  selectedType,
}: {
  name: string;
  value: string;
  setHeaders: React.Dispatch<React.SetStateAction<AuthHeader[]>>;
  index: number;
  selectedType: {
    type: AuthType;
    name: string;
  };
}) => {
  return (
    <div className='mb-1 flex flex-nowrap' key={index}>
      <div className='grid w-full grid-cols-2 gap-2'>
        <TextInput
          value={name}
          handleOnChange={(value) =>
            setHeaders((prevState) =>
              prevState.map((header, i) =>
                index === i ? { ...header, name: value } : header
              )
            )
          }
          label={`${selectedType.name} Name`}
          id={`header-name-${index}`}
        />
        <TextInput
          value={value}
          handleOnChange={(value) =>
            setHeaders((prevState) =>
              prevState.map((header, i) =>
                index === i ? { ...header, value: value } : header
              )
            )
          }
          label={`${selectedType.name} Value`}
          id={`header-value-${index}`}
        />
      </div>
      <button
        className='unstyled h-min w-min hover:brightness-75'
        onClick={() =>
          setHeaders((prevState) =>
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
  );
};

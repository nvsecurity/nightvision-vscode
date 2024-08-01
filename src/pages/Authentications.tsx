import useClickOutside from '@hooks/useClickOutside';
import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Auth, AuthHeader, AuthType } from '@types_/auth';
import { Project } from '@types_/project';
import { v4 } from 'uuid';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AUTH_DESCRIPTION_LENGTH,
  AUTH_MISSING_HEADERS,
  CREATE_AUTH,
  DELETE_AUTH,
  DUPLICATE_NAME,
  INVALID_AUTH,
  INVALID_AUTH_FORM,
  INVALID_NAME,
  INVALID_URL,
  INVALID_UUID,
  UNAUTHORIZED_ACCESS,
  UPDATE_AUTH,
} from '@commands/CommandConstants';
import { CreateAuthParams } from '@commands/CreateAuth';
import { UpdateAuthParams } from '@commands/UpdateAuth';
import { Dropdown } from '@components/Dropdown';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { ReloadButton } from '@components/ReloadButton';
import { SecondaryButton } from '@components/SecondaryButton';
import { TabSelector } from '@components/TabSelector';
import { TextInput } from '@components/TextInput';
import { getProjects } from '@pages/Projects';
import { messageHandler } from '@utils/MessageHandler';

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
  const { setIsLoggedIn } = useUser();

  const {
    componentRef: createRef,
    showComponent: showCreateModal,
    setShowComponent: setShowCreateModal,
  } = useClickOutside();

  const [auths, setAuths] = useState<Auth[]>();
  const [projects, setProjects] = useState<Project[]>();

  const [authName, setAuthName] = useState('');
  const [authDescription, setAuthDescription] = useState('');
  const [authHeaders, setAuthHeaders] = useState<AuthHeader[]>([
    { name: '', value: '' },
  ]);
  const [authCookies, setAuthCookies] = useState<AuthHeader[]>([
    { name: '', value: '' },
  ]);
  const [authUrl, setAuthUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [selectedType, setSelectedType] = useState(types[0]);

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

    setSelectedType(types[0]);
  }, [showCreateModal]);

  const handleCreateAuth = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // TODO
    if (!authName) {
      return;
    }

    if (selectedType.type === 'COOKIE') {
      if (authCookies.some((cookie) => !cookie.name || !cookie.value)) {
        return;
      }
    }

    if (selectedType.type === 'HEADER') {
      if (authHeaders.some((header) => !header.name || !header.value)) {
        return;
      }
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
            // TODO
            console.log(AUTH_MISSING_HEADERS);
            break;
          }
          case AUTH_DESCRIPTION_LENGTH: {
            // TODO
            console.log(AUTH_DESCRIPTION_LENGTH);
            break;
          }
          case DUPLICATE_NAME: {
            // TODO
            console.log(DUPLICATE_NAME);
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
          case INVALID_AUTH_FORM: {
            // TODO
            console.log(INVALID_AUTH_FORM);
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
          <h1 className='truncate font-bold uppercase'>Authentications</h1>
          <ReloadButton />
        </div>
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
                value={authName}
                handleOnChange={setAuthName}
                label='Authetication Name'
                id='auth-name'
              />
              <TextInput
                value={authDescription}
                handleOnChange={setAuthDescription}
                label='Description (Optional)'
                id='auth-description'
              />
              {selectedType.type === 'SCRIPT' && (
                <>
                  <TextInput
                    value={authUrl}
                    handleOnChange={setAuthUrl}
                    label='Authentication URL'
                    id='auth-url'
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
                      When you are done, exit the Chrome window. This will
                      upload the login sequence to NightVision Cloud.
                    </li>
                  </ul>
                </>
              )}
              {selectedType.type !== 'SCRIPT' && (
                <>
                  {(selectedType.type === 'HEADER'
                    ? authHeaders
                    : authCookies
                  ).map((header, index) => (
                    <div className='flex flex-nowrap' key={index}>
                      <div className='grid w-full grid-cols-2 gap-2'>
                        <TextInput
                          value={header.name}
                          handleOnChange={(value) =>
                            selectedType.type === 'HEADER'
                              ? setAuthHeaders((prevState) =>
                                  prevState.map((header, i) =>
                                    index === i
                                      ? { ...header, name: value }
                                      : header
                                  )
                                )
                              : setAuthCookies((prevState) =>
                                  prevState.map((header, i) =>
                                    index === i
                                      ? { ...header, name: value }
                                      : header
                                  )
                                )
                          }
                          label={`${selectedType.name} Name`}
                          id={`header-name-${index}`}
                        />
                        <TextInput
                          value={header.value}
                          handleOnChange={(value) =>
                            selectedType.type === 'HEADER'
                              ? setAuthHeaders((prevState) =>
                                  prevState.map((header, i) =>
                                    index === i
                                      ? { ...header, value: value }
                                      : header
                                  )
                                )
                              : setAuthCookies((prevState) =>
                                  prevState.map((header, i) =>
                                    index === i
                                      ? { ...header, value: value }
                                      : header
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
                          selectedType.type === 'HEADER'
                            ? setAuthHeaders((prevState) =>
                                prevState.length > 1
                                  ? prevState.filter((_, i) => i !== index)
                                  : prevState
                              )
                            : setAuthCookies((prevState) =>
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
                </>
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
                className='truncate rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Authentication'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

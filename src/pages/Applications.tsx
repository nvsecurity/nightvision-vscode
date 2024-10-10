import useClickOutside from '@hooks/useClickOutside';
import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Application } from '@types_/app';
import { Project } from '@types_/project';
import { useDebounce } from 'use-debounce';
import { v4 } from 'uuid';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CLI_MISSING,
  CREATE_APP,
  DUPLICATE_NAME,
  INVALID_NAME,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { CreateAppParams } from '@commands/CreateApp';
import { Dropdown } from '@components/Dropdown';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { SecondaryButton } from '@components/SecondaryButton';
import { TextInput } from '@components/TextInput';
import { getProjects } from '@pages/Projects';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';

export const getApps = async (
  setApps: React.Dispatch<React.SetStateAction<Application[] | undefined>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string,
  ignore: boolean = false
) => {
  try {
    const apps = (
      await messageHandler.api(
        'get',
        `https://api.nightvision.net/api/v1/applications/?order=name&project=${projectId}`
      )
    ).results;

    if (ignore) {
      return;
    }

    setApps(
      apps.map(
        (app: any): Application => ({
          id: app.id,
          name: app.name,
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

export const Applications = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn, setIsCliInstalled } = useUser();

  const {
    componentRef: createRef,
    showComponent: showCreateModal,
    setShowComponent: setShowCreateModal,
  } = useClickOutside();

  const [apps, setApps] = useState<Application[]>();
  const [projects, setProjects] = useState<Project[]>();
  const [_applicationName, setApplicationName] = useState('');
  const [applicationName] = useDebounce(_applicationName, 500);

  const [applicationNameErrors, setApplicationNameErrors] = useState<string[]>(
    []
  );

  const [isValidatingInput, setIsValidatingInput] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const hasEmptyRequiredInputs = !applicationName;
  const hasErrors = applicationNameErrors.length > 0;

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getApps(setApps, setIsLoggedIn, currentProject.id, ignore);
      await getProjects(setProjects, setIsLoggedIn, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [currentProject]);

  useEffect(() => {
    setApplicationName('');
    setApplicationNameErrors([]);
  }, [showCreateModal]);

  useEffect(() => {
    setIsValidatingInput(true);
  }, [_applicationName]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!applicationName) {
      errors.push('Name is required');
    }

    if (applicationName.length > 100) {
      errors.push('Name must be at most 100 characters');
    }

    if (/[^\w_-]/.test(applicationName)) {
      errors.push(
        "Only characters 'A-Z', 'a-z', '0-9', '-', and '_' are allowed"
      );
    }

    if (apps?.some((app) => app.name === applicationName)) {
      errors.push('Application name already exists');
    }

    setApplicationNameErrors(errors);
    setIsValidatingInput(false);
  }, [apps, applicationName]);

  const handleCreateApp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!applicationName) {
      return;
    }

    const requestGenerator = messageHandler.requestGenerator<CreateAppParams>(
      CREATE_APP,
      v4(),
      {
        applicationName,
      }
    );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_APP: {
            await getApps(setApps, setIsLoggedIn, currentProject.id);
            setShowCreateModal(false);
            break;
          }
          case DUPLICATE_NAME: {
            setApplicationNameErrors((prevState) => [
              ...prevState,
              'Application name already exists',
            ]);
            break;
          }
          case INVALID_NAME: {
            setApplicationNameErrors((prevState) => [
              ...prevState,
              "Name should have a max length of 100 and should have characters 'A-Z', 'a-z', '0-9', '-', and '_' only",
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
        <PageHeader title='Applications'/>

        {apps && projects && (
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
              className='rounded'
            >
              Create Application
            </button>

            {isFetching && <Loading />}
            {!isFetching && (
              <EditList
                list={apps}
                emptyText='No applications found'
                handleClick={(listItem) => {
                  navigate(`/applications/${listItem.id}`);
                }}
                renderItem={(listItem) => (
                  <span className='block max-w-full truncate'>
                    {listItem.name}
                  </span>
                )}
              />
            )}
          </>
        )}
        {(!apps || !projects) && <Loading />}
      </div>

      {showCreateModal && (
        <Modal componentRef={createRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Create Application
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
            <TextInput
              value={_applicationName}
              handleOnChange={setApplicationName}
              label='Application Name'
              id='app-name'
              errors={applicationNameErrors}
            />
            <div className='!mt-6 flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleCreateApp}
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

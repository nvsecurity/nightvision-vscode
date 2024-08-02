import useClickOutside from '@hooks/useClickOutside';
import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Project, ProjectInfo } from '@types_/project';
import { useDebounce } from 'use-debounce';
import { v4 } from 'uuid';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CREATE_PROJECT,
  DUPLICATE_NAME,
  INVALID_NAME,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { CreateProjectParams } from '@commands/CreateProject';
import { Dropdown } from '@components/Dropdown';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { ReloadButton } from '@components/ReloadButton';
import { SecondaryButton } from '@components/SecondaryButton';
import { TextInput } from '@components/TextInput';
import { messageHandler } from '@utils/MessageHandler';

export const getProjects = async (
  setProjects:
    | React.Dispatch<React.SetStateAction<Project[] | undefined>>
    | React.Dispatch<React.SetStateAction<ProjectInfo[] | undefined>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  ignore: boolean = false
) => {
  try {
    const projects = (
      await messageHandler.api(
        'get',
        'https://api.nightvision.net/api/v1/projects/?order=name'
      )
    ).results;

    if (ignore) {
      return;
    }

    setProjects(
      projects.map(
        (project: any): ProjectInfo => ({
          id: project.id,
          name: project.name,
          createdAt: new Date(project.created_at),
          lastUpdatedAt: project.last_updated_at
            ? new Date(project.last_updated_at)
            : null,
          owner: {
            id: project.own_user.id,
            name: project.own_user.username,
            firstName: project.own_user.first_name,
            lastName: project.own_user.last_name,
            avatarUrl: project.own_user.avatar_url,
          },
          sharedWithUsers: project.shared_with_users_preview
            .filter((user: any) => user.id !== project.own_user.id)
            .map((user: any) => ({
              id: user.id,
              name: user.username,
              firstName: user.first_name,
              lastName: user.last_name,
              avatarUrl: user.avatar_url,
            })),
          isDefault: project.is_default,
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

export const Projects = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn } = useUser();

  const {
    componentRef: createRef,
    showComponent: showCreateModal,
    setShowComponent: setShowCreateModal,
  } = useClickOutside();

  const [projects, setProjects] = useState<ProjectInfo[]>();
  const [_projectName, setProjectName] = useState('');
  const [projectName] = useDebounce(_projectName, 500);

  const [projectNameErrors, setProjectNameErrors] = useState<string[]>([]);

  const [isCreateDisabled, setIsCreateDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getProjects(setProjects, setIsLoggedIn, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    setProjectName('');
    setProjectNameErrors([]);
  }, [showCreateModal]);

  useEffect(() => {
    setIsCreateDisabled(true);
  }, [_projectName]);

  useEffect(() => {
    setProjectNameErrors([]);
    setIsCreateDisabled(true);

    const errors: string[] = [];

    if (!projectName) {
      errors.push('Name is required');
    }

    if (projectName.length > 100) {
      errors.push('Name must be at most 100 characters');
    }

    if (/[^\w_-]/.test(projectName)) {
      errors.push(
        "Only characters 'A-Z', 'a-z', '0-9', '-', and '_' are allowed"
      );
    }

    if (projects?.some((project) => project.name === projectName)) {
      errors.push('Project name already exists');
    }

    if (errors.length > 0) {
      setProjectNameErrors((prevState) => [...prevState, ...errors]);
      return;
    }

    setIsCreateDisabled(false);
  }, [projectName]);

  const handleCreateProject = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    const requestGenerator =
      messageHandler.requestGenerator<CreateProjectParams>(
        CREATE_PROJECT,
        v4(),
        { projectName: projectName }
      );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_PROJECT:
            await getProjects(setProjects, setIsLoggedIn);
            setShowCreateModal(false);
            break;
          case DUPLICATE_NAME: {
            setProjectNameErrors((prevState) => [
              ...prevState,
              'Project name already exists',
            ]);
            break;
          }
          case INVALID_NAME: {
            setProjectNameErrors((prevState) => [
              ...prevState,
              "Name should have a max length of 100 and should have characters 'A-Z', 'a-z', '0-9', '-', and '_' only",
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
          <h1 className='truncate font-bold uppercase'>Projects</h1>
          <ReloadButton />
        </div>

        {projects && (
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
              Create Project
            </button>

            {isFetching && <Loading />}
            {!isFetching && (
              <EditList
                list={projects}
                emptyText='No projects found'
                handleClick={(listItem) => {
                  navigate(`/projects/${listItem.id}`);
                }}
                renderItem={(listItem) => (
                  <div className='flex max-w-full flex-nowrap justify-between truncate'>
                    <span className='mr-2 truncate'>{listItem.name}</span>
                    <div className='flex flex-nowrap'>
                      {[...listItem.sharedWithUsers, listItem.owner].map(
                        (user, index) => (
                          <img
                            key={user.id}
                            src={user.avatarUrl}
                            className={`size-7 rounded-full border-2 border-[--vscode-sideBar-background] ${index !== 0 ? '-ml-4' : ''}`}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}
              />
            )}
          </>
        )}
        {!projects && <Loading />}
      </div>

      {showCreateModal && (
        <Modal componentRef={createRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Create Project
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
              value={_projectName}
              handleOnChange={setProjectName}
              label='Project Name'
              id='project-name'
              errors={projectNameErrors}
            />
            <div className='!mt-6 flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleCreateProject}
                className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
                disabled={
                  isLoading || isCreateDisabled || projectNameErrors.length > 0
                }
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

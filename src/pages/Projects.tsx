import { Project } from '@contexts/ProjectContext';
import useClickOutside from '@hooks/useClickOutside';
import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { v4 } from 'uuid';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CREATE_PROJECT,
  DELETE_PROJECT,
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_PROJECT,
  INVALID_PROJECT_DELETE,
  INVALID_UUID,
  UNAUTHORIZED_ACCESS,
  UPDATE_PROJECT,
} from '@commands/CommandConstants';
import { Dropdown } from '@components/Dropdown';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { ReloadButton } from '@components/ReloadButton';
import { TextInput } from '@components/TextInput';
import { messageHandler } from '@utils/MessageHandler';

export const getProjects = async (
  setProjects: React.Dispatch<React.SetStateAction<Project[] | undefined>>,
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
        (project: any): Project => ({
          id: project.id,
          name: project.name,
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
    componentRef: updateRef,
    showComponent: showUpdateModal,
    setShowComponent: setShowUpdateModal,
  } = useClickOutside();
  const {
    componentRef: deleteRef,
    showComponent: showDeleteModal,
    setShowComponent: setShowDeleteModal,
  } = useClickOutside();

  const [projects, setProjects] = useState<Project[]>();
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project>();
  const [updateValues, setUpdateValues] = useState<{ name: string }>({
    name: '',
  });
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    getProjects(setProjects, setIsLoggedIn, ignore);

    return () => {
      ignore = true;
    };
  }, []);

  const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setIsUpdateLoading(true);

    const requestGenerator = messageHandler.requestGenerator(
      UPDATE_PROJECT,
      v4(),
      { id: selectedProject?.id, name: updateValues.name }
    );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case UPDATE_PROJECT: {
            await getProjects(setProjects, setIsLoggedIn);
            setSelectedProject(response.payload as Project);
            break;
          }
          case INVALID_PROJECT: {
            // TODO
            console.log(INVALID_PROJECT);
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
      DELETE_PROJECT,
      v4(),
      { id: selectedProject?.id }
    );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case DELETE_PROJECT: {
            await getProjects(setProjects, setIsLoggedIn);
            setShowDeleteModal(false);
            setShowUpdateModal(false);
            break;
          }
          case INVALID_PROJECT: {
            // TODO
            console.log(INVALID_PROJECT);
            break;
          }
          case INVALID_PROJECT_DELETE: {
            // TODO
            console.log(INVALID_PROJECT_DELETE);
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

  const handleCreateProject = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator(
      CREATE_PROJECT,
      reqId,
      {
        projectName,
      }
    );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_PROJECT:
            await getProjects(setProjects, setIsLoggedIn);
            break;
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
            <div className='flex flex-col space-y-1'>
              <TextInput
                value={projectName}
                handleOnChange={setProjectName}
                label='Project Name'
                id='project-name'
              />
            </div>
            <button
              onClick={handleCreateProject}
              className='rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>

            <EditList
              list={projects}
              handleClick={(listItem) => {
                setShowUpdateModal((prevState) => !prevState);
                setUpdateValues({ name: listItem.name });
                setSelectedProject(listItem);
              }}
            />
          </>
        )}
        {!projects && <Loading />}
        {projects?.length === 0 && (
          <span className='!mt-10 w-full text-center'>No projects found</span>
        )}
      </div>

      {showUpdateModal && (
        <Modal componentRef={updateRef} visible={!showDeleteModal}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='font-bold uppercase'>Update Project</span>
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
            <TextInput
              value={updateValues.name}
              handleOnChange={(value) => setUpdateValues({ name: value })}
              label='Project Name'
              id='project-name-update'
            />
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
                  <span className='font-bold uppercase'>Delete Project</span>
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
                  <strong>{selectedProject?.name}</strong>?
                </p>
                <p>
                  This action is irreversible and will remove all shared access
                  to this project.
                </p>
                <p>
                  This will also delete all the targets, applications and
                  credentials associated with this project.
                </p>
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

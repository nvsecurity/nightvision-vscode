import useClickOutside from '@hooks/useClickOutside';
import { useUser } from '@hooks/useUser';
import { ProjectInfo } from '@types_/project';
import { User } from '@types_/user';
import { useDebounce } from 'use-debounce';
import { v4 } from 'uuid';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CLI_MISSING,
  DELETE_PROJECT,
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_PROJECT,
  INVALID_PROJECT_DELETE,
  INVALID_UUID,
  UNAUTHORIZED_ACCESS,
  UPDATE_PROJECT,
} from '@commands/CommandConstants';
import { DeleteProjectParams } from '@commands/DeleteProject';
import { UpdateProjectParams } from '@commands/UpdateProject';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { SecondaryButton } from '@components/SecondaryButton';
import { TextInput } from '@components/TextInput';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';
import { API_ERROR_TYPES, API_URL } from '@constants/GlobalConstants';

export const getProject = async (
  setProject: React.Dispatch<React.SetStateAction<ProjectInfo | undefined>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string | undefined,
  ignore: boolean = false
) => {
  if (!projectId) {
    return;
  }

  try {
    const project = await messageHandler.api({
      method: 'get',
      url: `${API_URL}/api/v1/projects/${projectId}/`,
      setIsLoggedIn: setIsLoggedIn,
    });

    if (ignore) {
      return;
    }

    setProject({
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
    });
  } catch (err: any) {
    console.error(err);
  }
};

export const getUsers = async (
  setSearchedUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  user: string,
  owner: User,
  sharedWithUsers: User[],
  addUsers: User[],
  ignore: boolean = false
) => {
  try {
    const users = (
      await messageHandler.api({
        method: 'GET',
        url: `${API_URL}/api/v1/user/?filter=${user}&is_active=true`,
        setIsLoggedIn: setIsLoggedIn,
      })
    ).results;

    if (ignore) {
      return;
    }

    setSearchedUsers(
      users
        .filter(
          (user: any) =>
            !addUsers.some((addUser) => user.id === addUser.id) &&
            !sharedWithUsers.some((sharedUser) => user.id === sharedUser.id) &&
            user.id !== owner.id
        )

        .map((user: any) => ({
          id: user.id,
          name: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url,
        }))
    );

    return {};
  } catch (err: any) {
    setSearchedUsers([]);
    if (API_ERROR_TYPES.includes(err?.type)) {
      return { errors: [err.errors] };
    } else {
      console.error(err);
      return { errors: [err] };
    }
  }
};

export const shareProject = async (
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string | undefined,
  usernames: string[]
) => {
  try {
    await messageHandler.api({
      method: 'POST',
      url: `${API_URL}/api/v1/projects/${projectId}/share/`,
      body: { usernames },
      setIsLoggedIn: setIsLoggedIn,
    });
    return {};
  } catch (err: any) {
    if (API_ERROR_TYPES.includes(err?.type)) {
      return { errors: [err.errors] };
    } else {
      console.error(err);
      return { errors: [err] };
    }
  }
};

export const unshareProject = async (
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string | undefined,
  userId: string
) => {
  try {
    await messageHandler.api({
      method: 'POST',
      url: `${API_URL}/api/v1/projects/${projectId}/unshare/`,
      body: { users: [userId] },
      setIsLoggedIn: setIsLoggedIn,
    });

    return {};
  } catch (err: any) {
    if (API_ERROR_TYPES.includes(err?.type)) {
      return { errors: [err.errors] };
    } else {
      console.error(err);
      return { errors: [err] };
    }
  }
};

export const ProjectPage = () => {
  const { projectId } = useParams();

  const navigate = useNavigate();
  const { currentUser, setIsLoggedIn, setIsCliInstalled } = useUser();

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
  const {
    componentRef: shareRef,
    showComponent: showShareModal,
    setShowComponent: setShowShareModal,
  } = useClickOutside();
  const {
    componentRef: leaveRef,
    showComponent: showLeaveModal,
    setShowComponent: setShowLeaveModal,
  } = useClickOutside();
  const {
    componentRef: unshareRef,
    showComponent: showUnshareModal,
    setShowComponent: setShowUnshareModal,
  } = useClickOutside();

  const [project, setProject] = useState<ProjectInfo>();

  const [_updateName, setUpdateName] = useState('');
  const [updateName] = useDebounce(_updateName, 500);
  const [_userName, setUserName] = useState<string>('');
  const [userName] = useDebounce(_userName, 500);
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [addUsers, setAddUsers] = useState<User[]>([]);
  const [removeUser, setRemoveUser] = useState<User>();

  const [projectNameErrors, setProjectNameErrors] = useState<string[]>([]);
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);

  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isLeaveLoading, setIsLeaveLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [isUnshareLoading, setIsUnshareLoading] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isUserAdded, setIsUserAdded] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [isProjectIdCopied, setIsProjectIdCopied] = useState(false);
  const projectIdCopyTimer = useRef<NodeJS.Timeout>();

  const hasEmptyRequiredInputs = !updateName;
  const hasErrors = projectNameErrors.length > 0;
  const hasChanges = updateName !== project?.name;

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getProject(setProject, setIsLoggedIn, projectId, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    setIsUserAdded(false);

    if (!userName) {
      setSearchedUsers([]);
      return;
    }

    if (!project) {
      return;
    }

    const fetchApi = async () => {
      setIsSearchingUser(true);
      await getUsers(
        setSearchedUsers,
        setIsLoggedIn,
        userName,
        project.owner,
        project.sharedWithUsers,
        addUsers,
        ignore
      );
      setIsSearchingUser(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [userName]);

  useEffect(() => {
    setUpdateName(project?.name ?? '');
    setUserName('');
    setSearchedUsers([]);
    setAddUsers([]);

    setProjectNameErrors([]);
    setDeleteErrors([]);
  }, [project, showUpdateModal]);

  useEffect(() => {
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

    setProjectNameErrors(errors);
  }, [updateName]);

  const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!projectId || !updateName || !project) {
      return;
    }

    setIsUpdateLoading(true);

    const requestGenerator =
      messageHandler.requestGenerator<UpdateProjectParams>(
        UPDATE_PROJECT,
        v4(),
        {
          projectId: projectId,
          newProjectName: updateName,
          project: project,
        }
      );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case UPDATE_PROJECT: {
            await getProject(setProject, setIsLoggedIn, projectId);
            setShowUpdateModal(false);
            break;
          }
          case INVALID_PROJECT:
          case INVALID_UUID: {
            navigate(-1);
            break;
          }
          case INVALID_NAME: {
            setProjectNameErrors((prevState) => [
              ...prevState,
              "Name should have a max length of 100 and should have characters 'A-Z', 'a-z', '0-9', '-', and '_' only",
            ]);
            break;
          }
          case DUPLICATE_NAME: {
            setProjectNameErrors((prevState) => [
              ...prevState,
              'Project name already exists',
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
    setIsUpdateLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!projectId || !project) {
      return;
    }

    setIsDeleteLoading(true);

    const requestGenerator =
      messageHandler.requestGenerator<DeleteProjectParams>(
        DELETE_PROJECT,
        v4(),
        {
          id: projectId,
          project: project,
        }
      );

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case DELETE_PROJECT:
          case INVALID_PROJECT:
          case INVALID_UUID: {
            navigate(-1);
            break;
          }
          case INVALID_PROJECT_DELETE: {
            setDeleteErrors((prevState) => [
              ...prevState,
              'Cannot delete because this is the currently selected project. Change the current project and try again.',
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
    setIsDeleteLoading(false);
  };

  const handleLeave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!projectId || !currentUser) {
      return;
    }

    setIsLeaveLoading(true);

    const result = await unshareProject(
      setIsLoggedIn,
      projectId,
      currentUser.id
    );

    if (!result.errors) {
      navigate(-1);
    }

    setIsLeaveLoading(false);
  };

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!projectId || addUsers.length === 0) {
      return;
    }

    setIsShareLoading(true);

    const result = await shareProject(
      setIsLoggedIn,
      projectId,
      addUsers.map((user) => user.name)
    );

    if (!result.errors) {
      await getProject(setProject, setIsLoggedIn, projectId);
      setShowShareModal(false);
    }

    setIsShareLoading(false);
  };

  const handleUnshare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!projectId || !removeUser) {
      return;
    }

    setIsUnshareLoading(true);

    const result = await unshareProject(
      setIsLoggedIn,
      projectId,
      removeUser.id
    );

    if (!result.errors) {
      await getProject(setProject, setIsLoggedIn, projectId);
      setShowUnshareModal(false);
    }

    setIsUnshareLoading(false);
  };

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <PageHeader title='Project'/>

        {!project && <Loading />}
        {project && (
          <>
            {isFetching && <Loading />}
            {!isFetching && (
              <div className='flex flex-col'>
                <div className='flex items-center justify-between'>
                  <h2 className='bold mt-2 truncate text-3xl'>
                    {project.name}
                  </h2>
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
                    {currentUser?.id !== project?.owner.id && (
                      <button
                        className='unstyled'
                        title='Leave Project'
                        onClick={() => setShowLeaveModal(true)}
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
                            d='M11.02 3.77v1.56l1-.99V2.5l-.5-.5h-9l-.5.5v.486L2 3v10.29l.36.46 5 1.72L8 15v-1h3.52l.5-.5v-1.81l-1-1V13H8V4.71l-.33-.46L4.036 3h6.984v.77zM7 14.28l-4-1.34V3.72l4 1.34v9.22zm6.52-5.8H8.55v-1h4.93l-1.6-1.6.71-.7 2.47 2.46v.71l-2.49 2.48-.7-.7 1.65-1.65z'
                          />
                        </svg>
                      </button>
                    )}
                    {currentUser?.id === project.owner.id &&
                      !project.isDefault && (
                        <>
                          <button
                            className='unstyled'
                            title='Share'
                            onClick={() => setShowShareModal(true)}
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              viewBox='0 0 24 24'
                              strokeWidth={1.5}
                              stroke='currentColor'
                              className='size-6 fill-[--vscode-sideBar-background] stroke-[--vscode-foreground]'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z'
                              />
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
                        </>
                      )}
                  </div>
                </div>
                <div className='mt-5 flex flex-col [&>*:nth-child(even)]:mb-4 [&>*:nth-child(even)]:ml-4 [&>*:nth-child(odd)]:font-bold'>
                  <span>Project ID:</span>
                  <div className='flex items-center space-x-2'>
                    <span>{projectId}</span>
                    <button
                      className='unstyled relative'
                      title='Copy'
                      onClick={() => {
                        navigator.clipboard.writeText(projectId ?? '');

                        setIsProjectIdCopied(true);
                        clearTimeout(projectIdCopyTimer.current);
                        projectIdCopyTimer.current = setTimeout(() => {
                          setIsProjectIdCopied(false);
                        }, 1000);
                      }}
                    >
                      <div
                        className={`pointer-events-none absolute bottom-[125%] right-0 z-40 h-min w-min select-none rounded bg-black px-2 transition duration-200 ${isProjectIdCopied ? 'opacity-100' : 'opacity-0'}`}
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
                    {new Date(project.createdAt).toLocaleString('en-US', {
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
                    {project.lastUpdatedAt
                      ? new Date(project.lastUpdatedAt).toLocaleString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          }
                        )
                      : 'N/A'}
                  </span>

                  <span>Collaborators:</span>
                  <ul className='!ml-0 mt-2 grid grid-cols-1 gap-3 pl-0 min-[480px]:grid-cols-2'>
                    {[project.owner, ...project.sharedWithUsers].map(
                      (user, index) => (
                        <li
                          key={user.id}
                          className='group flex items-center justify-between rounded p-2 hover:bg-[--vscode-input-background]'
                        >
                          <div className='mr-2 flex items-center space-x-3 overflow-hidden'>
                            <img
                              src={user.avatarUrl}
                              className='size-10 rounded-full border-2 border-[--vscode-sideBar-background]'
                            />
                            <div className='flex flex-col overflow-hidden'>
                              <span className='truncate'>
                                <strong>
                                  {user.firstName} {user.lastName}
                                </strong>
                              </span>
                              <span className='truncate'>{user.name}</span>
                            </div>
                          </div>
                          {index !== 0 &&
                            currentUser?.id === project.owner.id && (
                              <button
                                className='unstyled -z-50 h-min w-min opacity-0 hover:brightness-75 focus:z-0 focus:opacity-100 group-hover:z-0 group-hover:opacity-100'
                                onClick={() => {
                                  setRemoveUser(user);
                                  setShowUnshareModal(true);
                                }}
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
                            )}
                        </li>
                      )
                    )}
                  </ul>
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
                Update Project
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
              label='Project Name'
              id='update-project-name'
              errors={projectNameErrors}
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
                  hasEmptyRequiredInputs ||
                  hasErrors ||
                  !hasChanges
                }
              >
                {isUpdateLoading ? 'Updating...' : 'Update'}
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
                Delete Project
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
              Are you sure you want to delete <strong>{project?.name}</strong>?
            </p>
            <p>
              This action is irreversible and will remove all shared access to
              this project.
            </p>
            <p>
              This will also delete all the targets and
              credentials associated with this project.
            </p>
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

      {showLeaveModal && (
        <Modal componentRef={leaveRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Leave Project
              </span>
              <button
                className='unstyled'
                onClick={() => setShowLeaveModal(false)}
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
              Are you sure you want to leave <strong>{project?.name}</strong>{' '}
              project?
            </p>
            <p>
              This action is irreversible. You will no longer have access to
              associated targets, scans etc.
            </p>
            <div className='flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowLeaveModal(false)}
                disabled={isLeaveLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleLeave}
                disabled={isLeaveLoading}
                className='truncate rounded bg-red-500 hover:bg-red-500 hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-75 hover:disabled:brightness-100'
              >
                {isLeaveLoading ? 'Leaving...' : 'Leave'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showShareModal && (
        <Modal componentRef={shareRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Share Project
              </span>
              <button
                className='unstyled'
                onClick={() => setShowShareModal(false)}
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
            {addUsers.length > 0 && (
              <>
                <span className='mb-1 text-sm uppercase'>Adding</span>
                <ul className='!mt-0 pl-0'>
                  {addUsers.map((user) => (
                    <li
                      key={user.id}
                      className='flex items-center justify-between rounded p-2 hover:bg-[--vscode-input-background]'
                    >
                      <div className='mr-2 flex items-center space-x-3 overflow-hidden'>
                        <img
                          src={user.avatarUrl}
                          className='size-10 rounded-full border-2 border-[--vscode-sideBar-background]'
                        />
                        <div className='flex flex-col overflow-hidden'>
                          <span className='truncate'>
                            <strong>
                              {user.firstName} {user.lastName}
                            </strong>
                          </span>
                          <span className='truncate'>{user.name}</span>
                        </div>
                      </div>

                      <button
                        className='unstyled h-min w-min flex-shrink-0 hover:brightness-75'
                        onClick={() => {
                          setAddUsers((prevState) =>
                            prevState.filter((_user) => user.id !== _user.id)
                          );
                        }}
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
                    </li>
                  ))}
                </ul>
              </>
            )}
            <TextInput
              value={_userName}
              handleOnChange={setUserName}
              label='Search Users'
              id='user'
              isLoading={isSearchingUser}
            />
            {searchedUsers.length === 0 &&
              userName &&
              !isUserAdded &&
              !isSearchingUser && (
                <span className='inline-block w-full text-center'>
                  No users found
                </span>
              )}
            {searchedUsers.length !== 0 && (
              <ul className='pl-0'>
                {searchedUsers.map((user) => (
                  <li
                    key={user.id}
                    className='cursor-pointer rounded hover:bg-[--vscode-input-background]'
                  >
                    <div
                      className='flex !h-full !w-full items-center space-x-3 !p-2'
                      onClick={() => {
                        setAddUsers((prevState) => [...prevState, user]);
                        setIsUserAdded(true);
                        setUserName('');
                        setSearchedUsers([]);
                      }}
                    >
                      <img
                        src={user.avatarUrl}
                        className='size-10 rounded-full border-2 border-[--vscode-sideBar-background]'
                      />
                      <div className='flex flex-grow flex-col overflow-hidden'>
                        <span className='truncate'>
                          <strong>
                            {user.firstName} {user.lastName}
                          </strong>
                        </span>
                        <span className='truncate'>{user.name}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className='flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowShareModal(false)}
                disabled={isShareLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleShare}
                className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
                disabled={isShareLoading || addUsers.length === 0}
              >
                {isShareLoading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showUnshareModal && (
        <Modal componentRef={unshareRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Remove Collaborator
              </span>
              <button
                className='unstyled'
                onClick={() => setShowUnshareModal(false)}
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
              Are you sure you want to remove{' '}
              <strong>
                {removeUser?.firstName} {removeUser?.lastName} (
                {removeUser?.name})
              </strong>{' '}
              from <strong>{project?.name}</strong>?
            </p>
            <p>
              They will no longer have access to associated targets, scans etc.
            </p>
            <div className='flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowUnshareModal(false)}
                disabled={isUnshareLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleUnshare}
                disabled={isUnshareLoading}
                className='truncate rounded bg-red-500 hover:bg-red-500 hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-75 hover:disabled:brightness-100'
              >
                {isUnshareLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

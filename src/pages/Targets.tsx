import useClickOutside from '@hooks/useClickOutside';
import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Project } from '@types_/project';
import { ApiSpec, Target, TargetType } from '@types_/target';
import { v4 } from 'uuid';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CREATE_TARGET,
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_OPENAPI_EXT,
  INVALID_OPENAPI_FILE,
  INVALID_URL,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { CreateTargetParams } from '@commands/CreateTarget';
import { Dropdown } from '@components/Dropdown';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { ReloadButton } from '@components/ReloadButton';
import { SecondaryButton } from '@components/SecondaryButton';
import { TabSelector } from '@components/TabSelector';
import { TargetTypeLabel } from '@components/TargetTypeLabel';
import { TextInput } from '@components/TextInput';
import { getProjects } from '@pages/Projects';
import { messageHandler } from '@utils/MessageHandler';

export const getTargets = async (
  setTargets: React.Dispatch<React.SetStateAction<Target[] | undefined>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string,
  type?: TargetType,
  ignore: boolean = false
) => {
  try {
    const _type = type ? type.toLocaleLowerCase() + '/' : '';
    const targets = (
      await messageHandler.api(
        'get',
        `https://api.nightvision.net/api/v1/targets/${_type}?order=name&project=${projectId}`
      )
    ).results;

    if (ignore) {
      return;
    }

    setTargets(
      targets.map(
        (target: any): Target => ({
          id: target.id,
          name: target.name,
          location: target.location,
          type: target.type,
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

const types: { type: TargetType; name: string }[] = [
  { type: 'URL', name: 'Web Target' },
  { type: 'OPENAPI', name: 'API Target' },
];

const apiSpecs: { type: ApiSpec; name: string }[] = [
  { type: 'URL', name: 'OpenAPI URL' },
  { type: 'FILE', name: 'Swagger File' },
];

export const Targets = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn } = useUser();

  const {
    componentRef: createRef,
    showComponent: showCreateModal,
    setShowComponent: setShowCreateModal,
  } = useClickOutside();

  const [targets, setTargets] = useState<Target[]>();
  const [projects, setProjects] = useState<Project[]>();
  const [targetName, setTargetName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [openApiUrl, setOpenApiUrl] = useState('');
  const [swaggerFile, setSwaggerFile] = useState<File | null>();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [selectedType, setSelectedType] = useState(types[0]);
  const [selectedApiSpec, setSelectedApiSpec] = useState(apiSpecs[0]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setSwaggerFile(selectedFile);
  };

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getTargets(
        setTargets,
        setIsLoggedIn,
        currentProject.id,
        undefined,
        ignore
      );
      await getProjects(setProjects, setIsLoggedIn, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [currentProject]);

  useEffect(() => {
    setTargetName('');
    setTargetUrl('');
    setOpenApiUrl('');
    setSwaggerFile(null);

    setSelectedType(types[0]);
    setSelectedApiSpec(apiSpecs[0]);
  }, [showCreateModal]);

  const handleCreateTarget = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // TODO
    if (selectedType.type === 'OPENAPI') {
      if (selectedApiSpec.type === 'URL' && !openApiUrl.trim()) {
        return;
      }
      if (selectedApiSpec.type === 'FILE' && !swaggerFile) {
        return;
      }
    }

    const requestGenerator =
      messageHandler.requestGenerator<CreateTargetParams>(CREATE_TARGET, v4(), {
        project: currentProject,
        targetName,
        targetUrl,
        type: selectedType.type,
        apiSpecType: selectedApiSpec.type,
        openApiUrl,
        swaggerFilePath: swaggerFile?.path,
      });

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_TARGET: {
            await getTargets(setTargets, setIsLoggedIn, currentProject.id);
            setShowCreateModal(false);
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
          case INVALID_OPENAPI_EXT: {
            // TODO
            console.log(INVALID_OPENAPI_EXT);
            break;
          }
          case INVALID_OPENAPI_FILE: {
            // TODO
            console.log(INVALID_OPENAPI_FILE);
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
          <h1 className='truncate font-bold uppercase'>Targets</h1>
          <ReloadButton />
        </div>

        {targets && projects && (
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
              Create Target
            </button>

            {isFetching && <Loading />}
            {!isFetching && (
              <EditList
                list={targets}
                emptyText='No targets found'
                handleClick={(listItem) => {
                  navigate(
                    `/targets/${listItem.type.toLocaleLowerCase()}/${listItem.id}`
                  );
                }}
                renderItem={(listItem) => (
                  <div className='flex max-w-full flex-nowrap justify-between truncate'>
                    <span className='mr-2 truncate'>{listItem.name}</span>
                    <TargetTypeLabel targetType={listItem.type} />
                  </div>
                )}
              />
            )}
          </>
        )}
        {(!targets || !projects) && <Loading />}
      </div>

      {showCreateModal && (
        <Modal componentRef={createRef}>
          <div className='flex flex-col space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='truncate font-bold uppercase'>
                Create Target
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
                value={targetName}
                handleOnChange={setTargetName}
                label='Target Name'
                id='target-name'
              />
              <TextInput
                value={targetUrl}
                handleOnChange={setTargetUrl}
                label='Target URL'
                id='target-url'
              />
              {selectedType.type === 'OPENAPI' && (
                <>
                  <TabSelector
                    values={apiSpecs}
                    selected={selectedApiSpec}
                    setSelected={setSelectedApiSpec}
                    className='mt-4'
                  />

                  {selectedApiSpec.type === 'URL' && (
                    <TextInput
                      value={openApiUrl}
                      handleOnChange={setOpenApiUrl}
                      label='OpenAPI URL'
                      id='open-api-url'
                    />
                  )}

                  {selectedApiSpec.type === 'FILE' && (
                    <>
                      {!swaggerFile && (
                        <label
                          htmlFor='swagger-file'
                          className='relative !mt-4 inline-flex h-32 w-full flex-col flex-nowrap items-center justify-center truncate rounded border border-dashed border-[--vscode-foreground]'
                        >
                          <span className='w-full truncate text-center text-lg font-bold'>
                            Upload Swagger File
                          </span>
                          <span className='w-full truncate text-center'>
                            (.YML, .YAML, .JSON)
                          </span>
                          <input
                            type='file'
                            accept='.yml,.yaml,.json'
                            onChange={handleFileChange}
                            id='swagger-file'
                            className='absolute inset-0 z-10 cursor-pointer opacity-0'
                          />
                        </label>
                      )}
                      {swaggerFile && (
                        <div className='!mb-4 !mt-8 flex items-center justify-center space-x-4'>
                          <span className='truncate text-center'>
                            {swaggerFile.name}
                          </span>
                          <button
                            className='unstyled'
                            onClick={() => setSwaggerFile(null)}
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
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <div className='!mt-6 flex space-x-2'>
              <SecondaryButton
                onClick={() => setShowCreateModal(false)}
                disabled={isLoading}
              >
                Cancel
              </SecondaryButton>
              <button
                onClick={handleCreateTarget}
                className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Target'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

import useClickOutside from '@hooks/useClickOutside';
import { useUser } from '@hooks/useUser';
import { ApiSpec, TargetInfo, TargetType } from '@types_/target';
import { useDebounce } from 'use-debounce';
import { v4 } from 'uuid';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DELETE_TARGET,
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_OPENAPI_EXT,
  INVALID_OPENAPI_FILE,
  INVALID_TARGET,
  INVALID_URL,
  INVALID_UUID,
  UNAUTHORIZED_ACCESS,
  UPDATE_TARGET,
} from '@commands/CommandConstants';
import { DeleteTargetParams } from '@commands/DeleteTarget';
import { UpdateTargetParams } from '@commands/UpdateTarget';
import { Loading } from '@components/Loading';
import { Modal } from '@components/Modal';
import { ReloadButton } from '@components/ReloadButton';
import { SecondaryButton } from '@components/SecondaryButton';
import { TabSelector } from '@components/TabSelector';
import { TargetTypeLabel } from '@components/TargetTypeLabel';
import { TextInput } from '@components/TextInput';
import { messageHandler } from '@utils/MessageHandler';

export const getTarget = async (
  setTarget: React.Dispatch<React.SetStateAction<TargetInfo | undefined>>,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  targetType: string | undefined,
  targetId: string | undefined,
  ignore: boolean = false
) => {
  if (!targetType || !targetId) {
    return;
  }

  try {
    const target = await messageHandler.api(
      'get',
      `https://api.nightvision.net/api/v1/targets/${targetType.toLocaleLowerCase()}/${targetId}/`
    );

    let specUrl: string | undefined;
    if (target.has_spec_uploaded) {
      specUrl = (
        await messageHandler.api(
          'get',
          `https://api.nightvision.net/api/v1/targets/openapi/${targetId}/get-spec-url/`
        )
      ).url;
    }

    const targetApplications: { id: string; application_name: string }[] = (
      await messageHandler.api(
        'get',
        `https://api.nightvision.net/api/v1/targets/${targetId}/target-applications/`
      )
    ).results;

    if (ignore) {
      return;
    }

    setTarget({
      id: target.id,
      name: target.name,
      location: target.location,
      projectId: target.project,
      projectName: target.project_name,
      applications: targetApplications
        .map((app) => ({ id: app.id, name: app.application_name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      createdAt: new Date(target.created_at),
      lastScannedAt: target.last_scanned_at
        ? new Date(target.last_scanned_at)
        : null,
      type: targetType.toLocaleUpperCase() as TargetType,
      internetAccessible: target.internet_accessible,
      swaggerFileName: target.swaggerfile_name,
      specUrl: specUrl,
      lastSpecUploadedAt: target.last_spec_uploaded_at
        ? new Date(target.last_spec_uploaded_at)
        : null,
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

const apiSpecs: { type: ApiSpec; name: string }[] = [
  { type: 'URL', name: 'OpenAPI URL' },
  { type: 'FILE', name: 'Swagger File' },
];

export const TargetPage = () => {
  const { targetType, targetId } = useParams();

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

  const [target, setTarget] = useState<TargetInfo>();

  const [_updateName, setUpdateName] = useState('');
  const [updateName] = useDebounce(_updateName, 500);
  const [_updateLocation, setUpdateLocation] = useState<string>('');
  const [updateLocation] = useDebounce(_updateLocation, 500);
  const [_updateOpenApiUrl, setUpdateOpenApiUrl] = useState<string>('');
  const [updateOpenApiUrl] = useDebounce(_updateOpenApiUrl, 500);
  const [updateSwaggerFile, setUpdateSwaggerFile] = useState<File | null>();
  const [oldSwaggerFileName, setOldSwaggerFileName] = useState<string | null>();

  const [targetNameErrors, setTargetNameErrors] = useState<string[]>([]);
  const [targetUrlErrors, setTargetUrlErrors] = useState<string[]>([]);
  const [openApiUrlErrors, setOpenApiUrlErrors] = useState<string[]>([]);
  const [swaggerFileErrors, setSwaggerFileErrors] = useState<string[]>([]);

  const [isValidatingInput, setIsValidatingInput] = useState(true);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [selectedApiSpec, setSelectedApiSpec] = useState(apiSpecs[1]);

  const [isTargetIdCopied, setIsTargetIdCopied] = useState(false);
  const targetIdCopyTimer = useRef<NodeJS.Timeout>();

  const hasEmptyRequiredInputs =
    !updateName ||
    !updateLocation ||
    (target?.type === 'OPENAPI' &&
      ((selectedApiSpec.type === 'URL' && !updateOpenApiUrl) ||
        (selectedApiSpec.type === 'FILE' &&
          !updateSwaggerFile &&
          !oldSwaggerFileName)));

  const hasErrors =
    targetNameErrors.length > 0 ||
    targetUrlErrors.length > 0 ||
    (target?.type === 'OPENAPI' &&
      ((selectedApiSpec.type === 'URL' && openApiUrlErrors.length > 0) ||
        (selectedApiSpec.type === 'FILE' && swaggerFileErrors.length > 0)));

  const hasChanges =
    updateName !== target?.name ||
    updateLocation !== target.location ||
    (target?.type === 'OPENAPI' &&
      ((selectedApiSpec.type === 'URL' && updateOpenApiUrl) ||
        (selectedApiSpec.type === 'FILE' && !oldSwaggerFileName)));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setUpdateSwaggerFile(selectedFile);
  };

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getTarget(setTarget, setIsLoggedIn, targetType, targetId, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [targetType, targetId]);

  useEffect(() => {
    return () => {
      clearTimeout(targetIdCopyTimer.current);
    };
  }, []);

  useEffect(() => {
    setSelectedApiSpec(apiSpecs[1]);
    setUpdateName(target?.name ?? '');
    setUpdateLocation(target?.location ?? '');
    setUpdateOpenApiUrl('');
    setUpdateSwaggerFile(null);
    setOldSwaggerFileName(target?.swaggerFileName);

    setTargetNameErrors([]);
    setTargetUrlErrors([]);
    setOpenApiUrlErrors([]);
    setSwaggerFileErrors([]);
  }, [target, showUpdateModal]);

  useEffect(() => {
    setIsValidatingInput(true);
  }, [_updateName, _updateLocation, _updateOpenApiUrl]);

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

    setTargetNameErrors(errors);
    setIsValidatingInput(false);
  }, [updateName]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!updateLocation) {
      errors.push('URL is required');
    }

    setTargetUrlErrors(errors);
    setIsValidatingInput(false);
  }, [updateLocation]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!updateOpenApiUrl) {
      errors.push('URL is required');
    }

    if (
      !updateOpenApiUrl.endsWith('.yml') &&
      !updateOpenApiUrl.endsWith('.yaml') &&
      !updateOpenApiUrl.endsWith('.json')
    ) {
      errors.push(
        'The swagger specification url must have a .yml, .yaml, or .json extension'
      );
    }

    setOpenApiUrlErrors(errors);
    setIsValidatingInput(false);
  }, [updateOpenApiUrl]);

  useEffect(() => {
    if (oldSwaggerFileName) {
      return;
    }

    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!updateSwaggerFile) {
      errors.push('Swagger file is required');
    }

    if (
      !updateSwaggerFile?.path?.endsWith('.yml') &&
      !updateSwaggerFile?.path?.endsWith('.yaml') &&
      !updateSwaggerFile?.path?.endsWith('.json')
    ) {
      errors.push(
        'The swagger specification file must have a .yml, .yaml, or .json extension'
      );
    }

    setSwaggerFileErrors(errors);
    setIsValidatingInput(false);
  }, [updateSwaggerFile, oldSwaggerFileName]);

  const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!target || !targetId) {
      return;
    }

    if (target.type === 'OPENAPI') {
      if (selectedApiSpec.type === 'URL' && !updateOpenApiUrl.trim()) {
        return;
      }
      if (
        selectedApiSpec.type === 'FILE' &&
        !updateSwaggerFile &&
        !oldSwaggerFileName
      ) {
        return;
      }
    }

    setIsUpdateLoading(true);

    const requestGenerator =
      messageHandler.requestGenerator<UpdateTargetParams>(UPDATE_TARGET, v4(), {
        targetId: targetId,
        newTargetName: updateName,
        newTargetUrl: updateLocation,
        type: target.type,
        apiSpecType: selectedApiSpec.type,
        openApiUrl:
          selectedApiSpec.type === 'URL' ? updateOpenApiUrl : undefined,
        swaggerFilePath:
          selectedApiSpec.type === 'FILE' ? updateSwaggerFile?.path : undefined,
      });

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case UPDATE_TARGET: {
            await getTarget(setTarget, setIsLoggedIn, target.type, target.id);
            setShowUpdateModal(false);
            break;
          }
          case INVALID_TARGET:
          case INVALID_UUID: {
            navigate(-1);
            break;
          }
          case INVALID_NAME: {
            setTargetNameErrors((prevState) => [
              ...prevState,
              "Name should have a max length of 100 and should have characters 'A-Z', 'a-z', '0-9', '-', and '_' only",
            ]);
            break;
          }
          case INVALID_URL: {
            setTargetUrlErrors((prevState) => [...prevState, 'Invalid URL']);
            break;
          }
          case INVALID_OPENAPI_EXT: {
            if (selectedApiSpec.type === 'URL') {
              setOpenApiUrlErrors((prevState) => [
                ...prevState,
                'The swagger specification url must have a .yml, .yaml, or .json extension',
              ]);
            } else {
              setSwaggerFileErrors((prevState) => [
                ...prevState,
                'The swagger specification file must have a .yml, .yaml, or .json extension',
              ]);
            }
            break;
          }
          case INVALID_OPENAPI_FILE: {
            setOpenApiUrlErrors((prevState) => [
              ...prevState,
              'Could not download swagger specification from provided url',
            ]);
            break;
          }
          case DUPLICATE_NAME: {
            setTargetNameErrors((prevState) => [
              ...prevState,
              'Target name already exists',
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

    if (!targetId) {
      return;
    }

    setIsDeleteLoading(true);

    const requestGenerator =
      messageHandler.requestGenerator<DeleteTargetParams>(DELETE_TARGET, v4(), {
        id: targetId,
      });

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case DELETE_TARGET:
          case INVALID_TARGET:
          case INVALID_UUID: {
            navigate(-1);
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
          <h1 className='truncate font-bold uppercase'>Target</h1>
          <ReloadButton />
        </div>
        {!target && <Loading />}
        {target && (
          <>
            {isFetching && <Loading />}
            {!isFetching && (
              <div className='flex flex-col'>
                <div className='flex items-center justify-between'>
                  <h2 className='bold mt-2 truncate text-3xl'>{target.name}</h2>
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
                  <span className=''>{target.projectName}</span>

                  <span>Application(s):</span>
                  <span>
                    {target.applications.map((app) => app.name).join(', ') ||
                      'N/A'}
                  </span>

                  <span>Target Type:</span>
                  <TargetTypeLabel targetType={target.type} />

                  <span>Target Accessibility:</span>
                  <span
                    className={`w-min rounded px-2 font-bold ${target.internetAccessible ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {target.internetAccessible ? 'Public' : 'Private'}
                  </span>

                  <span>Target ID:</span>
                  <div className='flex items-center space-x-2'>
                    <span>{targetId}</span>
                    <button
                      className='unstyled relative'
                      title='Copy'
                      onClick={() => {
                        navigator.clipboard.writeText(targetId ?? '');

                        setIsTargetIdCopied(true);
                        clearTimeout(targetIdCopyTimer.current);
                        targetIdCopyTimer.current = setTimeout(() => {
                          setIsTargetIdCopied(false);
                        }, 1000);
                      }}
                    >
                      <div
                        className={`pointer-events-none absolute bottom-[125%] right-0 z-40 h-min w-min select-none rounded bg-black px-2 transition duration-200 ${isTargetIdCopied ? 'opacity-100' : 'opacity-0'}`}
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
                    {new Date(target.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    })}
                  </span>

                  <span>Last Scanned:</span>
                  <span>
                    {target.lastScannedAt
                      ? new Date(target.lastScannedAt).toLocaleString('en-US', {
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

                  <span>Base URL:</span>
                  <span>{target.location}</span>

                  {target.swaggerFileName && (
                    <>
                      <span>API Specs:</span>
                      <div className='flex items-center space-x-2'>
                        <span>{target.swaggerFileName}</span>
                        <a
                          className='unstyled'
                          href={target.specUrl ?? ''}
                          download
                          title={'Download ' + target.swaggerFileName}
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth='1.5'
                            className='size-6 stroke-[--vscode-foreground]'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3'
                            />
                          </svg>
                        </a>
                      </div>
                    </>
                  )}

                  {target.lastSpecUploadedAt && (
                    <>
                      <span>Latest update of API Specs:</span>
                      <span>
                        {new Date(target.lastSpecUploadedAt).toLocaleString(
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
                        )}
                      </span>
                    </>
                  )}
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
                Update Target
              </span>
              <button
                className='unstyled'
                title='Close'
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
            <div className='flex flex-col space-y-1'>
              <TextInput
                value={_updateName}
                handleOnChange={setUpdateName}
                label='Target Name'
                id='update-target-name'
                errors={targetNameErrors}
              />
              <TextInput
                value={_updateLocation}
                handleOnChange={setUpdateLocation}
                label='Target URL'
                id='update-target-url'
                errors={targetUrlErrors}
              />

              {target?.type === 'OPENAPI' && (
                <>
                  <TabSelector
                    values={apiSpecs}
                    selected={selectedApiSpec}
                    setSelected={setSelectedApiSpec}
                    className='mt-4'
                  />

                  <div
                    className={`${selectedApiSpec.type === 'URL' ? 'block' : 'hidden'}`}
                  >
                    <TextInput
                      value={_updateOpenApiUrl}
                      handleOnChange={setUpdateOpenApiUrl}
                      label='OpenAPI URL'
                      id='update-open-api-url'
                      errors={openApiUrlErrors}
                    />
                  </div>

                  {selectedApiSpec.type === 'FILE' && (
                    <>
                      {!oldSwaggerFileName && !updateSwaggerFile && (
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
                      {(oldSwaggerFileName || updateSwaggerFile) && (
                        <div className='!mb-4 !mt-8 flex items-center justify-center space-x-4'>
                          <span className='truncate text-center'>
                            {updateSwaggerFile?.name ?? oldSwaggerFileName}
                          </span>
                          <button
                            className='unstyled'
                            title='Remove file'
                            onClick={() => {
                              setUpdateSwaggerFile(null);
                              setOldSwaggerFileName(null);
                            }}
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
                      {swaggerFileErrors.length > 0 && (
                        <ul className='list-disc'>
                          {Array.from(new Set(swaggerFileErrors)).map(
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
                </>
              )}
            </div>
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
                {isUpdateLoading ? 'Updating...' : 'Update Target'}
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
                Delete Target
              </span>
              <button
                className='unstyled'
                title='Close'
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
              Are you sure you want to delete <strong>{target?.name}</strong>{' '}
              from your account?
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

import useClickOutside from '@hooks/useClickOutside';
import { useUser } from '@hooks/useUser';
import { ApiSpec, Target, TargetType } from '@types_/target';
import { useDebounce } from 'use-debounce';
import { v4 } from 'uuid';
import React, { useEffect } from 'react';
import { useState } from 'react';
import {
  CLI_MISSING,
  CREATE_TARGET,
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_OPENAPI_EXT,
  INVALID_OPENAPI_FILE,
  INVALID_URL,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { CreateTargetParams } from '@commands/CreateTarget';
import { Modal } from '@components/Modal';
import { SecondaryButton } from '@components/SecondaryButton';
import { TabSelector } from '@components/TabSelector';
import { TextInput } from '@components/TextInput';
import { messageHandler } from '@utils/MessageHandler';
import { Project } from '@types_/project';
import { Exclusion } from '@components/exclusion';

const types: { type: TargetType; name: string }[] = [
  { type: 'URL', name: 'Web Target' },
  { type: 'OPENAPI', name: 'API Target' },
];

const apiSpecs: { type: ApiSpec; name: string }[] = [
  { type: 'URL', name: 'OpenAPI URL' },
  { type: 'FILE', name: 'Swagger File' },
];

interface CreateTargetModalProps {
  onAfterCreate?: () => void;
  currentProject: Project;
  onClose: () => void;
  targets: Target[];
}

export const CreateTargetModal: React.FC<CreateTargetModalProps> = ({
  onAfterCreate,
  currentProject,
  onClose,
  targets,
}) => {
  const { setIsLoggedIn, setIsCliInstalled } = useUser();

  const {
    componentRef: createRef,
    showComponent: showModal,
    setShowComponent: setShowModal,
  } = useClickOutside(true);

  React.useEffect(() => {
    if (!showModal) {
      onClose();
    }
  }, [showModal]);

  const [_targetName, setTargetName] = useState('');
  const [targetName] = useDebounce(_targetName, 500);
  const [_targetUrl, setTargetUrl] = useState('');
  const [targetUrl] = useDebounce(_targetUrl, 500);
  const [_openApiUrl, setOpenApiUrl] = useState('');
  const [openApiUrl] = useDebounce(_openApiUrl, 500);
  const [swaggerFile, setSwaggerFile] = useState<File | null>();
  const [urlPatterns, setUrlPatterns] = useState<string[]>([]);
  const [xPaths, setXPaths] = useState<string[]>([]);

  const [targetNameErrors, setTargetNameErrors] = useState<string[]>([]);
  const [targetUrlErrors, setTargetUrlErrors] = useState<string[]>([]);
  const [openApiUrlErrors, setOpenApiUrlErrors] = useState<string[]>([]);
  const [swaggerFileErrors, setSwaggerFileErrors] = useState<string[]>([]);

  const [isValidatingInput, setIsValidatingInput] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedType, setSelectedType] = useState(types[0]);
  const [selectedApiSpec, setSelectedApiSpec] = useState(apiSpecs[0]);

  const hasEmptyRequiredInputs =
    !targetName ||
    !targetUrl ||
    (selectedType.type === 'OPENAPI' &&
      ((selectedApiSpec.type === 'URL' && !openApiUrl) ||
        (selectedApiSpec.type === 'FILE' && !swaggerFile)));

  const hasErrors =
    targetNameErrors.length > 0 ||
    targetUrlErrors.length > 0 ||
    (selectedType.type === 'OPENAPI' &&
      ((selectedApiSpec.type === 'URL' && openApiUrlErrors.length > 0) ||
        (selectedApiSpec.type === 'FILE' && swaggerFileErrors.length > 0)));

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setSwaggerFile(selectedFile);
  };

  useEffect(() => {
    setIsValidatingInput(true);
  }, [_targetName, _targetUrl, _openApiUrl]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!targetName) {
      errors.push('Name is required');
    }

    if (targetName.length > 100) {
      errors.push('Name must be at most 100 characters');
    }

    if (/[^\w_-]/.test(targetName)) {
      errors.push(
        "Only characters 'A-Z', 'a-z', '0-9', '-', and '_' are allowed"
      );
    }

    // O_o
    // TODO: use API request to check this info
    if (targets?.some((target) => target.name === targetName)) {
      errors.push('Target name already exists');
    }

    setTargetNameErrors(errors);
    setIsValidatingInput(false);
  }, [targetName]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!targetUrl) {
      errors.push('URL is required');
    }

    setTargetUrlErrors(errors);
    setIsValidatingInput(false);
  }, [targetUrl]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!openApiUrl) {
      errors.push('URL is required');
    }

    if (
      !openApiUrl.endsWith('.yml') &&
      !openApiUrl.endsWith('.yaml') &&
      !openApiUrl.endsWith('.json')
    ) {
      errors.push(
        'The swagger specification url must have a .yml, .yaml, or .json extension'
      );
    }

    setOpenApiUrlErrors(errors);
    setIsValidatingInput(false);
  }, [openApiUrl]);

  useEffect(() => {
    setIsValidatingInput(true);

    const errors: string[] = [];

    if (!swaggerFile) {
      errors.push('Swagger file is required');
    }

    if (
      !swaggerFile?.path?.endsWith('.yml') &&
      !swaggerFile?.path?.endsWith('.yaml') &&
      !swaggerFile?.path?.endsWith('.json')
    ) {
      errors.push(
        'The swagger specification file must have a .yml, .yaml, or .json extension'
      );
    }

    setSwaggerFileErrors(errors);
    setIsValidatingInput(false);
  }, [swaggerFile]);

  const handleCreateTarget = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

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
        openApiUrl: selectedApiSpec.type === 'URL' ? openApiUrl : undefined,
        swaggerFilePath:
          selectedApiSpec.type === 'FILE' ? swaggerFile?.path : undefined,
        excludedUrlPatterns: urlPatterns,
        excludedXPaths: selectedType.type === 'URL' ? xPaths : undefined,
      });

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_TARGET: {
            onAfterCreate?.();
            break;
          }
          case DUPLICATE_NAME: {
            setTargetNameErrors((prevState) => [
              ...prevState,
              'Target name already exists',
            ]);
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
    <Modal componentRef={createRef}>
      <div className='flex flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='truncate font-bold uppercase'>
            Create Target
          </span>
          <button
            className='unstyled'
            onClick={() => setShowModal(false)}
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
        <div className='flex flex-col space-y-1 overflow-auto'>
          <TabSelector
            values={types}
            selected={selectedType}
            setSelected={setSelectedType}
          />
          <TextInput
            value={_targetName}
            handleOnChange={setTargetName}
            label='Target Name'
            id='target-name'
            errors={targetNameErrors}
          />
          <TextInput
            value={_targetUrl}
            handleOnChange={setTargetUrl}
            label='Target URL'
            id='target-url'
            errors={targetUrlErrors}
          />
          {selectedType.type === 'OPENAPI' && (
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
                  value={_openApiUrl}
                  handleOnChange={setOpenApiUrl}
                  label='OpenAPI URL'
                  id='open-api-url'
                  errors={openApiUrlErrors}
                />
              </div>

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
          <details style={{marginTop: '1rem', overflow: 'auto'}}>
            <summary style={{fontSize: '0.9rem', marginBottom: '0.25rem'}}>EXCLUSIONS</summary>
            <div className='flex flex-col gap-2'>
              <Exclusion
                label='Exclude URL patterns'
                onAddClick={value => setUrlPatterns(old => [...old, value])}
                exclusions={urlPatterns}
                onDeleteExclusion={index => setUrlPatterns(old => {
                  const items = [...old];
                  items.splice(index, 1);
                  return items;
                })}
              />
              {selectedType.type === 'URL' && (
                <Exclusion
                  label='Exclude clicks based on XPath'
                  onAddClick={value => setXPaths(old => [...old, value])}
                  exclusions={xPaths}
                  onDeleteExclusion={index => setXPaths(old => {
                    const items = [...old];
                    items.splice(index, 1);
                    return items;
                  })}
                />
              )}
            </div>
          </details>
        </div>
        <div className='!mt-6 flex space-x-2'>
          <SecondaryButton
            onClick={() => setShowModal(false)}
            disabled={isLoading}
          >
            Cancel
          </SecondaryButton>
          <button
            onClick={handleCreateTarget}
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
  );
};

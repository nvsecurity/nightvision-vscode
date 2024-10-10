import React from 'react';
import { PageHeader } from '@components/PageHeader';
import { messageHandler } from '@utils/MessageHandler';
import { OPEN_FILE_DIALOG, SWAGGER_EXTRACT, SWAGGER_EXTRACT_ERROR, UNAUTHORIZED_ACCESS, CLI_MISSING } from '@commands/CommandConstants';
import { v4 } from 'uuid';
import { OpenFileDialogParams } from '@commands/OpenFileDialog';
import { Label } from '@components/Label';
import { Dropdown } from '@components/Dropdown';
import { IdAndName } from '@types_/idAndName';
import { SwaggerExtractParams, SwaggerExtractSuccessResults } from '@commands/SwaggerExtract';
import { useUser } from '@hooks/useUser';

const PATH_REQUIRED_ERROR = 'Path is required';

const SUPPORTED_LANGUAGES: IdAndName[] = [
  { id: 'java', name: 'Java' },
  { id: 'csharp', name: 'C#' },
  { id: 'python', name: 'Python' },
  { id: 'js', name: 'JavaScript' },
  { id: 'ruby', name: 'Ruby' },
];

export const ApiDiscoveryPage: React.FC = () => {
  const [dirPath, setDirPath] = React.useState('');
  const [pathError, setPathError] = React.useState('');
  const [pathTouched, setPathTouched] = React.useState(false);

  const [language, setLanguage] = React.useState<IdAndName>();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const [submitResults, setSubmitResults] = React.useState<SwaggerExtractSuccessResults | undefined>();

  const { setIsLoggedIn, setIsCliInstalled } = useUser();

  const clearResults = () => {
    setSubmitError('');
    setSubmitResults(undefined);
  };

  React.useEffect(() => {
    if (pathTouched && !dirPath) {
      setPathError(PATH_REQUIRED_ERROR);
    }
    else {
      setPathError('');
    }
  }, [dirPath, pathTouched]);

  React.useEffect(() => {
    clearResults();
  }, [dirPath, language]);

  const onSelectDirectory = async () => {
    const result = messageHandler.requestGenerator<OpenFileDialogParams>(
      OPEN_FILE_DIALOG,
      v4(),
      {
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select folder'
      }
    );

    try {
      for await (const response of result) {
        if (response.command === OPEN_FILE_DIALOG) {
          setDirPath(response.payload.selectedPaths[0] || '');
        }
      }
    } catch (err) {
      console.error(err);
    }

    !pathTouched && setPathTouched(true);
  };

  const onSubmit = async () => {
    clearResults();

    const result = messageHandler.requestGenerator<SwaggerExtractParams>(
      SWAGGER_EXTRACT,
      v4(),
      {
        dirPath: dirPath,
        language: language?.id || '',
      }
    );

    setIsSubmitting(true);

    try {
      for await (const response of result) {
        switch (response.command) {
          case SWAGGER_EXTRACT: {
            setSubmitResults({
              paths: response.payload.paths,
              classes: response.payload.classes,
            });
            break;
          }
          case SWAGGER_EXTRACT_ERROR: {
            setSubmitError('Error extracting API info');
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

    setIsSubmitting(false);
  };

  const submitDisabled = !dirPath || !language || !!pathError || isSubmitting;

  return (
    <div className='flex flex-col space-y-4'>
      <PageHeader title='API Discovery' reloadButton={false}/>

      <div>
        <Label htmlFor='path-to-folder'>
          Path to the root directory of your API
        </Label>

        <div className='flex flex-row gap-2'>
          <input
            value={dirPath}
            onClick={() => onSelectDirectory()}
            id='path-to-folder'
            placeholder='Select'
            disabled={!!dirPath}
            readOnly
          />
          {dirPath && (
            <button
              className='unstyled'
              title='Delete'
              onClick={() => setDirPath('')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill='currentColor'
                className='mt-0 h-6 w-6 fill-[--vscode-foreground]'
                viewBox="0 0 256 256"
              >
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"
                  ></path>
              </svg>
            </button>
          )}
        </div>

        {pathError && (
          <ul className='list-disc'>
            <li className='font-semibold text-red-600'>
              {pathError}
            </li>
          </ul>
        )}
      </div>

      <div>
        <Label htmlFor='language'>API language</Label>
        <Dropdown
          selectedItem={language}
          items={SUPPORTED_LANGUAGES}
          handleChange={setLanguage}
          optional={!language}
          optionalText={'--Please select a language--'}
          id='language'
        />
      </div>

      <button
        onClick={() => onSubmit()}
        className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
        disabled={submitDisabled}
      >
        {isSubmitting ? 'Generating OpenAPI Spec...' : 'Generate OpenAPI Spec'}
      </button>

      {submitError ? (
        <ul className='list-disc'>
          <li className='font-semibold text-red-600'>
            {submitError}
          </li>
        </ul>
      ) : (
        submitResults && (
          <div className='flex flex-col gap-2'>
            <span>
              {`Number of discovered path: ${submitResults.paths}`}
            </span>
            <span>
              {`Number of discovered classes: ${submitResults.classes}`}
            </span>
          </div>
        )
      )}
    </div>
  );
};

import React from 'react';
import { PageHeader } from '@components/PageHeader';
import { messageHandler } from '@utils/MessageHandler';
import { OPEN_FILE_DIALOG, VALIDATE_FILE_PATH, SWAGGER_EXTRACT, SWAGGER_EXTRACT_ERROR, UNAUTHORIZED_ACCESS, CLI_MISSING } from '@commands/CommandConstants';
import { v4 } from 'uuid';
import { OpenFileDialogParams } from '@commands/OpenFileDialog';
import { Label } from '@components/Label';
import { Dropdown } from '@components/Dropdown';
import { IdAndName } from '@types_/idAndName';
import { SwaggerExtractParams, SwaggerExtractSuccessResults } from '@commands/SwaggerExtract';
import { FilePathValidatorParams } from '@commands/FilePathValidator';
import { useUser } from '@hooks/useUser';
import { CONTACT_EMAIL } from '@constants/GlobalConstants';

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
  const [submitError, setSubmitError] = React.useState<React.ReactElement | string>('');
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
        if (response.command === OPEN_FILE_DIALOG && response.payload.selectedPaths[0]) {
          setDirPath(response.payload.selectedPaths[0]);
          validateDirPath(response.payload.selectedPaths[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }

    !pathTouched && setPathTouched(true);
  };

  const validateDirPath = async (filePath: string): Promise<boolean> => {
    const result = messageHandler.requestGenerator<FilePathValidatorParams>(
      VALIDATE_FILE_PATH,
      v4(),
      { filePath, mustBeDirectory: true }
    )

    try {
      for await (const response of result) {
        if (response.command === VALIDATE_FILE_PATH) {
          response.payload.error && setPathError(response.payload.error);
          return response.payload.valid;
        }
      }
    } catch (err) {
      console.error(err);
    }

    return false;
  }

  const onSubmit = async () => {
    clearResults();

    const isValid = await validateDirPath(dirPath);
    if (!isValid) {
      return;
    }

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
            setSubmitError(<span>
              Error extracting API info. Please recheck the entered Path to the Root Directory and selected Language, then try again. If the problem persists, contact us at
              <a href={`mailto:${CONTACT_EMAIL}`}>
                &nbsp;{CONTACT_EMAIL}
              </a>.
            </span>
            );
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
            type="text"
            value={dirPath}
            onChange={(e) => setDirPath(e.target.value)}
            onBlur={(e) => validateDirPath(e.target.value)}
            id="path-to-folder"
            placeholder="Select or paste path"
          />
          <button
            type="button"
            className="unstyled"
            title="Select Directory"
            onClick={onSelectDirectory}
          >
            <CustomFileSelectIcon />
          </button>
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
              {`Number of discovered paths: ${submitResults.paths}`}
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

const CustomFileSelectIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32">
    <path d="M4 20V56C4 58.2 5.8 60 8 60H56C58.2 60 60 58.2 60 56V24C60 21.8 58.2 20 56 20H30L26 14H8C5.8 14 4 15.8 4 18V20Z" fill="#CCCCCC"/>
    <path d="M32 32L32 48M32 32L24 40M32 32L40 40" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
);
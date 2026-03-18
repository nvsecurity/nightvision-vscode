import React from 'react';
import { PageHeader } from '@components/PageHeader';
import { messageHandler } from '@utils/MessageHandler';
import { EXECUTION_LOGS, OPEN_FILE_DIALOG, VALIDATE_FILE_PATH, SWAGGER_EXTRACT, SWAGGER_EXTRACT_ERROR, UNAUTHORIZED_ACCESS, CLI_MISSING, SWAGGER_EXTRACT_NO_PATHS_FOUND } from '@commands/CommandConstants';
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
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'java', name: 'Java' },
  { id: 'js', name: 'JavaScript/TypeScript' },
  { id: 'php', name: 'PHP' },
  { id: 'python', name: 'Python' },
  { id: 'ruby', name: 'Ruby' },
];

export const ApiDiscoveryPage: React.FC = () => {
  const [dirPath, setDirPath] = React.useState('');
  const [pathError, setPathError] = React.useState('');
  const [pathTouched, setPathTouched] = React.useState(false);

  const [language, setLanguage] = React.useState<IdAndName>();
  const [fileFormat, setFileFormat] = React.useState('yml');
  const [verbose, setVerbose] = React.useState(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<React.ReactElement | string>('');
  const [submitResults, setSubmitResults] = React.useState<SwaggerExtractSuccessResults | undefined>();
  const [isDisplayLogs, setIsDisplayLogs] = React.useState(false);
  const [executionLogs, setExecutionLogs] = React.useState<string[]>([]);
  const [isLogsCopied, setIsLogsCopied] = React.useState(false);

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
        verbose: verbose && isDisplayLogs,
        fileFormat: fileFormat,
      }
    );

    setIsSubmitting(true);
    setExecutionLogs([]);

    try {
      for await (const response of result) {
        switch (response.command) {
          case EXECUTION_LOGS: {
            setExecutionLogs((prev) => [...prev, response.payload.message]);
            break;
          }
          case SWAGGER_EXTRACT: {
            setSubmitResults({
              paths: response.payload.paths,
              classes: response.payload.classes,
            });
            break;
          }
          case SWAGGER_EXTRACT_NO_PATHS_FOUND: {
            setSubmitError(<span>
              We scanned your repository but couldn't identify any API endpoints. This could be a limitation in our detection tool
              or an issue with the location/format of your API definitions. Please ensure your API specifications are properly formatted and located in the expected directories. If the problem persists, contact us at
              <a href={`mailto:${CONTACT_EMAIL}`}>
                &nbsp;{CONTACT_EMAIL}
              </a>.
            </span>
            );
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

  /**
   * Formats a log message by wrapping occurrences of specific keywords with a <span>
   * that sets the appropriate color.
   */
  const formatLogMessage = (log: string): React.ReactNode[] => {
    const keywords = [
      { keyword: "ERROR", color: "red" },
      { keyword: "WARN", color: "orange" },
      { keyword: "INFO", color: "green" },
      { keyword: "DEBUG", color: "blue" }
    ];

    // Start with the entire log as a single string node.
    let nodes: React.ReactNode[] = [log];

    // Iterate over each keyword and replace occurrences in text nodes.
    keywords.forEach(({ keyword, color }) => {
      const newNodes: React.ReactNode[] = [];
      nodes.forEach((node) => {
        if (typeof node === "string") {
          // Split the string on the keyword.
          const parts = node.split(keyword);
          // Reconstruct with the colored keyword in between.
          parts.forEach((part, index) => {
            newNodes.push(part);
            if (index < parts.length - 1) {
              newNodes.push(
                <span key={Math.random()} style={{ color, fontWeight: "bold" }}>
                  {keyword}
                </span>
              );
            }
          });
        } else {
          // If it's already a React element, leave it unchanged.
          newNodes.push(node);
        }
      });
      nodes = newNodes;
    });

    return nodes;
  }

  // Handler to copy the logs to the clipboard.
  const handleCopyLogs = () => {
    const logsText = executionLogs.join("\n");
    navigator.clipboard.writeText(logsText).then(
      () => {
        setIsLogsCopied(true);
        setTimeout(() => {
          setIsLogsCopied(false);
        }, 1000);
      },
      () => {
        console.error("Failed to copy logs to clipboard");
      }
    );
  };

  const submitDisabled = !dirPath || !language || !!pathError || isSubmitting;

  return (
    <div className='flex flex-col space-y-4'>
      <PageHeader title='API Discovery' reloadButton={false} />

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

      <div>
        <label className="mb-1 text-sm uppercase">File Format</label>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
            <input
              type="radio"
              id="json"
              name="file-format"
              value="json"
              checked={fileFormat === "json"}
              onChange={() => setFileFormat("json")}
              className="custom-radio"
            />
            <label htmlFor="json" className="custom-radio-label">JSON</label>
          </div>
          <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
            <input
              type="radio"
              id="yml"
              name="file-format"
              value="yml"
              checked={fileFormat === "yml"}
              onChange={() => setFileFormat("yml")}
              className="custom-radio"
            />
            <label htmlFor="yml" className="custom-radio-label">YML</label>
          </div>
        </div>

        <style>{`
        .custom-radio, .custom-radio-label {
          cursor: pointer;
        }
      `}</style>
      </div>

      <div>
        <label className="mb-1 text-sm uppercase">Logging</label>
        <div style={{ display: "flex", alignItems: "left" }} className="isDisplayLogs-checkbox">
          <input
            type="checkbox"
            id="isDisplayLogs"
            className='unstyled isDisplayLogs-checkbox'
            checked={isDisplayLogs}
            onChange={(e) => setIsDisplayLogs(e.target.checked)}
          />
          <label htmlFor="isDisplayLogs" className="ml-2 isDisplayLogs-checkbox">
            Display execution logs
          </label>
        </div>

        {isDisplayLogs && (
          <div style={{ display: "flex", alignItems: "left" }} className="verbose-checkbox">
            <input
              type="checkbox"
              id="verbose"
              className='unstyled verbose-checkbox'
              checked={verbose}
              onChange={(e) => setVerbose(e.target.checked)}
            />
            <label htmlFor="verbose" className="ml-2 verbose-checkbox">
              Capture debug level messages
            </label>
          </div>
        )}


        <style>{`
          .verbose-checkbox, .isDisplayLogs-checkbox {
            cursor: pointer;
          }
        `}</style>
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
            <span className='font-bold text-green-600 mb-2'>
              {`OpenAPI Spec generated!`}
            </span>
            <span className='font-bold underline'>
              {`Nightvision Extractor found:`}
            </span>
            <span>
              {`Paths: ${submitResults.paths}`}
            </span>
            <span>
              {`Classes: ${submitResults.classes}`}
            </span>
          </div>
        )
      )}

      {(isSubmitting || submitResults || (executionLogs && executionLogs.length > 0)) && isDisplayLogs && (
        <div>
          <h2>Execution Logs</h2>
          <div
            style={{
              height: "300px",
              overflowY: "scroll",
              border: "1px solid #ccc",
              padding: "0.5rem",
            }}
            className='relative !ml-0'
          >
            <button
              type="button"
              className="unstyled absolute right-3 top-3 !size-10 rounded !bg-white"
              title="Copy Logs to Clipboard"
              onClick={handleCopyLogs}
            >
              <div
                className={`pointer-events-none absolute top-[125%] right-0 z-40 h-min w-min select-none rounded bg-black px-2 transition duration-200 ${isLogsCopied ? 'opacity-100' : 'opacity-0'}`}
              >
                Copied!
              </div>
              <CustomCopyIcon />
            </button>
            {executionLogs.map((log, index) => (
              <div
                key={index}
                style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}
              >
                {formatLogMessage(log)}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

const CustomFileSelectIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32">
    <path d="M4 20V56C4 58.2 5.8 60 8 60H56C58.2 60 60 58.2 60 56V24C60 21.8 58.2 20 56 20H30L26 14H8C5.8 14 4 15.8 4 18V20Z" fill="#CCCCCC" />
    <path d="M32 32L32 48M32 32L24 40M32 32L40 40" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CustomCopyIcon: React.FC = () => (
  <svg
    viewBox='0 0 16 16'
    xmlns='http://www.w3.org/2000/svg'
    className='m-auto h-6 w-6 fill-black'
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
);

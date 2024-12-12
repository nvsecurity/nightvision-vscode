import useClickOutside from '@hooks/useClickOutside';
import React from 'react';
import { Modal } from '@components/Modal';
import { TextInput } from '@components/TextInput';
import { Project } from '@types_/project';
import { useDebounce } from 'use-debounce';
import { Auth, AuthHeader, AuthType } from '@types_/auth';
import { messageHandler } from '@utils/MessageHandler';
import { CreateAuthParams } from '@commands/CreateAuth';
import { AUTH_DESCRIPTION_LENGTH, AUTH_MISSING_HEADERS, CLI_MISSING, CREATE_AUTH, DUPLICATE_NAME, INVALID_AUTH_FORM, INVALID_NAME, INVALID_URL, UNAUTHORIZED_ACCESS } from '@commands/CommandConstants';
import { v4 } from 'uuid';
import { useUser } from '@hooks/useUser';
import { TabSelector } from '@components/TabSelector';
import { SecondaryButton } from '@components/SecondaryButton';
import { Headers } from './components';
import { validateUrls } from '@utils/globalUtils';
import { checkPublicUrl } from '@queries/targetQueries';

const types: { type: AuthType; name: string }[] = [
  { type: 'COOKIE', name: 'Cookie' },
  { type: 'HEADER', name: 'Header' },
  { type: 'SCRIPT', name: 'Playwright' },
];

interface CreateAuthModalProps {
  onAfterCreate?: () => void;
  currentProject: Project;
  onClose: () => void;
  auths: Auth[];
}

export const CreateAuthModal: React.FC<CreateAuthModalProps> = ({
  onAfterCreate,
  currentProject,
  onClose,
  auths,
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

  const [_authName, setAuthName] = React.useState('');
  const [_authDescription, setAuthDescription] = React.useState('');
  const [_authHeaders, setAuthHeaders] = React.useState<AuthHeader[]>([
    { name: '', value: '' },
  ]);
  const [_authCookies, setAuthCookies] = React.useState<AuthHeader[]>([
    { name: '', value: '' },
  ]);
  const [_authUrl, setAuthUrl] = React.useState('');

  const [authName] = useDebounce(_authName, 500);
  const [authDescription] = useDebounce(_authDescription, 500);
  const [authHeaders] = useDebounce(_authHeaders, 500);
  const [authCookies] = useDebounce(_authCookies, 500);
  const [authUrl] = useDebounce(_authUrl, 500);

  const [authNameErrors, setAuthNameErrors] = React.useState<string[]>([]);
  const [authDescriptionErrors, setAuthDescriptionErrors] = React.useState<string[]>(
    []
  );
  const [authHeaderErrors, setAuthHeaderErrors] = React.useState<string[]>([]);
  const [authCookieErrors, setAuthCookieErrors] = React.useState<string[]>([]);
  const [authUrlErrors, setAuthUrlErrors] = React.useState<string[]>([]);
  const [playwrightFormErrors, setPlaywrightFormErrors] = React.useState<string[]>(
    []
  );

  const [urlChanges] = React.useState({ count: 0 });

  const [isAuthUrlTested, setIsAuthUrlTested] = React.useState(false);

  const [isValidatingUrl, setIsValidatingUrl] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [selectedType, setSelectedType] = React.useState(types[0]);

  const hasEmptyRequiredInputs =
    !authName || (selectedType.type === 'SCRIPT' && !authUrl);

  const hasErrors =
    authNameErrors.length > 0 ||
    authDescriptionErrors.length > 0 ||
    (selectedType.type === 'COOKIE' && authCookieErrors.length > 0) ||
    (selectedType.type === 'HEADER' && authHeaderErrors.length > 0) ||
    (selectedType.type === 'SCRIPT' && authUrlErrors.length > 0);

  const handleAuthUrlChange = (newUrl: string) => {
    setAuthUrlErrors([]);
    setIsValidatingUrl(false);
    urlChanges.count++;
    setAuthUrl(newUrl);
    setIsAuthUrlTested(false);
  };

  const handleAuthNameChange = (newName: string) => {
    setAuthNameErrors([]);
    setAuthName(newName);
  };

  React.useEffect(() => {
    const errors: string[] = [];

    if (!authName) {
      errors.push('Name is required');
    }

    if (authName.length > 100) {
      errors.push('Name must be at most 100 characters');
    }

    if (/[^\w_-]/.test(authName)) {
      errors.push(
        "Only characters 'A-Z', 'a-z', '0-9', '-', and '_' are allowed"
      );
    }

    // O_o
    // TODO: use API request to check this info
    if (auths?.some((auth) => auth.name === authName)) {
      errors.push('Authentication name already exists');
    }

    setAuthNameErrors(errors);
  }, [authName]);

  React.useEffect(() => {
    const errors: string[] = [];

    if (authDescription.length > 100) {
      errors.push('Description must be at most 500 characters');
    }

    setAuthDescriptionErrors(errors);
  }, [authDescription]);

  React.useEffect(() => {
    setAuthCookieErrors([]);
  }, [authCookies]);

  React.useEffect(() => {
    setAuthHeaderErrors([]);
  }, [authHeaders]);

  React.useEffect(() => {
    const validateUrl = async () => {
      setIsValidatingUrl(true);
      const currCounter = urlChanges.count;

      const errors: string[] = [];

      if (!authUrl) {
        errors.push('URL is required');
      }
      else {
        const isValid = validateUrls([authUrl]);
        if (!isValid) {
          errors.push('Invalid format');
        }
        else {
          const result = await checkPublicUrl({
            setIsLoggedIn: setIsLoggedIn,
            url: authUrl,
          });

          // Check if url was changed before applying response
          if (urlChanges.count === currCounter) {
            if (result.status === 400) {
              errors.push('Invalid format: URL schema required');
            }
            else {
              setAuthUrl(result.requested_url);
            }
            setIsAuthUrlTested(true);
          }
        }
      }

      setAuthUrlErrors(errors);
      setIsValidatingUrl(false);
    };

    if (!isAuthUrlTested) {
      validateUrl();
    }
  }, [authUrl]);

  const handleCreateAuth = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!authName) {
      return;
    }

    if (
      selectedType.type === 'COOKIE' &&
      authCookies.some((cookie) => !cookie.name || !cookie.value)
    ) {
      setAuthCookieErrors(['Cookie names and values are required']);
      return;
    }

    if (
      selectedType.type === 'HEADER' &&
      authHeaders.some((header) => !header.name || !header.value)
    ) {
      setAuthHeaderErrors(['Header names and values are required']);
      return;
    }

    if (selectedType.type === 'SCRIPT') {
      if (!authUrl) {
        return;
      }
    }

    const requestGenerator = messageHandler.requestGenerator<CreateAuthParams>(
      CREATE_AUTH,
      v4(),
      {
        project: currentProject,
        name: authName,
        type: selectedType.type,
        description: authDescription,
        headers: selectedType.type === 'COOKIE' ? authCookies : authHeaders,
        url: authUrl,
      }
    );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_AUTH: {
            onAfterCreate?.();
            break;
          }
          case AUTH_MISSING_HEADERS: {
            if (
              selectedType.type === 'COOKIE' &&
              authCookies.some((cookie) => !cookie.name || !cookie.value)
            ) {
              setAuthCookieErrors(['Cookie names and values are required']);
              return;
            }

            if (
              selectedType.type === 'HEADER' &&
              authHeaders.some((header) => !header.name || !header.value)
            ) {
              setAuthHeaderErrors(['Header names and values are required']);
              return;
            }

            break;
          }
          case AUTH_DESCRIPTION_LENGTH: {
            setAuthDescriptionErrors((prevState) => [
              ...prevState,
              'Name must be at most 500 characters',
            ]);
            break;
          }
          case DUPLICATE_NAME: {
            setAuthNameErrors((prevState) => [
              ...prevState,
              'Authentication name already exists',
            ]);
            break;
          }
          case INVALID_NAME: {
            setAuthNameErrors((prevState) => [
              ...prevState,
              "Name should have a max length of 100 and should have characters 'A-Z', 'a-z', '0-9', '-', and '_' only",
            ]);
            break;
          }
          case INVALID_URL: {
            setAuthUrlErrors((prevState) => [...prevState, 'Invalid URL']);
            break;
          }
          case INVALID_AUTH_FORM: {
            setPlaywrightFormErrors((prevState) => [
              ...prevState,
              'No authentication workflow recorded. Please log in to get authentication credentials.',
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
            Create Authentication
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
        <div className='flex flex-col space-y-1'>
          <TabSelector
            values={types}
            selected={selectedType}
            setSelected={setSelectedType}
          />
          <TextInput
            value={_authName}
            handleOnChange={handleAuthNameChange}
            label='Authentication Name'
            id='auth-name'
            errors={authNameErrors}
          />
          <TextInput
            value={_authDescription}
            handleOnChange={setAuthDescription}
            label='Description (Optional)'
            id='auth-description'
            errors={authDescriptionErrors}
          />

          <div
            className={`${selectedType.type === 'SCRIPT' ? 'block' : 'hidden'}`}
          >
            <TextInput
              value={_authUrl}
              handleOnChange={handleAuthUrlChange}
              label='Authentication URL'
              id='auth-url'
              errors={authUrlErrors}
              isLoading={isValidatingUrl}
            />

            <p className='!mt-6'>
              Will launch an incognito Chrome Window to record the login
              process. <b>Instructions</b>:
            </p>
            <ul className='!mb-4 list-disc'>
              <li>
                Follow the steps to log into the application (type in the
                username and password)
              </li>
              <li>
                When you are done, exit the Chrome window. This will upload
                the login sequence to NightVision Cloud.
              </li>
            </ul>
          </div>

          <div
            className={`flex flex-col ${selectedType.type !== 'SCRIPT' ? 'block' : 'hidden'}`}
          >
            <div
              className={`${selectedType.type === 'COOKIE' ? 'block' : 'hidden'}`}
            >
              {_authCookies.map((cookie, index) => (
                <Headers
                  key={index}
                  name={cookie.name}
                  value={cookie.value}
                  setHeaders={setAuthCookies}
                  index={index}
                  selectedType={selectedType}
                />
              ))}
            </div>

            <div
              className={`${selectedType.type === 'HEADER' ? 'block' : 'hidden'}`}
            >
              {_authHeaders.map((header, index) => (
                <Headers
                  key={index}
                  name={header.name}
                  value={header.value}
                  setHeaders={setAuthHeaders}
                  index={index}
                  selectedType={selectedType}
                />
              ))}
            </div>
            <button
              className='unstyled mt-1 flex !w-min flex-nowrap items-center justify-center self-end text-[--vscode-foreground] hover:brightness-75'
              onClick={() =>
                selectedType.type === 'HEADER'
                  ? setAuthHeaders((prevState) => [
                      ...prevState,
                      { name: '', value: '' },
                    ])
                  : setAuthCookies((prevState) => [
                      ...prevState,
                      { name: '', value: '' },
                    ])
              }
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='mt-0.5 h-5 w-5'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 4.5v15m7.5-7.5h-15'
                />
              </svg>
              <span className='text-nowrap'>Add {selectedType.name}</span>
            </button>
          </div>
          {selectedType.type === 'SCRIPT' &&
            playwrightFormErrors.length > 0 && (
              <ul className='list-disc'>
                {Array.from(new Set(playwrightFormErrors)).map((error) => (
                  <li key={error} className='font-semibold text-red-600'>
                    {error}
                  </li>
                ))}
              </ul>
            )}
          {selectedType.type !== 'SCRIPT' &&
            (selectedType.type === 'HEADER'
              ? authHeaderErrors
              : authCookieErrors
            ).length > 0 && (
              <ul className='list-disc'>
                {Array.from(
                  new Set(
                    selectedType.type === 'HEADER'
                      ? authHeaderErrors
                      : authCookieErrors
                  )
                ).map((error) => (
                  <li key={error} className='font-semibold text-red-600'>
                    {error}
                  </li>
                ))}
              </ul>
            )}
        </div>
        <div className='flex space-x-2'>
          <SecondaryButton
            onClick={() => setShowModal(false)}
            disabled={isLoading}
          >
            Cancel
          </SecondaryButton>
          <button
            onClick={handleCreateAuth}
            className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
            disabled={
              isLoading ||
              isValidatingUrl ||
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

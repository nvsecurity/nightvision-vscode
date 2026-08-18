import { DASTOptionsContext } from '@contexts/DASTOptionsContext';
import { ProjectContext } from '@contexts/ProjectContext';
import { TargetContext } from '@contexts/TargetContext';
import { UserContext } from '@contexts/UserContext';
import { Project } from '@types_/project';
import { Target } from '@types_/target';
import { User } from '@types_/user';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import {
  Link,
  Outlet,
  RouterProvider,
  createMemoryRouter,
  useRouteError,
} from 'react-router-dom';
import {
  ADD_CLI_TO_VSCODE_PATH,
  CLI_MISSING,
  CLI_VERSION,
  CREATE_TOKEN,
  DELETE_TOKENS,
  GET_CURRENT_PROJECT,
  GET_CURRENT_TARGET,
  LOGIN,
  SAVE_CURRENT_PROJECT,
  SAVE_CURRENT_TARGET,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { SaveCurrentProjectParams } from '@commands/SaveCurrentProject';
import { InstallButton } from '@components/InstallButton';
import { Layout } from '@components/Layout';
import { Loading } from '@components/Loading';
import { AuthenticationPage } from '@pages/Authentication';
import { Authentications } from '@pages/authentications';
import { NewScan } from '@pages/NewScan';
import { Overview } from '@pages/Overview';
import { ProjectPage } from '@pages/Project';
import { Projects } from '@pages/projects';
import { Reload } from '@pages/Reload';
import { Scan } from '@pages/scan';
import { Scans } from '@pages/scans';
import { Settings } from '@pages/Settings';
import { TargetPage } from '@pages/Target';
import { Targets } from '@pages/targets';
import { messageHandler } from '@utils/MessageHandler';
import { ApiDiscoveryPage } from '@pages/ApiDiscovery';
import { API_URL, CONTACT_EMAIL } from '@constants/GlobalConstants';
import { MainLayout } from './MainLayout';

const Error = () => {
  const error = useRouteError();
  console.error(error);
  return (
    <span>
      Something went wrong! Return to <Link to='/'>Overview</Link>.
    </span>
  );
};

const RequireProject: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentProject } = React.useContext(ProjectContext);
  if (!currentProject) {
    return (
      <div className='flex flex-col space-y-4'>
        <span>Please <Link to='/projects' className='underline'>select or create a project</Link> first.</span>
      </div>
    );
  }
  return children;
};

const router = createMemoryRouter(
  [
    {
      path: '',
      element: <MainLayout />,
      errorElement: <Error />,
      children: [
        { path: '/', element: <Overview /> },
        {
          path: '/scans',
          element: <RequireProject><Scans /></RequireProject>,
        },
        {
          path: '/scans/new-scan/:targetType',
          element: <RequireProject><NewScan /></RequireProject>,
        },
        {
          path: '/scans/:scanId',
          element: <RequireProject><Scan /></RequireProject>,
        },
        {
          path: '/authentications',
          element: <RequireProject><Authentications /></RequireProject>,
        },
        {
          path: '/authentications/:authId',
          element: <RequireProject><AuthenticationPage /></RequireProject>,
        },
        {
          path: '/projects',
          element: <Projects />,
        },
        {
          path: '/projects/:projectId',
          element: <ProjectPage />,
        },
        {
          path: '/targets',
          element: <RequireProject><Targets /></RequireProject>,
        },
        {
          path: '/targets/:targetType/:targetId',
          element: <RequireProject><TargetPage /></RequireProject>,
        },
        {
          path: '/api-discovery',
          element: <ApiDiscoveryPage />,
        },
        {
          path: '/settings',
          element: <Settings />,
        },
        {
          path: '/reload',
          element: <Reload />,
        },
      ],
    },
  ],
  { initialEntries: ['/'] }
);

export const App = () => {
  const [isShowDASTOptions, setIsShowDASTOptions] = useState<Boolean>();
  const [currentProject, setCurrentProject] = useState<Project>();
  const [currentTarget, setCurrentTarget] = useState<Target>();
  const [currentUser, setCurrentUser] = useState<User>();
  const [cliVersion, setCliVersion] = useState<string | null>();
  const [cliPath, setCliPath] = useState<string | undefined>();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isCliInstalled, setIsCliInstalled] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleLogin = async () => {
    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator(LOGIN, reqId);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case LOGIN: {
            await createToken();
            setIsLoggedIn(true);
            setIsLoading(true);
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTargetChange = async (target: Target | undefined) => {
    setCurrentTarget(target);
    await messageHandler.request(SAVE_CURRENT_TARGET, { ...target });
  };

  const handleProjectChange = async (project: Project) => {
    setCurrentProject(project);

    const generator = messageHandler.requestGenerator<SaveCurrentProjectParams>(
      SAVE_CURRENT_PROJECT,
      v4(),
      { id: project.id, name: project.name }
    );
    for await (const response of generator) {
      switch (response.command) {
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
  };

  const getCurrentProject = async (ignore: boolean) => {
    const currentProjectGenerator =
      messageHandler.requestGenerator(GET_CURRENT_PROJECT);
    for await (const response of currentProjectGenerator) {
      switch (response.command) {
        case GET_CURRENT_PROJECT: {
          if (!ignore) {
            setCurrentProject(response.payload);
          }
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
  };

  const getCurrentTarget = async (ignore: boolean) => {
    const currentProjectGenerator =
      messageHandler.requestGenerator(GET_CURRENT_TARGET);
    for await (const response of currentProjectGenerator) {
      switch (response.command) {
        case GET_CURRENT_TARGET: {
          if (!ignore) {
            setCurrentTarget(response.payload);
          }
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
  };

  const createToken = async () => {
    const createTokenGenerator = messageHandler.requestGenerator(CREATE_TOKEN);
    for await (const response of createTokenGenerator) {
      switch (response.command) {
        case CREATE_TOKEN: {
          return {
            tokens: response.payload.tokens,
            currentToken: response.payload.currentToken,
          };
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
  };

  const getCliVersion = async () => {
    const requestGenerator = messageHandler.requestGenerator(CLI_VERSION);
    for await (const response of requestGenerator) {
      switch (response.command) {
        case CLI_VERSION: {
          setCliVersion(response.payload.version);
          setCliPath(response.payload.path);
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
  };

  /*
    This method tries to clean up the tokens saved in the extension's context.
    The purpose is to always delete the tokens that were created by using the VSCode extension.
    We save it under 'tokens' key in the context.
    This method first fetches all the tokens from the API and then compares them with the tokens saved in the context.
    If the token is in the context but not in the API response, it means that the token is not valid anymore.
    So we delete it from the context.
    Then, we delete all tokens created by the extension but is not the current token.

    The trouble of having this function would be avoided if we were able to provide the digest of the token upon creation...
  */
  const deleteTokens = async ({
    tokens,
    currentToken,
  }: {
    tokens: string[];
    currentToken: string;
  }) => {
    try {
      let apiTokens: { digest: string; token_key: string }[] = [];
      let url = `${API_URL}/api/v1/auth/cli/token/`;

      while (true) {
        const response = await messageHandler.api({
          method: 'GET',
          url: url,
        });
        apiTokens = [...apiTokens, ...response.results];

        if (response.next) {
          url = response.next;
          continue;
        }
        break;
      }

      const missingTokens = tokens.filter(
        (token) => !apiTokens.some((apiToken) => token === apiToken.token_key)
      );

      await messageHandler.request(DELETE_TOKENS, missingTokens);

      for (const token of apiTokens) {
        if (
          token.token_key === currentToken ||
          !tokens.some((_token: string) => _token === token.token_key)
        ) {
          continue;
        }

        try {
          await messageHandler.api({
            method: 'DELETE',
            url: `${API_URL}/api/v1/auth/cli/token/${token.digest}/`,
          });
          await messageHandler.request(DELETE_TOKENS, [token.token_key]);
        } catch (err) {
          console.error(`Error cleaning up old token with digest ${token.digest}: ${err}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getUser = async () => {
    try {
      const user = (
        await messageHandler.api({
          method: 'get',
          url: `${API_URL}/api/v1/user/me/`,
          setIsLoggedIn: setIsLoggedIn,
        })
      ).user;

      setCurrentUser({
        id: user.id,
        name: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let ignore = false;

    setCurrentProject(undefined);
    setCurrentTarget(undefined);
    setStartupError(null);

    (async () => {
      try {
        // Adding CLI executable to VSCode PATH
        for await (const _ of messageHandler.requestGenerator(ADD_CLI_TO_VSCODE_PATH)) {}

        const results = await Promise.allSettled([
          getCurrentProject(ignore),
          getCurrentTarget(ignore),
          createToken(),
          getCliVersion(),
        ]);

        const errors: string[] = [];
        for (const r of results) {
          if (r.status === 'rejected') {
            const reason: any = r.reason;
            const message = (reason && typeof reason.message === 'string')
              ? reason.message
              : String(reason);
            errors.push(message);
          }
        }

        if (errors.length > 0) {
          console.error('Startup errors:', errors);
          if (!ignore) {
            setStartupError(errors.join('\n\n'));
          }
        } else {
          const tokenResult = results[2];
          if (tokenResult.status === 'fulfilled' && tokenResult.value) {
            deleteTokens(tokenResult.value); // Do not await - this can be done in parallel
            await getUser();
          }
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          const e: any = err;
          const message = (e && typeof e.message === 'string') ? e.message : String(e);
          setStartupError(message);
        }
      }
      setIsLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, isCliInstalled, retryCount]);

  if (!isCliInstalled) {
    return (
      <Layout>
        <InstallButton
          installText='Install NightVison CLI'
          installingText='Installing...'
          isUpdateCLI={false}
          setIsCliInstalled={(installed) => {
            setIsCliInstalled(installed);
            if (installed) {
              setCliVersion(process.env.CLI_VERSION);
            }
          }}
        />
      </Layout>
    );
  } else if (!isLoggedIn) {
    return (
      <Layout>
        <button onClick={handleLogin} className='mt-4 truncate rounded'>
          Log in to NightVision
        </button>
      </Layout>
    );
  } else if (startupError) {
    return (
      <Layout>
        <div className='mt-4 flex flex-col gap-3'>
          <h2 className='font-bold text-red-600'>NightVision failed to start</h2>
          <p className='whitespace-pre-wrap'>{startupError}</p>
          <p>
            If the problem persists, please contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
          <button
            onClick={() => {
              setStartupError(null);
              setIsLoading(true);
              setRetryCount((c) => c + 1);
            }}
            className='mt-2 truncate rounded'
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  } else if (isLoading) {
    return <Loading />;
  }

  return (
    <React.StrictMode>
      <Layout>
        <UserContext.Provider
          value={{
            currentUser,
            setIsLoggedIn,
            cliVersion,
            setCliVersion,
            cliPath,
            setCliPath,
            setIsCliInstalled,
          }}
        >
          <DASTOptionsContext.Provider
            value={{
              isShowDASTOptions: isShowDASTOptions ? true : false,
              setIsShowDASTOptions: setIsShowDASTOptions,
            }}
          >
            <ProjectContext.Provider
              value={{
                currentProject,
                setCurrentProject: handleProjectChange,
              }}
            >
              <TargetContext.Provider
                value={{
                  currentTarget,
                  setCurrentTarget: handleTargetChange,
                }}
              >
                <RouterProvider router={router} />
              </TargetContext.Provider>
            </ProjectContext.Provider>
          </DASTOptionsContext.Provider>
        </UserContext.Provider>
      </Layout>
    </React.StrictMode>
  );
};

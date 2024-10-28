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
import { API_URL } from '@constants/GlobalConstants';

const Error = () => {
  const error = useRouteError();
  console.error(error);
  return (
    <span>
      Something went wrong! Return to <Link to='/'>Overview</Link>.
    </span>
  );
};

const router = createMemoryRouter(
  [
    {
      path: '',
      element: <Outlet />,
      errorElement: <Error />,
      children: [
        { path: '/', element: <Overview /> },
        {
          path: '/scans',
          element: <Scans />,
        },
        {
          path: '/scans/new-scan/:targetType',
          element: <NewScan />,
        },
        {
          path: '/scans/:scanId',
          element: <Scan />,
        },
        {
          path: '/authentications',
          element: <Authentications />,
        },
        {
          path: '/authentications/:authId',
          element: <AuthenticationPage />,
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
          element: <Targets />,
        },
        {
          path: '/targets/:targetType/:targetId',
          element: <TargetPage />,
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
  const [currentProject, setCurrentProject] = useState<Project>();
  const [currentTarget, setCurrentTarget] = useState<Target>();
  const [currentUser, setCurrentUser] = useState<User>();
  const [cliVersion, setCliVersion] = useState<string | null>();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isCliInstalled, setIsCliInstalled] = useState(true);

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
        await messageHandler.api({
          method: 'DELETE',
          url: `${API_URL}/api/v1/auth/cli/token/${token.digest}/`,
        });
        await messageHandler.request(DELETE_TOKENS, [token.token_key]);
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

    (async () => {
      try {
        const promises = await Promise.all([
          getCurrentProject(ignore),
          getCurrentTarget(ignore),
          createToken(),
          getCliVersion(),
        ]);

        if (promises[2]) {
          await deleteTokens(promises[2]);
          await getUser();
        }
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, isCliInstalled]);

  if (!isCliInstalled) {
    return (
      <Layout>
        <InstallButton
          installText='Install NightVison CLI'
          installingText='Installing...'
          setIsCliInstalled={setIsCliInstalled}
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
  } else if (isLoading || !currentProject) {
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
            setIsCliInstalled,
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
        </UserContext.Provider>
      </Layout>
    </React.StrictMode>
  );
};

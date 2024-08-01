import { AppContext } from '@contexts/AppContext';
import { ProjectContext } from '@contexts/ProjectContext';
import { TargetContext } from '@contexts/TargetContext';
import { UserContext } from '@contexts/UserContext';
import { Application } from '@types_/app';
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
  CREATE_TOKEN,
  DELETE_TOKENS,
  GET_CURRENT_APP,
  GET_CURRENT_PROJECT,
  GET_CURRENT_TARGET,
  LOGIN,
  SAVE_CURRENT_APP,
  SAVE_CURRENT_PROJECT,
  SAVE_CURRENT_TARGET,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { Layout } from '@components/Layout';
import { Loading } from '@components/Loading';
import { ApplicationPage } from '@pages/Application';
import { Applications } from '@pages/Applications';
import { AuthenticationPage } from '@pages/Authentication';
import { Authentications } from '@pages/Authentications';
import { NewScan } from '@pages/NewScan';
import { Overview } from '@pages/Overview';
import { ProjectPage } from '@pages/Project';
import { Projects } from '@pages/Projects';
import { Reload } from '@pages/Reload';
import { Scan } from '@pages/Scan';
import { Scans } from '@pages/Scans';
import { Settings } from '@pages/Settings';
import { TargetPage } from '@pages/Target';
import { Targets } from '@pages/Targets';
import { messageHandler } from '@utils/MessageHandler';

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
          path: '/scans/new-scan',
          element: <NewScan />,
        },
        {
          path: '/scans/:scanId',
          element: <Scan />,
        },
        {
          path: '/applications',
          element: <Applications />,
        },
        {
          path: '/applications/:appId',
          element: <ApplicationPage />,
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
  const [currentApp, setCurrentApp] = useState<Application>();
  const [currentProject, setCurrentProject] = useState<Project>();
  const [currentTarget, setCurrentTarget] = useState<Target>();
  const [currentUser, setCurrentUser] = useState<User>();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogin = async () => {
    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator(LOGIN, reqId);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case LOGIN:
            await createToken();
            setIsLoggedIn(true);
            setIsLoading(true);
            break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppChange = async (application: Application | undefined) => {
    setCurrentApp(application);
    await messageHandler.request(SAVE_CURRENT_APP, { ...application });
  };

  const handleTargetChange = async (target: Target | undefined) => {
    setCurrentTarget(target);
    await messageHandler.request(SAVE_CURRENT_TARGET, { ...target });
  };

  const handleProjectChange = async (project: Project) => {
    setCurrentProject(project);
    await messageHandler.request(SAVE_CURRENT_PROJECT, { ...project });
  };

  const getCurrentApp = async (ignore: boolean) => {
    const currentAppGenerator =
      messageHandler.requestGenerator(GET_CURRENT_APP);
    for await (const response of currentAppGenerator) {
      switch (response.command) {
        case GET_CURRENT_APP:
          if (!ignore) {
            setCurrentApp(response.payload);
          }
          break;
        case UNAUTHORIZED_ACCESS:
          setIsLoggedIn(false);
          break;
      }
    }
  };

  const getCurrentProject = async (ignore: boolean) => {
    const currentProjectGenerator =
      messageHandler.requestGenerator(GET_CURRENT_PROJECT);
    for await (const response of currentProjectGenerator) {
      switch (response.command) {
        case GET_CURRENT_PROJECT:
          if (!ignore) {
            setCurrentProject(response.payload);
          }
          break;
        case UNAUTHORIZED_ACCESS:
          setIsLoggedIn(false);
          break;
      }
    }
  };

  const getCurrentTarget = async (ignore: boolean) => {
    const currentProjectGenerator =
      messageHandler.requestGenerator(GET_CURRENT_TARGET);
    for await (const response of currentProjectGenerator) {
      switch (response.command) {
        case GET_CURRENT_TARGET:
          if (!ignore) {
            setCurrentTarget(response.payload);
          }
          break;
        case UNAUTHORIZED_ACCESS:
          setIsLoggedIn(false);
          break;
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
        case UNAUTHORIZED_ACCESS:
          setIsLoggedIn(false);
          break;
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
      let url = 'https://api.nightvision.net/api/v1/auth/cli/token/';

      while (true) {
        const response = await messageHandler.api('GET', url);
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
        await messageHandler.api(
          'DELETE',
          `https://api.nightvision.net/api/v1/auth/cli/token/${token.digest}/`
        );
        await messageHandler.request(DELETE_TOKENS, [token.token_key]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getUser = async () => {
    try {
      const user = (
        await messageHandler.api(
          'get',
          'https://api.nightvision.net/api/v1/user/me/'
        )
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

    setCurrentApp(undefined);
    setCurrentProject(undefined);
    setCurrentTarget(undefined);

    (async () => {
      try {
        const promises = await Promise.all([
          getCurrentApp(ignore),
          getCurrentProject(ignore),
          getCurrentTarget(ignore),
          createToken(),
        ]);

        if (promises[3]) {
          await deleteTokens(promises[3]);
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
  }, [isLoggedIn]);

  if (!isLoggedIn) {
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
        <UserContext.Provider value={{ currentUser, setIsLoggedIn }}>
          <AppContext.Provider
            value={{
              currentApp,
              setCurrentApp: handleAppChange,
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
          </AppContext.Provider>
        </UserContext.Provider>
      </Layout>
    </React.StrictMode>
  );
};

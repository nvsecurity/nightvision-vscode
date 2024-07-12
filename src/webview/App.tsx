import { AppContext, Application } from '@contexts/AppContext';
import { Project, ProjectContext } from '@contexts/ProjectContext';
import { ScanContext, ScanType, ScansType } from '@contexts/ScanContext';
import { Target, TargetContext } from '@contexts/TargetContext';
import { UserContext } from '@contexts/UserContext';
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
  GET_CURRENT_APP,
  GET_CURRENT_PROJECT,
  GET_CURRENT_TARGET,
  GET_NIGHTVISION_TOKEN,
  GET_SCANS,
  LIST_APP,
  LIST_PROJECT,
  LIST_TARGET,
  LOGIN,
  SAVE_CURRENT_APP,
  SAVE_CURRENT_PROJECT,
  SAVE_CURRENT_TARGET,
  SAVE_SCAN,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { Layout } from '@components/Layout';
import { Loading } from '@components/Loading';
import { Applications } from '@pages/Applications';
import { Overview } from '@pages/Overview';
import { Projects } from '@pages/Projects';
import { Scan } from '@pages/Scan';
import { Scans } from '@pages/Scans';
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
          path: '/scans/:scanId?',
          element: <Scan />,
        },
        {
          path: '/applications',
          element: <Applications />,
        },
        {
          path: '/projects',
          element: <Projects />,
        },
        {
          path: '/targets',
          element: <Targets />,
        },
      ],
    },
  ],
  { initialEntries: ['/'] }
);

export const App = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [currentApp, setCurrentApp] = useState<Application>();
  const [scans, setScans] = useState<{ [scanId: string]: ScanType }>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project>();
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentTarget, setCurrentTarget] = useState<Target>();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogin = async () => {
    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator(LOGIN, reqId);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case LOGIN:
            setIsLoggedIn(true);
            setIsLoading(true);
            break;
        }
      }

      await messageHandler.request(GET_NIGHTVISION_TOKEN);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppChange = async (application: Application) => {
    setCurrentApp(application);
    await messageHandler.request(SAVE_CURRENT_APP, { ...application });
  };

  const handleTargetChange = async (target: Target) => {
    setCurrentTarget(target);
    await messageHandler.request(SAVE_CURRENT_TARGET, { ...target });
  };

  const handleProjectChange = async (project: Project) => {
    setCurrentProject(project);
    await messageHandler.request(SAVE_CURRENT_PROJECT, { ...project });
    await Promise.all([listApps(false), listTargets(false)]);
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

  const listApps = async (ignore: boolean) => {
    const appGenerator = messageHandler.requestGenerator(LIST_APP);
    for await (const response of appGenerator) {
      switch (response.command) {
        case LIST_APP:
          if (!ignore) {
            setApps(response.payload);
          }
          break;
        case UNAUTHORIZED_ACCESS:
          setIsLoggedIn(false);
          break;
      }
    }
  };

  const listProjects = async (ignore: boolean) => {
    const projectGenerator = messageHandler.requestGenerator(LIST_PROJECT);
    for await (const response of projectGenerator) {
      switch (response.command) {
        case LIST_PROJECT:
          if (!ignore) {
            setProjects(response.payload);
          }
          break;
        case UNAUTHORIZED_ACCESS:
          setIsLoggedIn(false);
          break;
      }
    }
  };

  const listTargets = async (ignore: boolean) => {
    const targetGenerator = messageHandler.requestGenerator(LIST_TARGET);
    for await (const response of targetGenerator) {
      switch (response.command) {
        case LIST_TARGET: {
          if (!ignore) {
            setTargets(response.payload);
          }
          break;
        }
        case UNAUTHORIZED_ACCESS: {
          setIsLoggedIn(false);
          break;
        }
      }
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let ignore = false;

    setApps([]);
    setCurrentApp(undefined);
    setProjects([]);
    setCurrentProject(undefined);
    setTargets([]);
    setCurrentTarget(undefined);
    setScans({});

    (async () => {
      try {
        await Promise.all([
          listApps(ignore),
          listProjects(ignore),
          listTargets(ignore),
          getCurrentApp(ignore),
          getCurrentProject(ignore),
          getCurrentTarget(ignore),
        ]);

        const scans: ScansType = await messageHandler.request(GET_SCANS);
        const newScans = Object.fromEntries(
          Object.entries(scans).map(([scanId, scanData]) => [
            scanId,
            {
              ...scanData,
              isScanning: false,
              isError: scanData.isError || scanData.isScanning,
            },
          ])
        );
        setScans(newScans);
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    (async () => {
      if (Object.keys(scans).length > 0) {
        await messageHandler.request(SAVE_SCAN, { scans });
      }
    })();
  }, [scans]);

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

  const sortedApps = [...apps].sort((a, b) => a.name.localeCompare(b.name));
  const sortedProjects = [...projects].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedTargets = [...targets].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <React.StrictMode>
      <Layout>
        <UserContext.Provider value={{ setIsLoggedIn }}>
          <AppContext.Provider
            value={{
              apps: sortedApps,
              setApps,
              currentApp,
              setCurrentApp: handleAppChange,
            }}
          >
            <ScanContext.Provider value={{ scans, setScans }}>
              <ProjectContext.Provider
                value={{
                  projects: sortedProjects,
                  setProjects,
                  currentProject,
                  setCurrentProject: handleProjectChange,
                }}
              >
                <TargetContext.Provider
                  value={{
                    targets: sortedTargets,
                    setTargets,
                    currentTarget,
                    setCurrentTarget: handleTargetChange,
                  }}
                >
                  <RouterProvider router={router} />
                </TargetContext.Provider>
              </ProjectContext.Provider>
            </ScanContext.Provider>
          </AppContext.Provider>
        </UserContext.Provider>
      </Layout>
    </React.StrictMode>
  );
};

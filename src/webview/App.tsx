import { AppContext } from '@contexts/AppContext';
import { ProjectContext } from '@contexts/ProjectContext';
import { ScanContext, ScanType, ScansType } from '@contexts/ScanContext';
import { TargetContext } from '@contexts/TargetContext';
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
  CURRENT_PROJECT,
  GET_SCANS,
  LIST_APP,
  LIST_PROJECT,
  LIST_TARGET,
  LOGIN,
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
  const [apps, setApps] = useState<string[]>([]);
  const [scans, setScans] = useState<{ [scanId: string]: ScanType }>({});
  const [projects, setProjects] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState<string>('');
  const [targetNames, setTargetNames] = useState<string[]>([]);
  const [targetUrls, setTargetUrls] = useState<string[]>([]);

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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let ignore = false;

    setApps([]);
    setScans({});
    setProjects([]);
    setCurrentProject('');
    setTargetNames([]);
    setTargetUrls([]);

    (async () => {
      try {
        const appGenerator = messageHandler.requestGenerator(LIST_APP);
        for await (const response of appGenerator) {
          switch (response.command) {
            case LIST_APP:
              if (!ignore) {
                setApps((prevState) => [...prevState, ...response.payload]);
              }
              break;
            case UNAUTHORIZED_ACCESS:
              setIsLoggedIn(false);
              break;
          }
        }

        const projectGenerator = messageHandler.requestGenerator(LIST_PROJECT);
        for await (const response of projectGenerator) {
          switch (response.command) {
            case LIST_PROJECT:
              if (!ignore) {
                setProjects((prevState) => [...prevState, ...response.payload]);
              }
              break;
            case UNAUTHORIZED_ACCESS:
              setIsLoggedIn(false);
              break;
          }
        }

        const currentProjectGenerator =
          messageHandler.requestGenerator(CURRENT_PROJECT);
        for await (const response of currentProjectGenerator) {
          switch (response.command) {
            case CURRENT_PROJECT:
              if (!ignore) {
                setCurrentProject(response.payload);
              }
              break;
            case UNAUTHORIZED_ACCESS:
              setIsLoggedIn(false);
              break;
          }
        }

        const targetGenerator = messageHandler.requestGenerator(LIST_TARGET);
        for await (const response of targetGenerator) {
          switch (response.command) {
            case LIST_TARGET: {
              if (!ignore) {
                setTargetNames((prevState) => [
                  ...prevState,
                  ...response.payload.targetNames,
                ]);
                setTargetUrls((prevState) => [
                  ...prevState,
                  ...response.payload.targetUrls,
                ]);
              }
              break;
            }
            case UNAUTHORIZED_ACCESS: {
              setIsLoggedIn(false);
              break;
            }
          }
        }

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

  const sortedApps = [...apps].sort((a, b) => a.localeCompare(b));
  const sortedProjects = [...projects].sort((a, b) => a.localeCompare(b));

  return (
    <React.StrictMode>
      <Layout>
        <UserContext.Provider value={{ setIsLoggedIn }}>
          <AppContext.Provider value={{ apps: sortedApps, setApps }}>
            <ScanContext.Provider value={{ scans, setScans }}>
              <ProjectContext.Provider
                value={{
                  projects: sortedProjects,
                  setProjects,
                  currentProject,
                  setCurrentProject,
                }}
              >
                <TargetContext.Provider
                  value={{
                    targets: targetNames
                      .map((name, index) => ({
                        name,
                        url: targetUrls[index],
                      }))
                      .sort((a, b) => a.name.localeCompare(b.name)),
                    setTargetNames,
                    setTargetUrls,
                  }}
                >
                  {isLoggedIn ? (
                    isLoading ? (
                      <Loading />
                    ) : (
                      <RouterProvider router={router} />
                    )
                  ) : (
                    <button onClick={handleLogin}>Log in to NightVision</button>
                  )}
                </TargetContext.Provider>
              </ProjectContext.Provider>
            </ScanContext.Provider>
          </AppContext.Provider>
        </UserContext.Provider>
      </Layout>
    </React.StrictMode>
  );
};

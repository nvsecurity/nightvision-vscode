import { AppContext } from '@contexts/AppContext';
import { ScanContext, ScanType } from '@contexts/ScanContext';
import { TargetContext } from '@contexts/TargetContext';
import { UserContext } from '@contexts/UserContext';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import {
  LIST_APP,
  LIST_TARGET,
  LOGIN,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { Layout } from '@components/Layout';
import { Loading } from '@components/Loading';
import { Application } from '@pages/Application';
import { Overview } from '@pages/Overview';
import { Scan } from '@pages/Scan';
import { Target } from '@pages/Target';
import { messageHandler } from '@utils/MessageHandler';

const router = createMemoryRouter(
  [
    {
      path: '/',
      element: <Overview />,
    },
    {
      path: '/scan/:scanId?',
      element: <Scan />,
    },
    {
      path: '/application',
      element: <Application />,
    },
    {
      path: '/target',
      element: <Target />,
    },
  ],
  { initialEntries: ['/'] }
);

export const App = () => {
  const [apps, setApps] = useState<string[]>([]);
  const [scans, setScans] = useState<{ [scanId: string]: ScanType }>({});
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

    (async () => {
      try {
        const appGenerator = messageHandler.requestGenerator(LIST_APP, v4());
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

        const targetGenerator = messageHandler.requestGenerator(
          LIST_TARGET,
          v4()
        );

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
      } catch (err) {
        console.error(err);
      }

      setIsLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  const sortedApps = [...apps].sort();

  return (
    <React.StrictMode>
      <Layout>
        <UserContext.Provider value={{ setIsLoggedIn }}>
          <AppContext.Provider value={{ apps: sortedApps, setApps }}>
            <ScanContext.Provider value={{ scans, setScans }}>
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
            </ScanContext.Provider>
          </AppContext.Provider>
        </UserContext.Provider>
      </Layout>
    </React.StrictMode>
  );
};

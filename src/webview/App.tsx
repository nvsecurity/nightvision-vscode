import { AppContext } from '@contexts/AppContext';
import { UserContext } from '@contexts/UserContext';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import {
  LIST_APP,
  LOGIN,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { Layout } from '@components/Layout';
import { Loading } from '@components/Loading';
import { Application } from '@pages/Application';
import { Overview } from '@pages/Overview';
import { Scan } from '@pages/Scan';
import { messageHandler } from '@utils/MessageHandler';

const router = createMemoryRouter(
  [
    {
      path: '/',
      element: <Overview />,
    },
    {
      path: '/scan',
      element: <Scan />,
    },
    {
      path: '/application',
      element: <Application />,
    },
  ],
  { initialEntries: ['/'] }
);

export const App = () => {
  const [apps, setApps] = useState<string[]>([]);
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
      const reqId = v4();
      const requestGenerator = messageHandler.requestGenerator(LIST_APP, reqId);

      try {
        for await (const response of requestGenerator) {
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
      } catch (err) {
        console.error(err);
      }

      setIsLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  return (
    <React.StrictMode>
      <Layout>
        <UserContext.Provider value={{ setIsLoggedIn }}>
          <AppContext.Provider value={{ apps, setApps }}>
            {isLoggedIn ? (
              isLoading ? (
                <Loading />
              ) : (
                <RouterProvider router={router} />
              )
            ) : (
              <button onClick={handleLogin}>Log in to NightVision</button>
            )}
          </AppContext.Provider>
        </UserContext.Provider>
      </Layout>
    </React.StrictMode>
  );
};

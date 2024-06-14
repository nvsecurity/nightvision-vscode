import { Context } from '@contexts/Context';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Layout } from '@components/Layout';
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

  useEffect(() => {
    let ignore = false;

    (async () => {
      const reqId = v4();
      const requestGenerator = messageHandler.requestGenerator(
        'app-list',
        reqId
      );
      for await (const response of requestGenerator) {
        console.log('Received data:', response);
        switch (response.command) {
          case 'app-list':
            if (!ignore) {
              setApps((prevState) => [...prevState, ...response.payload]);
            }
            break;
        }
      }
      setIsLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <React.StrictMode>
      <Layout>
        <Context.Provider value={{ apps, setApps }}>
          {isLoading ? 'Loading...' : <RouterProvider router={router} />}
        </Context.Provider>
      </Layout>
    </React.StrictMode>
  );
};

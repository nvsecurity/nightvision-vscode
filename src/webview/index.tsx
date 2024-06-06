import { ScanContextProvider } from '@contexts/ScanContext';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Layout } from '@components/Layout';
import { Overview } from '@pages/Overview';
import { Scan } from '@pages/Scan';
import '@styles/globals.css';

const container = document.querySelector('#root');
const root = createRoot(container!);

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
  ],
  { initialEntries: ['/'] }
);

root.render(
  <React.StrictMode>
    <Layout>
      <ScanContextProvider>
        <RouterProvider router={router} />
      </ScanContextProvider>
    </Layout>
  </React.StrictMode>
);

// Webpack HMR
// @ts-expect-error
if (import.meta.webpackHot) {
  // @ts-expect-error
  import.meta.webpackHot.accept();
}

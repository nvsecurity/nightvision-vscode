import { App } from './App';
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@styles/globals.css';

const container = document.querySelector('#root');
const root = createRoot(container!);

root.render(<App />);

// Webpack HMR
// @ts-expect-error
if (import.meta.webpackHot) {
  // @ts-expect-error
  import.meta.webpackHot.accept();
}

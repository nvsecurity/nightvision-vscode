import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "../styles/global.css";

const container = document.querySelector("#root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Webpack HMR
// @ts-expect-error
if (import.meta.webpackHot) {
  // @ts-expect-error
  import.meta.webpackHot.accept();
}

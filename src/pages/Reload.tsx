import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// https://github.com/microsoft/vscode/issues/123396
// https://github.com/microsoft/vscode/issues/145248
// https://github.com/microsoft/vscode/issues/96242

// Reloading inside VSCode webviews isn't supported and causes a blank page.
// We can use vscode.commands.executeCommand("workbench.action.webview.reloadWebviewAction")
// to reload the webview, but this reload all webviews, even in other extensions.
// Just link to /reload and navigate back.
export const Reload = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const timeout = setTimeout(() => {
      if (!ignore) {
        navigate(-1);
      }
    }, 100);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, []);

  return null;
};

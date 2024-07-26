import { Application } from '@types_/app';
import { createContext } from 'react';

interface AppContextType {
  currentApp?: Application;
  setCurrentApp: (app: Application | undefined) => void;
}

export const AppContext = createContext<AppContextType>({
  currentApp: undefined,
  setCurrentApp: () => {},
});

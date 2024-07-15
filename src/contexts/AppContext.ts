import { IdAndName } from '@contexts/ProjectContext';
import { createContext } from 'react';

export interface Application extends IdAndName {}
interface AppContextType {
  currentApp?: Application;
  setCurrentApp: (app: Application | undefined) => void;
}

export const AppContext = createContext<AppContextType>({
  currentApp: undefined,
  setCurrentApp: () => {},
});

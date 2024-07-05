import { IdAndName } from '@contexts/ProjectContext';
import { Dispatch, SetStateAction, createContext } from 'react';

export interface Application extends IdAndName {}
interface AppContextType {
  apps: Application[];
  setApps: Dispatch<SetStateAction<Application[]>>;
  currentApp?: Application;
  setCurrentApp: (app: Application) => void;
}

export const AppContext = createContext<AppContextType>({
  apps: [],
  setApps: () => {},
  currentApp: undefined,
  setCurrentApp: () => {},
});

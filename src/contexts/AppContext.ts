import { Dispatch, SetStateAction, createContext } from 'react';

interface AppContextType {
  apps: string[];
  setApps: Dispatch<SetStateAction<string[]>>;
  currentApp: string;
  setCurrentApp: (app: string) => void;
}

export const AppContext = createContext<AppContextType>({
  apps: [],
  setApps: () => {},
  currentApp: '',
  setCurrentApp: () => {},
});

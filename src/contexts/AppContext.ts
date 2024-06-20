import { Dispatch, SetStateAction, createContext } from 'react';

interface AppContextType {
  apps: string[];
  setApps: Dispatch<SetStateAction<string[]>>;
}

export const AppContext = createContext<AppContextType>({
  apps: [],
  setApps: () => {},
});

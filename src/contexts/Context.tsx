import { Dispatch, SetStateAction, createContext } from 'react';

interface ContextType {
  apps: string[];
  setApps: Dispatch<SetStateAction<string[]>>;
}

export const Context = createContext<ContextType>({
  apps: [],
  setApps: () => {},
});

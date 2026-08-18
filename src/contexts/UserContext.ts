import { User } from '@types_/user';
import { Dispatch, SetStateAction, createContext } from 'react';

interface UserContextType {
  currentUser?: User;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  cliVersion: string | undefined | null;
  setCliVersion: Dispatch<SetStateAction<string | undefined | null>>;
  // Which nightvision binary the extension resolved, so an outdated CLI can be
  // told apart from a newer one the user has elsewhere on PATH (NV-4873).
  cliPath?: string;
  setCliPath: Dispatch<SetStateAction<string | undefined>>;
  setIsCliInstalled: Dispatch<SetStateAction<boolean>>;
}

export const UserContext = createContext<UserContextType>({
  currentUser: undefined,
  setIsLoggedIn: () => {},
  cliVersion: undefined,
  setCliVersion: () => {},
  cliPath: undefined,
  setCliPath: () => {},
  setIsCliInstalled: () => {},
});

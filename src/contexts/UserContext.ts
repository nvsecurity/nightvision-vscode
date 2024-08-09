import { User } from '@types_/user';
import { Dispatch, SetStateAction, createContext } from 'react';

interface UserContextType {
  currentUser?: User;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  cliVersion: string | undefined | null;
  setCliVersion: Dispatch<SetStateAction<string | undefined | null>>;
  setIsCliInstalled: Dispatch<SetStateAction<boolean>>;
}

export const UserContext = createContext<UserContextType>({
  currentUser: undefined,
  setIsLoggedIn: () => {},
  cliVersion: undefined,
  setCliVersion: () => {},
  setIsCliInstalled: () => {},
});

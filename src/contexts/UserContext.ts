import { User } from '@types_/user';
import { Dispatch, SetStateAction, createContext } from 'react';

interface UserContextType {
  currentUser?: User;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

export const UserContext = createContext<UserContextType>({
  currentUser: undefined,
  setIsLoggedIn: () => {},
});

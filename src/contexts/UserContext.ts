import { Dispatch, SetStateAction, createContext } from 'react';

interface UserContextType {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

export const UserContext = createContext<UserContextType>({
  setIsLoggedIn: () => {},
});

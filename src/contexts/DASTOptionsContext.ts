import { createContext } from 'react';

export interface DASTOptionsContextType {
  isShowDASTOptions: boolean;
  setIsShowDASTOptions: (isShowDASTOptions: boolean) => void;
}

export const DASTOptionsContext = createContext<DASTOptionsContextType>({
  isShowDASTOptions: false,
  setIsShowDASTOptions: () => {
    throw new Error('setIsShowDASTOptions called without a Provider');
  },
});
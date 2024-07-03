import { Dispatch, SetStateAction, createContext } from 'react';

interface TargetContextType {
  targets: { name: string; url: string }[];
  setTargetNames: Dispatch<SetStateAction<string[]>>;
  setTargetUrls: Dispatch<SetStateAction<string[]>>;
  currentTarget: string;
  setCurrentTarget: (app: string) => void;
}

export const TargetContext = createContext<TargetContextType>({
  targets: [],
  setTargetNames: () => {},
  setTargetUrls: () => {},
  currentTarget: '',
  setCurrentTarget: () => {},
});

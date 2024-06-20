import { Dispatch, SetStateAction, createContext } from 'react';

interface TargetContextType {
  targets: { name: string; url: string }[];
  setTargetNames: Dispatch<SetStateAction<string[]>>;
  setTargetUrls: Dispatch<SetStateAction<string[]>>;
}

export const TargetContext = createContext<TargetContextType>({
  targets: [],
  setTargetNames: () => {},
  setTargetUrls: () => {},
});

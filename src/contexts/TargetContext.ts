import { IdAndName } from '@contexts/ProjectContext';
import { createContext } from 'react';

export interface Target extends IdAndName {
  url: string;
}
interface TargetContextType {
  currentTarget?: Target;
  setCurrentTarget: (target: Target | undefined) => void;
}

export const TargetContext = createContext<TargetContextType>({
  currentTarget: undefined,
  setCurrentTarget: () => {},
});

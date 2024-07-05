import { IdAndName } from '@contexts/ProjectContext';
import { Dispatch, SetStateAction, createContext } from 'react';

export interface Target extends IdAndName {
  url: string;
}
interface TargetContextType {
  targets: Target[];
  setTargets: Dispatch<SetStateAction<Target[]>>;
  currentTarget?: Target;
  setCurrentTarget: (target: Target) => void;
}

export const TargetContext = createContext<TargetContextType>({
  targets: [],
  setTargets: () => {},
  currentTarget: undefined,
  setCurrentTarget: () => {},
});

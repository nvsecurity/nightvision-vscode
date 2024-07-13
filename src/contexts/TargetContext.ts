import { Target } from '@types_/target';
import { createContext } from 'react';

interface TargetContextType {
  currentTarget?: Target;
  setCurrentTarget: (target: Target | undefined) => void;
}

export const TargetContext = createContext<TargetContextType>({
  currentTarget: undefined,
  setCurrentTarget: () => {},
});

import { TargetContext } from '@contexts/TargetContext';
import { useContext } from 'react';

export const useTarget = () => useContext(TargetContext);

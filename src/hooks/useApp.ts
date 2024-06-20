import { AppContext } from '@contexts/AppContext';
import { useContext } from 'react';

export const useApp = () => useContext(AppContext);

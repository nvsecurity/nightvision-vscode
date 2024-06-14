import { Context } from '@contexts/Context';
import { useContext } from 'react';

export const useApps = () => useContext(Context);

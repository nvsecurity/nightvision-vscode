import { ScanContext } from '@contexts/ScanContext';
import { useContext } from 'react';

export const useScan = () => useContext(ScanContext);

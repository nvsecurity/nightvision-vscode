import { Dispatch, SetStateAction, createContext } from 'react';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ScanType {
  applicationName: string;
  targetName: string;
  projectName: string;
  createdAt: number;
  endedAt?: number;
  isScanning: boolean;
  isError: boolean;
  issues: { name: string; severity: Severity }[];
}

export interface ScansType {
  [scanId: string]: ScanType;
}

interface ScanContextType {
  scans: ScansType;
  setScans: Dispatch<SetStateAction<ScansType>>;
}

export const ScanContext = createContext<ScanContextType>({
  scans: {},
  setScans: () => {},
});

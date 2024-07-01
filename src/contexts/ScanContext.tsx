import { Dispatch, SetStateAction, createContext } from 'react';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ScanType {
  applicationName: string;
  targetName: string;
  projectName: string;
  createdAt: Date;
  endedAt?: Date;
  isScanning: boolean;
  isError: boolean;
  issues: { name: string; severity: Severity }[];
}

interface ScanContextType {
  scans: { [scanId: string]: ScanType };
  setScans: Dispatch<
    SetStateAction<{
      [scanId: string]: ScanType;
    }>
  >;
}

export const ScanContext = createContext<ScanContextType>({
  scans: {},
  setScans: () => {},
});

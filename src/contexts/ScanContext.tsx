import { Application } from '@contexts/AppContext';
import { Project } from '@contexts/ProjectContext';
import { Target } from '@contexts/TargetContext';
import { Dispatch, SetStateAction, createContext } from 'react';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface ScanType {
  application: Application;
  target: Target;
  project: Project;
  createdAt: number;
  endedAt?: number;
  requestId: string;
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

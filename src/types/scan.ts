import { Application } from '@contexts/AppContext';
import { Project } from '@contexts/ProjectContext';
import { Target } from '@types_/target';

export type Severity =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Informational'
  | 'Unspecified'
  | 'Unknown';

export const normalizedSeverity = (severity: string): Severity => {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
      return 'Low';
    case 'INFO':
      return 'Informational';
    default:
      throw new Error(`Unknown severity: ${severity}`);
  }
};

export type ScanStatus =
  | 'SUCCEEDED'
  | 'RUNNING'
  | 'ABORTED'
  | 'FAILED'
  | 'TIMED_OUT';

export interface ScanType {
  id: string;
  application: Application;
  target: Target;
  project: Project;
  createdAt: number;
  endedAt?: number;
  status: ScanStatus;
  isScanning: boolean;
  isError: boolean;
  vulnPathsStatistics?: Partial<Record<Severity, number>>;
  issues: { name: string; severity: Severity }[];
}

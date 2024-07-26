import { IdAndName } from '@contexts/ProjectContext';
import { Application } from '@types_/app';

export interface Target extends IdAndName {
  location: string;
  type: TargetType;
}

export interface TargetInfo extends Target {
  projectId: string;
  projectName: string;
  applications: Application[];
  createdAt: Date;
  lastScannedAt?: Date | null;
  internetAccessible: boolean;
  swaggerFileName?: string | null;
  specUrl?: string | null;
  lastSpecUploadedAt?: Date | null;
}

export type TargetType = 'OPENAPI' | 'URL';

export type ApiSpec = 'URL' | 'FILE';

import { IdAndName } from '@types_/idAndName';

export interface Target extends IdAndName {
  location: string;
  type: TargetType;
}

export interface TargetInfo extends Target {
  projectId: string;
  projectName: string;
  createdAt: Date;
  lastScannedAt?: Date | null;
  internetAccessible: boolean;
  swaggerFileName?: string | null;
  specUrl?: string | null;
  lastSpecUploadedAt?: Date | null;
  configuration?: {
    excludedUrlPatterns: string[];
    excludedXPaths: string[];
  }
}

export type TargetType = 'OPENAPI' | 'URL';

export type ApiSpec = 'URL' | 'FILE';

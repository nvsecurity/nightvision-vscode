import { IdAndName } from '@types_/idAndName';

export const SpecStatusEnum = {
  NoSpec: 'NO_SPEC',
  Downloading: 'DOWNLOADING',
  DownloadError: 'DOWNLOAD_ERROR',
  WaitingForUpload: 'WAITING_FOR_UPLOAD',
  Validating: 'VALIDATING',
  Invalid: 'INVALID',
  Valid: 'VALID',
  Warning: 'WARNING',
} as const;

export type SpecStatusEnum = typeof SpecStatusEnum[keyof typeof SpecStatusEnum];

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
  swaggerFileUrl?: string | null;
  specUrlForDownload?: string | null;
  lastSpecUploadedAt?: Date | null;
  specStatus?: SpecStatusEnum;
  isReadyToScan: boolean;
  configuration?: {
    excludedUrlPatterns: string[];
    excludedXPaths: string[];
  }
}

export type TargetType = 'OPENAPI' | 'URL';

export type ApiSpec = 'URL' | 'FILE';

export enum TargetTypeEnum {
  OPENAPI = 'OPENAPI',
  URL = 'URL',
}

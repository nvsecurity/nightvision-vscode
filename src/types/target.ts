import { IdAndName } from '@contexts/ProjectContext';

export interface Target extends IdAndName {
  url: string;
}

export type TargetType = 'OPENAPI' | 'URL';

export type ApiSpec = 'URL' | 'FILE';

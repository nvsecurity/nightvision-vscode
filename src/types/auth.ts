import { IdAndName } from '@contexts/ProjectContext';

export type AuthType = 'COOKIE' | 'HEADER' | 'SCRIPT';

export type AuthHeader = { name: string; value: string };

export interface Auth extends IdAndName {
  type: AuthType;
  description?: string | null;
  headers?: AuthHeader[] | null;
  url?: string | null;
}

export interface AuthInfo extends Auth {
  projectId: string;
  projectName: string;
  createdAt: Date;
  lastUpdatedAt?: Date | null;
  scriptContent?: string;
}

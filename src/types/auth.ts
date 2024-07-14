import { IdAndName } from '@contexts/ProjectContext';

export type AuthType = 'COOKIE' | 'HEADER' | 'SCRIPT';

export type AuthHeader = { name: string; value: string };

export interface Auth extends IdAndName {
  type: AuthType;
  description?: string | null;
  headers?: AuthHeader[] | null;
  url?: string | null;
}

import { IdAndName } from '@contexts/ProjectContext';

export interface Application extends IdAndName {}

export interface AppInfo extends Application {
  projectId: string;
  projectName: string;
  createdAt: Date;
  lastScanEndedAt?: Date | null;
  lastUpdatedAt?: Date | null;
}

import { IdAndName } from '@types_/idAndName';

export interface Application extends IdAndName {}

export interface AppInfo extends Application {
  projectId: string;
  projectName: string;
  createdAt: Date;
  lastScanEndedAt?: Date | null;
  lastUpdatedAt?: Date | null;
}

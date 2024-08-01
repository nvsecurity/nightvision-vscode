import { IdAndName } from '@types_/idAndName';
import { User } from '@types_/user';

export interface Project extends IdAndName {}

export interface ProjectInfo extends Project {
  createdAt: Date;
  lastUpdatedAt?: Date | null;
  owner: User;
  sharedWithUsers: User[];
}

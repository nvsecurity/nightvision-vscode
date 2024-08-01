import { IdAndName } from '@types_/idAndName';

export interface User extends IdAndName {
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

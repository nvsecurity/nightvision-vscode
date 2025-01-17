import { SpecStatusEnum } from "@types_/target";

export const NIGHTVISION = 'nightvision';
export const API_URL = 'https://api.nightvision.net';
export const API_ERROR_TYPES = ['client_error', 'validation_error', 'server_error'];
export const CONTACT_EMAIL = 'support@nightvision.net';

export const HTTPS_PARTS_REGEX = /^ht(t(ps?)?)?:?\/?\/?$/;

// Target's spec statuses
export const COMPLETED_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.Valid];
export const ERROR_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.DownloadError, SpecStatusEnum.Invalid, SpecStatusEnum.NoSpec];
export const NO_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.NoSpec, SpecStatusEnum.WaitingForUpload];

export const DEFAULT_EXCLUSIONS = [
  '.*auth.*',
  '.*log-in.*',
  '.*login.*',
  '.*log-out.*',
  '.*logout.*',
  '.*password.*',
  '.*register.*',
  '.*sign-in.*',
  '.*signin.*',
  '.*sign-out.*',
  '.*signout.*',
];
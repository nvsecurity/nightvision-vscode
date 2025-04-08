import { SpecStatusEnum } from "@types_/target";

export const NIGHTVISION = 'nightvision';
export const API_URL = 'https://api.nightvision.net';
export const API_ERROR_TYPES = ['client_error', 'validation_error', 'server_error'];
export const CONTACT_EMAIL = 'support@nightvision.net';

const HEALTH_CHECK_INTERVAL_SECONDS = 10;
export const HEALTH_CHECK_INTERVAL = HEALTH_CHECK_INTERVAL_SECONDS * 1000;

export const HTTPS_PARTS_REGEX = /^ht(t(ps?)?)?:?\/?\/?$/;

// Target's spec statuses
export const COMPLETED_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.Valid];
export const ERROR_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.DownloadError, SpecStatusEnum.Invalid, SpecStatusEnum.NoSpec];
export const NO_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.NoSpec, SpecStatusEnum.WaitingForUpload];
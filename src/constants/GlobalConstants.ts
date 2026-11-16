import { SpecStatusEnum } from "@types_/target";
import { appUrlForApi, DEFAULT_API_URL } from "@utils/nightvisionHosts";

export const NIGHTVISION = 'nightvision';
export const API_URL: string =
  (typeof window !== 'undefined' && (window as any).__NV_API_URL__) ||
  DEFAULT_API_URL;
export const APP_URL = appUrlForApi(API_URL);
export const API_ERROR_TYPES = ['client_error', 'validation_error', 'server_error'];
export const CONTACT_EMAIL = 'support@nightviz.ai';

const HEALTH_CHECK_INTERVAL_SECONDS = 30;
export const HEALTH_CHECK_INTERVAL = HEALTH_CHECK_INTERVAL_SECONDS * 1000;

export const HTTPS_PARTS_REGEX = /^ht(t(ps?)?)?:?\/?\/?$/;

// Target's spec statuses
export const COMPLETED_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.Valid];
export const ERROR_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.DownloadError, SpecStatusEnum.Invalid, SpecStatusEnum.NoSpec];
export const NO_SPEC_STATUSES: SpecStatusEnum[] = [SpecStatusEnum.NoSpec, SpecStatusEnum.WaitingForUpload];
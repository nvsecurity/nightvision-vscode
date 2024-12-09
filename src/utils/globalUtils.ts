import { SpecStatusEnum } from "@types_/target";

export const validateUrls = (urls: string[]): boolean => {
  const invalidUrls = urls?.map(url => url.trim()).filter(url => !url
    .match(/^(https?:\/\/)?(?![^#?/]*\.\.)[a-zA-Z0-9][-a-zA-Z0-9.]{1,255}(:\d+)?($|(#|\?|\/)[-a-zA-Z0-9@:%_+.~#?&/=]*)$/));

  if (invalidUrls?.length) {
    const result = invalidUrls.filter(url => !(
      url.match(/^((https?:\/\/)?((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}(:\d+)?(\/.*)?)$/)
      || (
        url.trim().includes('localhost')
      ) && url.match(/^((https?:\/\/)?\w+(\.\w+)*(:\d+)?(\/.*)?)$/)
    ));
    return !result?.length;
  }
  return true;
};

export function formatDuration(duration: number) {
  let secondsDuration = Math.round(Math.max(0, duration / 1000));

  const hours = Math.floor(secondsDuration / 3600);
  secondsDuration -= hours * 3600;

  const minutes = Math.floor(secondsDuration / 60);
  secondsDuration -= minutes * 60;

  const seconds = secondsDuration;

  return `${hours ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const isCliOutdated = (cliVersion: string) => {
  const userCliVersion = cliVersion.split('.').map(Number);
  const pluginCliVersion = (process.env.CLI_VERSION ?? '0.0.0')
    .split('.')
    .map(Number);

  for (
    let i = 0;
    i < Math.max(userCliVersion.length, pluginCliVersion.length);
    i++
  ) {
    const v1 = userCliVersion[i] || 0;
    const v2 = pluginCliVersion[i] || 0;

    if (v1 < v2) {
      return true;
    }
  }

  return false;
};

const mapSpecStatusToTextMessage = new Map<SpecStatusEnum, string>([
  [SpecStatusEnum.NoSpec, 'OpenAPI spec is not specified'],
  [SpecStatusEnum.Downloading, 'Downloading OpenAPI spec'],
  [SpecStatusEnum.DownloadError, 'OpenAPI spec download failed'],
  [SpecStatusEnum.Validating, 'Validating OpenAPI spec'],
  [SpecStatusEnum.Invalid, 'Invalid OpenAPI definition'],
  [SpecStatusEnum.Valid, 'OpenAPI spec is valid'],
  [SpecStatusEnum.WaitingForUpload, 'Waiting for OpenAPI spec upload to complete'],
]);

export const specStatusToTextMessage = (status?: SpecStatusEnum): string => {
  return status ? mapSpecStatusToTextMessage.get(status) || '' : 'Checking OpenAPI spec';
};
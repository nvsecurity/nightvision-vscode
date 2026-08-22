import { normalizedSeverity, Severity } from "@types_/scan";
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

/**
 * Numeric segments of a dotted version string.
 *
 * Each segment contributes its leading integer, so a pre-release suffix loses
 * only its tail and 0.15.3-beta reads as 0.15.3. Parsing stops at the first
 * segment with no leading integer rather than skipping it, since dropping a
 * segment would slide every later one into the wrong position, and stops after
 * any segment that carried a suffix, since what follows belongs to the suffix
 * rather than to the version: 0.15.1-rc.2 reads as 0.15.1, not 0.15.1.2. A
 * pre-release therefore compares equal to its release, which for a floor check
 * means an rc build of the floor is not prompted to update.
 */
const parseCliVersion = (version: string): number[] => {
  const parts: number[] = [];

  for (const segment of version.split('.')) {
    const value = parseInt(segment, 10);
    if (!Number.isFinite(value)) {
      break;
    }
    parts.push(value);
    if (!/^\d+$/.test(segment)) {
      break;
    }
  }

  return parts;
};

/**
 * Three-way comparison of two dotted version strings: negative when verA is
 * older than verB, zero when they are equal, positive when verA is newer.
 *
 * Segments are compared numerically and a missing one counts as zero, so
 * 0.9.15 is older than 0.15.0 even though it sorts after it as text.
 */
export const compareCliVersions = (verA: string, verB: string): number => {
  const partsA = parseCliVersion(verA);
  const partsB = parseCliVersion(verB);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const a = partsA[i] ?? 0;
    const b = partsB[i] ?? 0;

    if (a !== b) {
      return a - b;
    }
  }

  return 0;
};

export const isCliOutdated = (cliVersion: string) => {
  // A version carrying no numeric segment at all is left alone rather than
  // prompted: there is nothing to compare, and the CLI it names may well be
  // current. Comparing it anyway would read it as 0.0.0 and prompt every time.
  if (parseCliVersion(cliVersion).length === 0) {
    return false;
  }

  // The comparison has to stop at the first segment that differs. Walking every
  // segment and only ever testing for "older" reported a newer CLI as outdated
  // whenever a later segment happened to be smaller, so a user on 1.2.3 was
  // told to downgrade to the 0.15.0 floor. The same flaw fired on the 0.x line
  // while the floor was 0.9.5, which covered every release from 0.10.0 whose
  // patch was below 5.
  return compareCliVersions(cliVersion, process.env.CLI_VERSION ?? '0.0.0') < 0;
};

const mapSpecStatusToTextMessage = new Map<SpecStatusEnum, string>([
  [SpecStatusEnum.NoSpec, 'Spec/collection is not specified'],
  [SpecStatusEnum.Downloading, 'Downloading spec/collection'],
  [SpecStatusEnum.DownloadError, 'Spec/collection download failed'],
  [SpecStatusEnum.Validating, 'Validating spec/collection'],
  [SpecStatusEnum.Invalid, 'Invalid spec/collection definition'],
  [SpecStatusEnum.Valid, 'Spec/collection is valid'],
  [SpecStatusEnum.Warning, 'Spec/collection has validation warnings'],
  [SpecStatusEnum.WaitingForUpload, 'Waiting for spec/collection upload to complete'],
]);

export const specStatusToTextMessage = (status?: SpecStatusEnum): string => {
  return status ? mapSpecStatusToTextMessage.get(status) || '' : 'Checking spec/collection';
};

export const countIssues = (issues: any[]) => {
  return issues.reduce(
    (
      counts: Record<Severity, number>,
      kind: { severity: string; vulnerable_paths_count: number }
    ) => {
      const severity = normalizedSeverity(kind.severity);
      counts[severity] = (counts[severity] ?? 0) + kind.vulnerable_paths_count;
      return counts;
    },
    {} as Partial<Record<Severity, number>>
  );
};
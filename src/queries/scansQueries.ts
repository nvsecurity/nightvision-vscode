import { API_URL } from "@constants/GlobalConstants";
import { normalizedSeverity, ScanType } from "@types_/scan";
import { messageHandler } from "@utils/MessageHandler";
import { getIssuesList } from "./issuesQueries";
import { countIssues } from "@utils/globalUtils";

// #region getScansList
export interface GetScansListParams {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  page: number;
  project?: string;
  filter?: string;
}

export interface GetScansListResponse {
  scans: ScanType[],
  nextPage?: number,
  totalCount: number,
}

export const getScansListWithIssuesStat = async ({
  setIsLoggedIn,
  page,
  project,
  filter,
}: GetScansListParams): Promise<GetScansListResponse> => {
  try {
    const projectFilter = project ? `&project=${project}` : '';
    const searchFilter = filter ? `&filter=${filter}` : '';
    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/scans/?page=${page}${projectFilter}${searchFilter}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    const nextPage = response.next && new URL(response.next).searchParams.get('page');
    const totalCount = response.count;

    const scansPromises: Promise<ScanType>[] = response.results.map(
      async (scan: any): Promise<ScanType> => {
        let vulnPathsStatistics = {};
        if (!scan.vulnerable_paths_statistics) {
          const { issues } = await getIssuesList({
            setIsLoggedIn,
            scanId: scan.id
          });
          vulnPathsStatistics = countIssues(issues);
        }

        return {
          id: scan.id,
          authentication: scan.credentials,
          target: scan.target,
          project: scan.project,
          createdAt: new Date(scan.created_at),
          endedAt: scan.ended_at ? new Date(scan.ended_at) : undefined,
          status: scan.status_value,
          isScanning: scan.status_value === 'RUNNING',
          disrupted: scan.status_value === 'TIMED_OUT' || scan.status_value === 'FAILED',
          aborted: scan.status_value === 'ABORTED',
          vulnPathsStatistics:
            scan.vulnerable_paths_statistics ?? vulnPathsStatistics,
          issues: [],
        };
      }
    );

    const scans = await Promise.all(scansPromises);
    return {
      scans: scans,
      nextPage: nextPage,
      totalCount: totalCount,
    };
  } catch (err: any) {
    console.error(err);
  }
  return {
    scans: [],
    totalCount: 0,
  };
};
// #endregion

// #region getScanById
export interface GetScanByIdParams {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  scanId: string;
}

export interface GetScanByIdResponse {
  scan?: ScanType,
}

export const getScanByIdWithIssuesStat = async ({
  setIsLoggedIn,
  scanId,
}: GetScanByIdParams): Promise<GetScanByIdResponse> => {
  try {
    const response = await messageHandler.api({
      method: 'get',
      url: `${API_URL}/api/v1/scans/${scanId}`,
      setIsLoggedIn: setIsLoggedIn,
    });

    let vulnPathsStatistics = {};
    const { issues } = await getIssuesList({
      setIsLoggedIn,
      scanId: response.id
    });

    if (!response.vulnerable_paths_statistics) {
      vulnPathsStatistics = countIssues(issues);
    }

    const scan = {
      id: response.id,
      authentication: response.credentials,
      target: response.target,
      project: response.project,
      createdAt: new Date(response.created_at),
      endedAt: response.ended_at
        ? new Date(response.ended_at)
        : undefined,
      status: response.status_value,
      isScanning: response.status_value === 'RUNNING',
      disrupted: response.status_value === 'TIMED_OUT' || response.status_value === 'FAILED',
      aborted: response.status_value === 'ABORTED',
      vulnPathsStatistics: response.vulnerable_paths_statistics ?? vulnPathsStatistics,
      issues: issues.map((issue: any) => ({
        kind_id: issue.kind_id,
        name: issue.kind_name,
        severity: normalizedSeverity(issue.severity),
      })),
    };

    return {
      scan
    };
  } catch (err: any) {
    console.error(err);
  }
  return {
    scan: undefined,
  };
};
// #endregion
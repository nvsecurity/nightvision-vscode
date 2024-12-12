import { API_URL } from "@constants/GlobalConstants";
import { Issue, ScanType } from "@types_/scan";
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
        url: `${API_URL}/api/v1/scans/?order=-created_at&page=${page}${projectFilter}${searchFilter}`,
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
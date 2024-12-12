import { API_URL } from "@constants/GlobalConstants";
import { Issue } from "@types_/scan";
import { messageHandler } from "@utils/MessageHandler";

// #region getIssuesList
export interface GetIssuesListParams {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  scanId: string;
}

export interface GetIssuesListResponse {
  issues: Issue[],
}

export const getIssuesList = async ({
  setIsLoggedIn,
  scanId
}: GetIssuesListParams): Promise<GetIssuesListResponse> => {
  try {
    const response = await messageHandler.api({
      method: 'get',
      url: `${API_URL}/api/v1/issues/kind/?scan=${scanId}`,
      setIsLoggedIn: setIsLoggedIn,
    });
    return {
      issues: response.results
    };
  } catch (err: any) {
    console.error(err);
    return {
      issues: []
    };
  }
};
// #endregion
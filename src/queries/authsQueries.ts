import { API_URL } from "@constants/GlobalConstants";
import { messageHandler } from "@utils/MessageHandler";
import { Auth } from "@types_/auth";

// #region getAuthenticationsList
export interface GetAuthenticationsListParams {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  page: number;
  projectId?: string;
  filter?: string;
}

export interface GetAuthenticationsListResponse {
  auths: Auth[],
  nextPage?: number,
  totalCount: number,
}

export const getAuthenticationsList = async ({
  setIsLoggedIn,
  page,
  projectId,
  filter,
}: GetAuthenticationsListParams): Promise<GetAuthenticationsListResponse> => {
  try {
    const projectFilter = projectId ? `&project=${projectId}` : '';
    const searchFilter = filter ? `&filter=${filter}` : '';

    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/credentials/?order=name&page=${page}${projectFilter}${searchFilter}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    const nextPage = response.next && new URL(response.next).searchParams.get('page');
    const totalCount = response.count;

    const auths = response.results.map(
      (auth: any): Auth => ({
        id: auth.id,
        name: auth.name,
        type: auth.type,
        description: auth.description,
        headers: auth.cookie ?? auth.headers ?? [],
        url: auth.script_first_url,
      })
    );
    return {
      auths: auths,
      nextPage: nextPage,
      totalCount: totalCount,
    };
  } catch (err: any) {
    console.error(err);
  }
  return {
    auths: [],
    totalCount: 0,
  };
};
// #endregion
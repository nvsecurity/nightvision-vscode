import { API_URL, HTTPS_PARTS_REGEX } from "@constants/GlobalConstants";
import { Target, TargetInfo, TargetType } from "@types_/target";
import { messageHandler } from "@utils/MessageHandler";

// #region getTargetsList
export interface GetTargetsListParams {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  projectId: string;
  page: number;
  filter?: string;
  type?: TargetType,
}

export interface GetTargetsListResponse {
  targets: Target[],
  nextPage?: number,
  totalCount: number,
}

export const getTargetsList = async ({
  setIsLoggedIn,
  projectId,
  page,
  filter = '',
  type,
}: GetTargetsListParams): Promise<GetTargetsListResponse> => {
  try {
    const _type = type ? type.toLocaleLowerCase() + '/' : '';
    const projectFilter = projectId ? `&project=${projectId}` : '';
    const searchFilter = filter ? `&filter=${filter}` : '';

    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/targets/${_type}?page=${page}${projectFilter}${searchFilter}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    const nextPage = response.next && new URL(response.next).searchParams.get('page');
    const totalCount = response.count;

    const targets: Target[] = response.results.map(
      (target: any): Target => ({
        id: target.id,
        name: target.name,
        location: target.location,
        type: target.type,
      })
    );
    return {
      targets: targets,
      nextPage: nextPage,
      totalCount: totalCount,
    };
  } catch (err: any) {
    console.error(err);
  }
  return {
    targets: [],
    totalCount: 0,
  };
};
// #endregion

// #region checkPublicUrl
export interface CheckPublicUrlParams {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  url: string;
}

export interface CheckPublicUrlResponse {
  requested_url: string,
  is_accessible: boolean,
  status: number,
}

export const checkPublicUrl = async ({
  setIsLoggedIn,
  url
}: CheckPublicUrlParams): Promise<CheckPublicUrlResponse> => {
  url = url.trim();
  if (url.match(HTTPS_PARTS_REGEX)) {
    return getCheckUrlErrorResponse(url, 400);
  }

  const response = (
    await messageHandler.api({
      method: 'POST',
      url: `${API_URL}/api/v1/targets/check-public-url/`,
      body: { url },
      setIsLoggedIn: setIsLoggedIn,
    })
  );

  if (!!response.status && response.status !== 200) {  // API error
    return getCheckUrlErrorResponse(url, response.status);
  }
  return response;
};

function getCheckUrlErrorResponse(
  url: string,
  status: number,
): CheckPublicUrlResponse {
  return {
    requested_url: url,
    is_accessible: false,
    status,
  };
}
// #endregion
import { API_URL, HTTPS_PARTS_REGEX } from "@constants/GlobalConstants";
import { messageHandler } from "@utils/MessageHandler";

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
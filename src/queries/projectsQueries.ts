import { API_URL } from "@constants/GlobalConstants";
import { messageHandler } from "@utils/MessageHandler";
import { Auth } from "@types_/auth";
import { ProjectInfo } from "@types_/project";

// #region getProjectsList
export interface GetProjectsListParams {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  page: number;
  filter?: string;
}

export interface GetProjectsListResponse {
  projects: ProjectInfo[],
  nextPage?: number,
  totalCount: number,
}

export const getProjectsList = async ({
  setIsLoggedIn,
  page,
  filter,
}: GetProjectsListParams): Promise<GetProjectsListResponse> => {
  try {
    const searchFilter = filter ? `&filter=${filter}` : '';

    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/projects/?page=${page}${searchFilter}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    const nextPage = response.next && new URL(response.next).searchParams.get('page');
    const totalCount = response.count;

    const projects = response.results.map(
      (project: any): ProjectInfo => ({
        id: project.id,
          name: project.name,
          createdAt: new Date(project.created_at),
          lastUpdatedAt: project.last_updated_at
            ? new Date(project.last_updated_at)
            : null,
          owner: {
            id: project.own_user.id,
            name: project.own_user.username,
            firstName: project.own_user.first_name,
            lastName: project.own_user.last_name,
            avatarUrl: project.own_user.avatar_url,
          },
          sharedWithUsers: project.shared_with_users_preview
            .filter((user: any) => user.id !== project.own_user.id)
            .map((user: any) => ({
              id: user.id,
              name: user.username,
              firstName: user.first_name,
              lastName: user.last_name,
              avatarUrl: user.avatar_url,
            })),
          isDefault: project.is_default,
      })
    );

    return {
      projects: projects,
      nextPage: nextPage,
      totalCount: totalCount,
    };
  } catch (err: any) {
    console.error(err);
  }
  return {
    projects: [],
    totalCount: 0,
  };
};
// #endregion
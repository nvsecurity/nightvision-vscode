import React from 'react';
import { Dropdown } from './Dropdown';
import { Project, ProjectInfo } from '@types_/project';
import { IdAndName } from '@types_/idAndName';
import { messageHandler } from '@utils/MessageHandler';
import { API_URL } from '@constants/GlobalConstants';
import { useUser } from '@hooks/useUser';

const ALL_PROJECTS_FILTER_OPTION: Project = { id: "<Internal-All>", name: "All" };

interface ProjectDropdownProps {
  project?: Project;
  onProjectChange: (value: IdAndName) => void;
  includeAllOption?: boolean;
}

const mapProjectDtoToViewModel = (dto: any) => {
  return ({
    id: dto.id,
    name: dto.name,
    createdAt: new Date(dto.created_at),
    lastUpdatedAt: dto.last_updated_at
      ? new Date(dto.last_updated_at)
      : null,
    owner: {
      id: dto.own_user.id,
      name: dto.own_user.username,
      firstName: dto.own_user.first_name,
      lastName: dto.own_user.last_name,
      avatarUrl: dto.own_user.avatar_url,
    },
    sharedWithUsers: dto.shared_with_users_preview
      .filter((user: any) => user.id !== dto.own_user.id)
      .map((user: any) => ({
        id: user.id,
        name: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
      })),
    isDefault: dto.is_default,
  });
};

interface GetProjectsParams {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  page?: number;
}

interface GetProjectResponse {
  projects: ProjectInfo[];
  totalCount: number;
  nextPage?: number;
}

export const getProjects = async ({
  setIsLoggedIn,
  page = 1,
}: GetProjectsParams): Promise<GetProjectResponse> => {
  try {
    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/projects/?order=name&page=${page}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    const nextPage = response.next && new URL(response.next).searchParams.get('page');
    const totalCount = response.count;

    const projects = response.results.map(
      (proj: any) => mapProjectDtoToViewModel(proj)
    );

    return ({
      projects: projects,
      totalCount: totalCount,
      nextPage: nextPage,
    });
  } catch (err: any) {
    console.error(err);
  }
  return ({
    projects: [],
    totalCount: 0,
  });
};

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  project,
  onProjectChange,
  includeAllOption = false,
}) => {
  const { setIsLoggedIn } = useUser();
  const [projects, setProjects] = React.useState<ProjectInfo[]>([]);
  const [isProjectListLoading, setIsProjectsListLoading] = React.useState(true);
  const isMounted = React.useRef(false);

  const fetchApi = async () => {
    setIsProjectsListLoading(true);

    let page: number | undefined = 1;
    do {
      const { projects, nextPage = undefined } = await getProjects({
        setIsLoggedIn: setIsLoggedIn,
        page: page,
      });
      setProjects((old) => [...old, ...projects]);
      page = nextPage;
    } while (!!page);

    setIsProjectsListLoading(false);
  };

  React.useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      fetchApi();
    }
  }, []);

  const options = includeAllOption ? [ALL_PROJECTS_FILTER_OPTION, ...projects] : projects;

  return (
    <Dropdown
      selectedItem={project}
      items={options}
      name='Project'
      handleChange={onProjectChange}
      loading={isProjectListLoading}
      id='current-project'
    />
  );
}
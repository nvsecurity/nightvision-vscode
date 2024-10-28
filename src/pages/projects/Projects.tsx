import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { ProjectInfo } from '@types_/project';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';
import { API_URL } from '@constants/GlobalConstants';
import { ProjectDropdown } from '@components/project-dropdown';
import { CreateProjModal } from './components';
import { Pagination } from '@components/pagination';

export const getProjects = async (
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  page: number,
  ignore: boolean = false
) => {
  try {
    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/projects/?order=name&page=${page}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    if (ignore) {
      return;
    }

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
  };
};

export const Projects = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn } = useUser();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [invalidateProjectsList, setInvalidateProjectsList] = React.useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const fetchProjects = async (ignore: boolean) => {
    setIsProjectsLoading(true);

    const res = await getProjects(setIsLoggedIn, page, ignore);
    setProjects(res?.projects);
    setTotalCount(res?.totalCount);

    setIsProjectsLoading(false);
  };

  useEffect(() => {
    let ignore = false;

    fetchProjects(ignore);

    return () => {
      ignore = true;
    };
  }, [page]);

  React.useEffect(() => {
    let ignore = false;

    if (invalidateProjectsList) {
      fetchProjects(ignore);
    }

    return () => {
      ignore = true;
    };
  }, [invalidateProjectsList]);

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <PageHeader title='Projects'/>

        <div>
          <Label htmlFor='current-project'>Current Project</Label>
          <ProjectDropdown
            project={currentProject}
            onProjectChange={setCurrentProject}
          />
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
          }}
          className='rounded'
        >
          Create Project
        </button>

        {isProjectsLoading ? (
          <Loading />
        ) : (
          projects?.length ? (
            <>
              <EditList
                list={projects}
                handleClick={(listItem) => {
                  navigate(`/projects/${listItem.id}`);
                }}
                renderItem={(listItem) => (
                  <div className='flex max-w-full flex-nowrap justify-between truncate'>
                    <span className='mr-2 truncate'>{listItem.name}</span>
                    <div className='flex flex-shrink-0 flex-nowrap'>
                      {[
                        ...listItem.sharedWithUsers.slice(0, 6),
                        listItem.owner,
                      ].map((user, index) => (
                        <img
                          key={user.id}
                          src={user.avatarUrl}
                          className={`size-7 rounded-full border-2 border-[--vscode-sideBar-background] ${index !== 0 ? '-ml-4' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              />
              <Pagination
                page={page}
                setPage={setPage}
                totalCount={totalCount}
              />
            </>
          ) : (
            <span className='!mt-10 w-full text-center'>No projects found</span>
          )
        )}
      </div>

      {showCreateModal && (
        <CreateProjModal
          onAfterCreate={() => {
            setPage(1);
            setShowCreateModal(false);
            setInvalidateProjectsList(true);
          }}
          onClose={() => setShowCreateModal(false)}
          projects={projects}
        />
      )}
    </>
  );
};

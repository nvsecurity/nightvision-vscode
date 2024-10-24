import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Project } from '@types_/project';
import { ApiSpec, Target, TargetType } from '@types_/target';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '@components/Dropdown';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { TargetTypeLabel } from '@components/TargetTypeLabel';
import { getProjects } from '@pages/Projects';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';
import { API_URL } from '@constants/GlobalConstants';
import { Pagination } from '@components/pagination';
import { CreateTargetModal } from './components';

export const getTargets = async (
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string,
  page: number,
  type?: TargetType,
  ignore: boolean = false
) => {
  try {
    const _type = type ? type.toLocaleLowerCase() + '/' : '';
    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/targets/${_type}?order=name&page=${page}&project=${projectId}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    if (ignore) {
      return;
    }

    const nextPage = response.next && new URL(response.next).searchParams.get('page');
    const totalCount = response.count;

    const targets = response.results.map(
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
  };
};

export const Targets = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn } = useUser();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const [targets, setTargets] = React.useState<Target[]>();
  const [invalidateTargetsList, setInvalidateTargetsList] = React.useState(false);
  const [isTargetsLoading, setIsTargetsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const [projects, setProjects] = React.useState<Project[]>();
  const [isProjectsLoading, setIsProjectsLoading] = React.useState(false);

  const fetchTargets = async (ignore: boolean) => {
    setIsTargetsLoading(true);

    const res = await getTargets(
      setIsLoggedIn,
      currentProject.id,
      page,
      undefined,
      ignore
    );

    setTargets(res?.targets);
    setTotalCount(res?.totalCount);
    setIsTargetsLoading(false);
  };

  React.useEffect(() => {
    let ignore = false;

    fetchTargets(ignore);

    return () => {
      ignore = true;
    };
  }, [currentProject, page]);

  React.useEffect(() => {
    let ignore = false;

    if (invalidateTargetsList) {
      fetchTargets(ignore);
    }

    return () => {
      ignore = true;
    };
  }, [invalidateTargetsList]);

  React.useEffect(() => {
    const fetchProjects = async () => {
      setIsProjectsLoading(true);
      await getProjects(setProjects, setIsLoggedIn);
      setIsProjectsLoading(false);
    };

    fetchProjects();
  }, []);

  const onProjectChange = (value: any) => {
    setPage(1);
    setCurrentProject(value);
  };

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <PageHeader title='Targets'/>

        {projects && (
           <>
            <div>
              <Label htmlFor='current-project'>Current Project</Label>
              <Dropdown
                selectedItem={currentProject}
                items={projects}
                name='Project'
                handleChange={onProjectChange}
                id='current-project'
              />
            </div>
            <button
              onClick={() => {
                setShowCreateModal(true);
              }}
              className='rounded'
            >
              Create Target
            </button>
           </>
        )}

        {(isTargetsLoading || isProjectsLoading) ? (
          <Loading />
        ) : (
          targets?.length ? (
            <>
              <EditList
                list={targets}
                handleClick={(listItem) => {
                  navigate(
                    `/targets/${listItem.type.toLocaleLowerCase()}/${listItem.id}`
                  );
                }}
                renderItem={(listItem) => (
                  <div className='flex max-w-full flex-nowrap justify-between truncate'>
                    <span className='mr-2 truncate'>{listItem.name}</span>
                    <TargetTypeLabel targetType={listItem.type} />
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
            <span className='!mt-10 w-full text-center'>No targets found</span>
          )
        )}
      </div>

      {showCreateModal && (
        <CreateTargetModal
          currentProject={currentProject}
          onAfterCreate={() => {
            setPage(1);
            setShowCreateModal(false);
            setInvalidateTargetsList(true);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
};

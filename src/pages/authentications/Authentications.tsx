import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Auth, AuthType } from '@types_/auth';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';
import { API_URL } from '@constants/GlobalConstants';
import { CreateAuthModal } from './components';
import { Pagination } from '@components/pagination';
import { ProjectDropdown } from '@components/project-dropdown';

export const getAuths = async (
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string,
  page: number,
  ignore: boolean = false
) => {
  try {
    const response = (
      await messageHandler.api({
        method: 'get',
        url: `${API_URL}/api/v1/credentials/?order=name&page=${page}&project=${projectId}`,
        setIsLoggedIn: setIsLoggedIn,
      })
    );

    if (ignore) {
      return;
    }

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
  };
};

const types: { type: AuthType; name: string }[] = [
  { type: 'COOKIE', name: 'Cookie' },
  { type: 'HEADER', name: 'Header' },
  { type: 'SCRIPT', name: 'Playwright' },
];

export const Authentications = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn } = useUser();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const [auths, setAuths] = React.useState<Auth[]>([]);
  const [invalidateAuthsList, setInvalidateAuthsList] = React.useState(false);
  const [isAuthsLoading, setIsAuthsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const fetchAuths = async (ignore: boolean) => {
    setIsAuthsLoading(true);
    const res = await getAuths(
      setIsLoggedIn,
      currentProject.id,
      page,
      ignore
    );
    setAuths(res?.auths);
    setTotalCount(res?.totalCount);
    setIsAuthsLoading(false);
  };

  React.useEffect(() => {
    let ignore = false;

    fetchAuths(ignore);

    return () => {
      ignore = true;
    };
  }, [currentProject, page]);

  React.useEffect(() => {
    let ignore = false;

    if (invalidateAuthsList) {
      fetchAuths(ignore);
    }

    return () => {
      ignore = true;
    };
  }, [invalidateAuthsList]);

  const onProjectChange = (value: any) => {
    setPage(1);
    setCurrentProject(value);
  };

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <PageHeader title='Authentications'/>

        <div>
          <Label htmlFor='current-project'>Current Project</Label>
          <ProjectDropdown
            project={currentProject}
            onProjectChange={onProjectChange}
          />
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
          }}
          className='rounded'
        >
          Create Authentication
        </button>

        {isAuthsLoading ? (
          <Loading />
        ) : (
          auths?.length ? (
            <>
              <EditList
                list={auths}
                handleClick={(listItem) => {
                  navigate(`/authentications/${listItem.id}`);
                }}
                renderItem={(listItem) => (
                  <div className='flex max-w-full flex-nowrap justify-between truncate'>
                    <span className='mr-2 truncate'>{listItem.name}</span>
                    <span>
                      {types.filter((type) => type.type === listItem.type)[0].name}
                    </span>
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
            <span className='!mt-10 w-full text-center'>No authentications found</span>
          )
        )}
      </div>

      {showCreateModal && (
        <CreateAuthModal
          currentProject={currentProject}
          onAfterCreate={() => {
            setPage(1);
            setShowCreateModal(false);
            setInvalidateAuthsList(true);
          }}
          onClose={() => setShowCreateModal(false)}
          auths={auths}
        />
      )}
    </>
  );
};
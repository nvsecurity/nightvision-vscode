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
import { useDebounce } from 'use-debounce';
import { TextInput } from '@components/TextInput';
import { getAuthenticationsList } from '@queries/authsQueries';

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

  const [_searchValue, setSearchValue] = React.useState('');
  const [search] = useDebounce(_searchValue, 500);
  const [searchChanges] = React.useState({ count: 0 });

  const fetchAuths = async () => {
    setIsAuthsLoading(true);
    const currCounter = searchChanges.count;

    const res = await getAuthenticationsList({
      setIsLoggedIn,
      projectId: currentProject.id,
      page,
      filter: search,
    });

    if (searchChanges.count === currCounter) {
      setAuths(res.auths);
      setTotalCount(res.totalCount);
      setIsAuthsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAuths();
  }, [currentProject, page, search]);

  React.useEffect(() => {
    if (invalidateAuthsList) {
      fetchAuths();
    }
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

        <TextInput
          value={_searchValue}
          handleOnChange={val => {
            setSearchValue(val);
            searchChanges.count++;
          }}
          placeholder='Search...'
          id='auth-name-search'
        />

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
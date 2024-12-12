import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { Target } from '@types_/target';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { TargetTypeLabel } from '@components/TargetTypeLabel';
import { PageHeader } from '@components/PageHeader';
import { Pagination } from '@components/pagination';
import { CreateTargetModal } from './components';
import { ProjectDropdown } from '@components/project-dropdown';
import { TextInput } from '@components/TextInput';
import { useDebounce } from 'use-debounce';
import { getTargetsList } from '@queries/targetQueries';

export const Targets = () => {
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProject();
  const { setIsLoggedIn } = useUser();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const [targets, setTargets] = React.useState<Target[]>([]);
  const [invalidateTargetsList, setInvalidateTargetsList] = React.useState(false);
  const [isTargetsLoading, setIsTargetsLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const [_searchValue, setSearchValue] = React.useState('');
  const [search] = useDebounce(_searchValue, 500);
  const [searchChanges] = React.useState({ count: 0 });

  const fetchTargets = async (ignore: boolean) => {
    setIsTargetsLoading(true);
    const currCounter = searchChanges.count;

    const res = await getTargetsList({
      setIsLoggedIn,
      projectId: currentProject.id,
      page,
      search,
      ignore,
    });

    if (searchChanges.count === currCounter) {
      setTargets(res.targets);
      setTotalCount(res.totalCount);
      setIsTargetsLoading(false);
    }
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

    if (invalidateTargetsList || search) {
      fetchTargets(ignore);
      setInvalidateTargetsList(false);
    }

    return () => {
      ignore = true;
    };
  }, [invalidateTargetsList, search]);

  const onProjectChange = (value: any) => {
    setPage(1);
    setCurrentProject(value);
  };

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <PageHeader title='Targets'/>

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
          Create Target
        </button>

        <TextInput
          value={_searchValue}
          handleOnChange={val => {
            setSearchValue(val);
            searchChanges.count++;
          }}
          placeholder='Search...'
          id='target-name-search'
        />

        {isTargetsLoading ? (
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
                  <div className='flex flex-nowrap items-center gap-2 mr-2 truncate'>
                    <span className='truncate font-medium'>{listItem.name}</span>
                    <span className='truncate text-gray-400'>{`(${listItem.location})`}</span>
                  </div>
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
          targets={targets}
        />
      )}
    </>
  );
};

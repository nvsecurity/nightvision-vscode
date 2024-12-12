import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { ProjectInfo } from '@types_/project';
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditList } from '@components/EditList';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { PageHeader } from '@components/PageHeader';
import { ProjectDropdown } from '@components/project-dropdown';
import { CreateProjModal } from './components';
import { Pagination } from '@components/pagination';
import { useDebounce } from 'use-debounce';
import { TextInput } from '@components/TextInput';
import { getProjectsList } from '@queries/projectsQueries';

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

  const [_searchValue, setSearchValue] = React.useState('');
  const [search] = useDebounce(_searchValue, 500);
  const [searchChanges] = React.useState({ count: 0 });

  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    const currCounter = searchChanges.count;

    const res = await getProjectsList({
      setIsLoggedIn,
      page,
      filter: search,
    });

    if (searchChanges.count === currCounter) {
      setProjects(res.projects);
      setTotalCount(res.totalCount);
      setIsProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, search]);

  React.useEffect(() => {
    if (invalidateProjectsList) {
      fetchProjects();
    }
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

        <TextInput
          value={_searchValue}
          handleOnChange={val => {
            setSearchValue(val);
            searchChanges.count++;
          }}
          placeholder='Search...'
          id='project-name-search'
        />

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

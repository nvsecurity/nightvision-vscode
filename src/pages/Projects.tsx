import { useProject } from '@hooks/useProject';
import { useUser } from '@hooks/useUser';
import { v4 } from 'uuid';
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CREATE_PROJECT,
  INVALID_PROJECT_NAME,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { Dropdown } from '@components/Dropdown';
import { messageHandler } from '@utils/MessageHandler';

export const Projects = () => {
  const navigate = useNavigate();
  const { projects, setProjects, currentProject, setCurrentProject } =
    useProject();
  const { setIsLoggedIn } = useUser();

  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProject = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();

    const reqId = v4();
    const requestGenerator = messageHandler.requestGenerator(
      CREATE_PROJECT,
      reqId,
      {
        projectName,
      }
    );

    setIsLoading(true);

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case CREATE_PROJECT:
            setProjects((prevState) => [response.payload, ...prevState]);
            break;
          case INVALID_PROJECT_NAME: {
            // TODO
            break;
          }
          case UNAUTHORIZED_ACCESS:
            setIsLoggedIn(false);
            break;
        }
      }
    } catch (err) {
      console.error(err);
    }

    setIsLoading(false);
  };

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <a
          onClick={() => navigate(-1)}
          className='hover:cursor-pointer'
          href='#'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            xmlns='http://www.w3.org/2000/svg'
            fill='currentColor'
            className='h-5 w-5'
          >
            <path
              fillRule='evenodd'
              clipRule='evenodd'
              d='M7 3.093l-5 5V8.8l5 5 .707-.707-4.146-4.147H14v-1H3.56L7.708 3.8 7 3.093z'
            />
          </svg>
        </a>
        <h1 className='font-bold uppercase'>Project</h1>
      </div>
      <div className='flex flex-col space-y-1'>
        <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='current-project'
          >
            Current Project
          </label>
          <Dropdown
            defaultItem={currentProject}
            items={projects}
            name='Project'
            handleChange={setCurrentProject}
            id='current-project'
          />
        </div>
        <div>
          <label
            className='mb-1 text-sm uppercase opacity-50'
            htmlFor='project-name'
          >
            Project Name
          </label>

          <input
            onChange={(e) => setProjectName(e.target.value)}
            value={projectName}
            className='w-full'
            id='project-name'
          />
        </div>
      </div>
      <button
        onClick={handleCreateProject}
        className='rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
        disabled={isLoading}
      >
        {isLoading ? 'Creating...' : 'Create Project'}
      </button>

      <ul className='mt-4 pl-0'>
        {projects.map((project) => {
          return <li key={project}>{project}</li>;
        })}
      </ul>
    </div>
  );
};

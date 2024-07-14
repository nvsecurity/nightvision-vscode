import { Application } from '@contexts/AppContext';
import { IdAndName, Project } from '@contexts/ProjectContext';
import { useApp } from '@hooks/useApp';
import { useProject } from '@hooks/useProject';
import { useTarget } from '@hooks/useTarget';
import { useUser } from '@hooks/useUser';
import { Auth } from '@types_/auth';
import { Target } from '@types_/target';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SCAN, SCAN_ID, UNAUTHORIZED_ACCESS } from '@commands/CommandConstants';
import { ScanParams } from '@commands/Scan';
import { Dropdown } from '@components/Dropdown';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { getApps } from '@pages/Applications';
import { getAuths } from '@pages/Authentications';
import { getProjects } from '@pages/Projects';
import { getTargets } from '@pages/Targets';
import { messageHandler } from '@utils/MessageHandler';

export const NewScan = () => {
  const navigate = useNavigate();

  const { currentApp, setCurrentApp } = useApp();
  const { currentProject, setCurrentProject } = useProject();
  const { currentTarget, setCurrentTarget } = useTarget();
  const { setIsLoggedIn } = useUser();

  const [apps, setApps] = useState<Application[]>();
  const [auths, setAuths] = useState<Auth[]>();
  const [currentAuth, setCurrentAuth] = useState<Auth | null>();
  const [projects, setProjects] = useState<Project[]>();
  const [targets, setTargets] = useState<Target[]>();

  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchApi = async () => {
      setIsFetching(true);
      await getApps(setApps, setIsLoggedIn, currentProject.id, ignore);
      await getAuths(setAuths, setIsLoggedIn, currentProject.id, ignore);
      await getProjects(setProjects, setIsLoggedIn, ignore);
      await getTargets(setTargets, setIsLoggedIn, currentProject.id, ignore);
      setIsFetching(false);
    };

    fetchApi();

    return () => {
      ignore = true;
    };
  }, [currentProject]);

  const handleScanClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!currentApp || !currentTarget) {
      return;
    }

    const requestGenerator = messageHandler.requestGenerator<ScanParams>(
      SCAN,
      v4(),
      {
        project: currentProject,
        application: currentApp,
        target: currentTarget,
        authentication: currentAuth,
      }
    );

    setIsLoading(true);

    for await (const response of requestGenerator) {
      switch (response.command) {
        case SCAN_ID: {
          const scanId = response.payload;
          navigate(`/scans/${scanId}`, { replace: true });
          setIsLoading(false);
          break;
        }
        case UNAUTHORIZED_ACCESS:
          setIsLoggedIn(false);
          break;
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    let ignore = false;

    if (!apps) {
      return;
    }

    if (apps.some((app) => app.id === currentApp?.id)) {
      return;
    }

    if (apps.length === 0 && !ignore) {
      setCurrentApp(undefined);
      return;
    }

    if (apps.length > 0 && !ignore) {
      setCurrentApp(apps[0]);
    }

    return () => {
      ignore = true;
    };
  }, [apps, currentApp]);

  useEffect(() => {
    let ignore = false;

    if (!targets) {
      return;
    }

    if (targets.some((target) => target.id === currentTarget?.id)) {
      return;
    }

    if (targets.length === 0 && !ignore) {
      setCurrentTarget(undefined);
      return;
    }

    if (targets.length > 0 && !ignore) {
      setCurrentTarget(targets[0]);
    }

    return () => {
      ignore = true;
    };
  }, [targets, currentTarget]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    clearInterval(interval);
    interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 500);

    return () => clearInterval(interval);
  }, [currentTime]);

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex items-center space-x-2'>
        <Link to={isLoading ? '.' : '/scans'} title='To Scans'>
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
        </Link>
        <h1 className='font-bold uppercase'>Scan</h1>
      </div>

      {apps && auths && projects && targets && (
        <>
          <div>
            <Label htmlFor='current-project'>Current Project</Label>
            <Dropdown
              selectedItem={currentProject}
              items={projects}
              name='Project'
              handleChange={setCurrentProject}
              id='current-project'
            />
          </div>
          {isFetching && <Loading />}
          {!isFetching && (
            <>
              <div className='flex flex-col space-y-1'>
                <div>
                  <Label htmlFor='application'>Application</Label>
                  <Dropdown
                    selectedItem={currentApp}
                    items={apps}
                    name='Application'
                    route={isLoading ? '.' : `/applications`}
                    handleChange={setCurrentApp}
                    id='application'
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor='target'>Target</Label>
                  <Dropdown
                    selectedItem={currentTarget}
                    items={targets.map((target) => ({
                      ...target,
                      name: `${target.name} - ${target.location}`,
                    }))}
                    name='Target'
                    route={isLoading ? '.' : `/targets`}
                    handleChange={
                      setCurrentTarget as (value: IdAndName) => void
                    }
                    id='target'
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor='auth'>Authentication (Optional)</Label>
                  <Dropdown
                    selectedItem={currentAuth}
                    items={auths}
                    optional={true}
                    name='Authentication'
                    route={isLoading ? '.' : `/authentications`}
                    handleChange={setCurrentAuth as (value: IdAndName) => void}
                    id='auth'
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button
                onClick={handleScanClick}
                className='rounded disabled:bg-neutral-800 hover:disabled:cursor-default'
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Start Scan'}
              </button>
            </>
          )}
        </>
      )}
      {(!apps || !auths || !projects || !targets) && <Loading />}
    </div>
  );
};

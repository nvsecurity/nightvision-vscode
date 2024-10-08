import { useApp } from '@hooks/useApp';
import { useProject } from '@hooks/useProject';
import { useTarget } from '@hooks/useTarget';
import { useUser } from '@hooks/useUser';
import { Application } from '@types_/app';
import { Auth } from '@types_/auth';
import { IdAndName } from '@types_/idAndName';
import { Project } from '@types_/project';
import { Target } from '@types_/target';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CLI_MISSING,
  INVALID_APP,
  INVALID_TARGET,
  SCAN,
  SCAN_ID,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { ScanParams } from '@commands/Scan';
import { Dropdown } from '@components/Dropdown';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { getApps } from '@pages/Applications';
import { getAuths } from '@pages/Authentications';
import { getProjects } from '@pages/Projects';
import { getTargets } from '@pages/Targets';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';

export const NewScan = () => {
  const { targetType } = useParams();

  const navigate = useNavigate();

  const { currentApp, setCurrentApp } = useApp();
  const { currentProject, setCurrentProject } = useProject();
  const { currentTarget, setCurrentTarget } = useTarget();
  const { setIsLoggedIn, setIsCliInstalled } = useUser();

  const [apps, setApps] = useState<Application[]>();
  const [auths, setAuths] = useState<Auth[]>();
  const [currentAuth, setCurrentAuth] = useState<Auth | null>();
  const [projects, setProjects] = useState<Project[]>();
  const [targets, setTargets] = useState<Target[]>();

  const [appErrors, setAppErrors] = useState<string[]>([]);
  const [targetErrors, setTargetErrors] = useState<string[]>([]);

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
      await getTargets(
        setTargets,
        setIsLoggedIn,
        currentProject.id,
        targetType === 'url' ? 'URL' : 'OPENAPI',
        ignore
      );
      setIsFetching(false);
    };

    fetchApi();
    setAppErrors([]);
    setTargetErrors([]);

    return () => {
      ignore = true;
    };
  }, [currentProject]);

  const handleScanClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!currentApp) {
      setAppErrors(['Application is required']);
    }

    if (!currentTarget) {
      setTargetErrors(['Target is required']);
    }

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
        case INVALID_APP: {
          setAppErrors(['Application is required']);
          break;
        }
        case INVALID_TARGET: {
          setTargetErrors(['Invalid target: ' + response.payload]);
          break;
        }
        case UNAUTHORIZED_ACCESS:
        case UNAUTHORIZED_ACCESS: {
          setIsLoggedIn(false);
          break;
        }
        case CLI_MISSING: {
          setIsCliInstalled(false);
          break;
        }
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
      <PageHeader title='Scan' backTo={isLoading ? '.' : '/scans'}/>

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
                  {appErrors.length > 0 && (
                    <ul className='list-disc'>
                      {Array.from(new Set(appErrors)).map((error) => (
                        <li key={error} className='font-semibold text-red-600'>
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <Label htmlFor='target'>
                    Target ({targetType === 'url' ? 'WEB' : 'API'})
                  </Label>
                  <Dropdown
                    selectedItem={currentTarget}
                    items={targets}
                    name='Target'
                    labelBy={target => `${target.name} (${target.location})`}
                    route={isLoading ? '.' : `/targets`}
                    handleChange={
                      setCurrentTarget as (value: IdAndName) => void
                    }
                    id='target'
                    disabled={isLoading}
                  />
                  {targetErrors.length > 0 && (
                    <ul className='list-disc'>
                      {Array.from(new Set(targetErrors)).map((error) => (
                        <li key={error} className='font-semibold text-red-600'>
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
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
                className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
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

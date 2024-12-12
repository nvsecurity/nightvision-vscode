import { useProject } from '@hooks/useProject';
import { useTarget } from '@hooks/useTarget';
import { useUser } from '@hooks/useUser';
import { Auth } from '@types_/auth';
import { IdAndName } from '@types_/idAndName';
import { Project } from '@types_/project';
import { Target, TargetTypeEnum } from '@types_/target';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import {  useNavigate, useParams } from 'react-router-dom';
import {
  CLI_MISSING,
  INVALID_TARGET,
  SCAN,
  SCAN_ID,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { ScanParams } from '@commands/Scan';
import { Dropdown } from '@components/Dropdown';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { getAuthenticationsList } from '@queries/authsQueries';
import { getProjects } from '@pages/projects';
import { getTargetsList } from '@queries/targetQueries';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';

export const NewScan = () => {
  const { targetType } = useParams();

  const navigate = useNavigate();

  const { currentProject, setCurrentProject } = useProject();
  const { currentTarget, setCurrentTarget } = useTarget();
  const { setIsLoggedIn, setIsCliInstalled } = useUser();

  const [auths, setAuths] = useState<Auth[]>([]);
  const [currentAuth, setCurrentAuth] = useState<Auth | null>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);

  const [targetErrors, setTargetErrors] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isAuthsLoading, setIsAuthsLoading] = React.useState(true);
  const fetchAllAuthentications = async () => {
    setIsAuthsLoading(true);
    const auths = [];

    let page: number | undefined = 1;
    do {
      const result: any = await getAuthenticationsList({
        setIsLoggedIn,
        projectId: currentProject.id,
        page,
      });
      auths.push(...result.auths);
      page = result?.nextPage;
    } while (!!page);
    setAuths(auths);

    setIsAuthsLoading(false);
  };

  const [isProjectsLoading, setIsProjectsLoading] = React.useState(true);
  const fetchAllProjects = async () => {
    setIsProjectsLoading(true);
    const projects = [];

    let page: number | undefined = 1;
    do {
      const result: any = await getProjects(
        setIsLoggedIn,
        page,
      );
      projects.push(...result?.projects);
      page = result?.nextPage;
    } while (!!page);
    setProjects(projects);

    setIsProjectsLoading(false);
  };

  const [isTargetsLoading, setIsTargetsLoading] = React.useState(true);
  const fetchAllTargets = async () => {
    setIsTargetsLoading(true);
    const targets = [];

    let page: number | undefined = 1;
    do {
      const result = await getTargetsList({
        setIsLoggedIn,
        projectId: currentProject.id,
        page,
        type: targetType === 'url' ? TargetTypeEnum.URL : TargetTypeEnum.OPENAPI,
      });
      targets.push(...result.targets);
      page = result?.nextPage;
    } while (!!page);
    setTargets(targets);

    setIsTargetsLoading(false);
  };

  React.useEffect(() => {
    fetchAllProjects();
  }, []);

  useEffect(() => {
    fetchAllTargets();
    fetchAllAuthentications();
    setTargetErrors([]);
  }, [currentProject]);

  const handleScanClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!currentTarget) {
      setTargetErrors(['Target is required']);
    }

    if (!currentTarget) {
      return;
    }

    const requestGenerator = messageHandler.requestGenerator<ScanParams>(
      SCAN,
      v4(),
      {
        project: currentProject,
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
        case INVALID_TARGET: {
          setTargetErrors(['Invalid target: ' + response.payload]);
          break;
        }
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

      <div>
        <Label htmlFor='current-project'>Current Project</Label>
        <Dropdown
          selectedItem={currentProject}
          items={projects}
          name='Project'
          handleChange={setCurrentProject}
          loading={isProjectsLoading}
          id='current-project'
        />
      </div>
      <div className='flex flex-col space-y-1'>
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
            loading={isTargetsLoading}
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
            loading={isAuthsLoading}
          />
        </div>
      </div>
      {isProjectsLoading || isTargetsLoading || isAuthsLoading ? (
        <Loading />
      )  : (
        <button
          onClick={handleScanClick}
          className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
          disabled={isLoading || !currentTarget || !currentProject}
        >
          {isLoading ? 'Loading...' : 'Start Scan'}
        </button>
      )}
    </div>
  );
};

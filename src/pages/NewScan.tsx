import { useProject } from '@hooks/useProject';
import { useTarget } from '@hooks/useTarget';
import { useUser } from '@hooks/useUser';
import { Auth } from '@types_/auth';
import { IdAndName } from '@types_/idAndName';
import { Project } from '@types_/project';
import { Target, TargetTypeEnum } from '@types_/target';
import { v4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CLI_MISSING,
  INVALID_TARGET,
  SCAN,
  SCAN_ID,
  TARGET_CONNECTIVITY_STARTED,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';
import { ScanParams } from '@commands/Scan';
import { Dropdown } from '@components/Dropdown';
import { Label } from '@components/Label';
import { Loading } from '@components/Loading';
import { getAuthenticationsList, GetAuthenticationsListResponse } from '@queries/authsQueries';
import { getProjectsList, GetProjectsListResponse } from '@queries/projectsQueries';
import { getTargetsList, GetTargetsListResponse } from '@queries/targetQueries';
import { messageHandler } from '@utils/MessageHandler';
import { PageHeader } from '@components/PageHeader';
import { MessageData } from '@utils/Messenger';

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
  const [txtScanInfo, setTxtScanInfo] = useState<React.ReactNode>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isAuthsLoading, setIsAuthsLoading] = React.useState(true);
  const fetchAllAuthentications = async () => {
    setIsAuthsLoading(true);
    const auths = [];

    let page: number | undefined = 1;
    do {
      const result: GetAuthenticationsListResponse = await getAuthenticationsList({
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
      const result: GetProjectsListResponse = await getProjectsList({
        setIsLoggedIn,
        page,
      });
      projects.push(...result.projects);
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
      const result: GetTargetsListResponse = await getTargetsList({
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
      return;
    }

    setTxtScanInfo(
      <span>
        Starting scan, please wait...
      </span>
    );

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

    try {
      for await (const response of requestGenerator) {
        switch (response.command) {
          case SCAN_ID: {
            const scanId = response.payload;
            navigate(`/scans/${scanId}`, { replace: true });
            break;
          }
          case TARGET_CONNECTIVITY_STARTED: {
            setTxtScanInfo(
              <span>
                {response.payload}
              </span>
            );
            break;
          }
          case INVALID_TARGET: {
            setTargetErrors(['Invalid target: ' + response.payload]);
            setTxtScanInfo(
              <span className="text-red-600">
                Scan didn't start due to an issue with the target.
              </span>
            );
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
    } catch (err) {
      // requestGenerator throws when the request carries an error, which is how
      // Scan reports a CLI that stopped without starting a scan (NV-4827).
      // Without this the rejection escaped the handler and left the button
      // stuck on "Loading..." with no explanation.
      const message = err instanceof Error ? err.message : String(err);
      setTxtScanInfo(
        <span className='whitespace-pre-wrap break-words text-red-600'>
          {message}
        </span>
      );
    } finally {
      setIsLoading(false);
    }
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
      <PageHeader title='Scan' backTo='/scans' />

      <div>
        <Label htmlFor='current-project'>Current Project</Label>
        <Dropdown
          selectedItem={currentProject}
          items={projects}
          name='Project'
          handleChange={setCurrentProject}
          loading={isProjectsLoading}
          id='current-project'
          disabled={isLoading || isTargetsLoading || isAuthsLoading} // If scan started, don't allow to change project
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
      ) : (
        <button
          onClick={handleScanClick}
          className='truncate rounded disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-[--vscode-button-background]'
          disabled={isLoading || !currentTarget || !currentProject}
        >
          {isLoading ? 'Loading...' : 'Start Scan'}
        </button>
      )}
      {txtScanInfo && (
        <div className='flex items-center space-x-2 text-sm'>
          {txtScanInfo}
        </div>
      )}
    </div>
  );
};

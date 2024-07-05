import { Dispatch, SetStateAction, createContext } from 'react';

export interface IdAndName {
  id: string;
  name: string;
}

export interface Project extends IdAndName {}
export interface ProjectContextType {
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  currentProject?: Project;
  setCurrentProject: (project: Project) => void;
}

export const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  setProjects: () => {},
  currentProject: undefined,
  setCurrentProject: () => {},
});

import { createContext } from 'react';

export interface IdAndName {
  id: string;
  name: string;
}

export interface Project extends IdAndName {}
export interface ProjectContextType {
  currentProject?: Project;
  setCurrentProject: (project: Project) => void;
}

export const ProjectContext = createContext<ProjectContextType>({
  currentProject: undefined,
  setCurrentProject: () => {},
});

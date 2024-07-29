import { Project } from '@types_/project';
import { createContext } from 'react';

export interface ProjectContextType {
  currentProject?: Project;
  setCurrentProject: (project: Project) => void;
}

export const ProjectContext = createContext<ProjectContextType>({
  currentProject: undefined,
  setCurrentProject: () => {},
});

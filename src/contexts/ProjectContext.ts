import { Dispatch, SetStateAction, createContext } from 'react';

interface ProjectContextType {
  projects: string[];
  setProjects: Dispatch<SetStateAction<string[]>>;
  currentProject: string;
  setCurrentProject: Dispatch<SetStateAction<string>>;
}

export const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  setProjects: () => {},
  currentProject: '',
  setCurrentProject: () => {},
});

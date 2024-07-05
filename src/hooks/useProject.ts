import {
  Project,
  ProjectContext,
  ProjectContextType,
} from '@contexts/ProjectContext';
import { useContext } from 'react';

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  if (!context.currentProject) {
    throw new Error('Current project is not available');
  }
  return context as ProjectContextType & { currentProject: Project };
};

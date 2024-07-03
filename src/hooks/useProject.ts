import { ProjectContext } from '@contexts/ProjectContext';
import { useContext } from 'react';

export const useProject = () => useContext(ProjectContext);

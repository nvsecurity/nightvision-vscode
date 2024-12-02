import { DASTOptionsContext, DASTOptionsContextType } from '@contexts/DASTOptionsContext';
import { useContext } from 'react';

export const useToggleDASTOptions = (): DASTOptionsContextType => {
    const context = useContext(DASTOptionsContext);
    if (!context) {
      throw new Error('useToggleDASTOptions must be used within a DASTOptionsProvider');
    }
    return context;
  };
  

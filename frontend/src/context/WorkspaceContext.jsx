import React, {createContext, useState, useContext} from 'react';
import PropTypes from 'prop-types';

// Create the context
const WorkspaceContext = createContext();

/**
 * Custom hook to use the workspace context
 * @returns {object} Workspace context values
 */
export const useWorkspace = () => {
  return useContext(WorkspaceContext);
};

/**
 * Workspace provider component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {object} Provider component
 */
export const WorkspaceProvider = ({children}) => {
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  const value = {
    currentWorkspace,
    setCurrentWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

WorkspaceProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default WorkspaceContext;

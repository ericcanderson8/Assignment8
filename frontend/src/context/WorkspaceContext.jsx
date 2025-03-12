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
  const [currentChannel, setCurrentChannel] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedDM, setSelectedDM] = useState(null);
  const [viewingMessages, setViewingMessages] = useState(false);
  const [selectedChannelData, setSelectedChannelData] = useState(null);
  const [selectedDMData, setSelectedDMData] = useState(null);

  const value = {
    currentWorkspace,
    setCurrentWorkspace,
    currentChannel,
    setCurrentChannel,
    currentUser,
    setCurrentUser,
    selectedChannel,
    setSelectedChannel,
    selectedDM,
    setSelectedDM,
    viewingMessages,
    setViewingMessages,
    selectedChannelData,
    setSelectedChannelData,
    selectedDMData,
    setSelectedDMData,
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

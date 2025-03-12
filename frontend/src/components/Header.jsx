import {useState, useEffect} from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  MenuItem,
  Box,
  Paper,
  Divider,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import MessageIcon from '@mui/icons-material/Message';
import {useWorkspace} from '../context/WorkspaceContext';
/**
 * Header component with dropdown menu for workspaces
 * @returns {object} Header with dropdown
 */
export default function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState(null);
  const {setCurrentWorkspace} = useWorkspace();

  const fetchWorkspaces = async () => {
    const response = await fetch('http://localhost:3010/api/v0/workspaces', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const data = await response.json();
    setWorkspaces(data);
  };

  const fetchCurrentWorkspace = async () => {
    const response = await fetch('http://localhost:3010/api/v0/workspaces/current', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (response.status === 404) {
      // No current workspace
      setCurrentWorkspaceState(null);
      return;
    }

    const data = await response.json();

    // Make sure we're accessing the right property
    setCurrentWorkspaceState(data);
    setCurrentWorkspace(data.currentWorkspace);
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchCurrentWorkspace();
  }, []);


  const setWorkspaceAsCurrent = async (workspaceId) => {
    // Update workspace status in the database
    await fetch('http://localhost:3010/api/v0/workspaces/current', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({workspaceId}),
    });

    // Refresh current workspace
    fetchCurrentWorkspace();
  };

  const handleClick = (event) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Find the current workspace name from the workspaces list
  const getCurrentWorkspaceName = () => {
    if (!currentWorkspace) return 'Select a Workspace';

    const workspace =
     workspaces.find((ws) => (ws.id) === currentWorkspace.currentWorkspace);
    return workspace ? workspace.name : 'Select a Workspace';
  };

  return (
    <Box sx={{position: 'relative'}}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
            {getCurrentWorkspaceName()}
          </Typography>
          <Box sx={{display: 'flex', alignItems: 'center'}}>
            <IconButton
              color="inherit"
              onClick={handleClick}
              size="small"
              aria-controls={open ? 'workspace-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              aria-label="workspace-menu"
            >
              <ArrowDropDownIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Full-width menu that appears below the header */}
      {open && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            zIndex: 1100,
          }}
        >
          <Box sx={{p: 2}}>
            {workspaces
                .filter((workspace) =>
                  !currentWorkspace ||
                workspace.id!== currentWorkspace.currentWorkspace)
                .map((workspace) => (
                  <MenuItem
                    key={workspace.id}
                    onClick={() => {
                      setWorkspaceAsCurrent(workspace.id);
                      handleClose();
                    }}
                    aria-label={`View workspace: ${workspace.name}`}
                    sx={{
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <MessageIcon color="primary" fontSize="small" />
                    {workspace.name}
                  </MenuItem>
                ))}
            <Divider sx={{my: 1}} />
            <MenuItem
              onClick={handleClose}
              sx={{
                borderRadius: '4px',
                color: 'primary.main',
              }}
            >
              <AddIcon sx={{mr: 1}} />
              Add Workspace
            </MenuItem>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

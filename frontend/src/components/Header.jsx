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
  const {setCurrentWorkspace} = useWorkspace();

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('http://localhost:3010/api/v0/workspaces', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setWorkspaces(data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const setWorkspace = async (workspaceId) => {
    try {
      // Update workspace status in the database
      await fetch('http://localhost:3010/api/v0/workspaces/current', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({workspaceId}),
      });
      // Refresh workspaces list to get updated current status
      fetchWorkspaces();
      setCurrentWorkspace(workspaceId);
    } catch (error) {
      console.error('Error setting current workspace:', error);
    }
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

  return (
    <Box sx={{position: 'relative'}}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
            {workspaces
                .find((ws) =>
                  ws.current === 'true',
                )?.name || 'Select a Workspace'}
          </Typography>
          <Box sx={{display: 'flex', alignItems: 'center'}}>
            <IconButton
              color="inherit"
              onClick={handleClick}
              size="small"
              aria-controls={open ? 'workspace-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
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
                .filter((workspace) => workspace.current !== 'true')
                .map((workspace) => (
                  <MenuItem
                    key={workspace.id}
                    onClick={() => {
                      setWorkspace(workspace.id);
                      handleClose();
                    }}
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

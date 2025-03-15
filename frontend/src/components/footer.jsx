import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import {useNavigate} from 'react-router-dom';
import PropTypes from 'prop-types';
import {useWorkspace} from '../context/WorkspaceContext';

/**
 * Footer component with navigation buttons
 * @param {object} props - Component props
 * @param {boolean} props.showingChannels - Whether channels view is active
 * @returns {object} Footer UI
 */
const Footer = ({showingChannels}) => {
  const navigate = useNavigate();
  const {setViewingMessages} = useWorkspace();

  /**
   * Handles going back to channels view
   */
  const handleGoHome = () => {
    setViewingMessages(false);
  };

  /**
   * Handles logout
   */
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('name');

    // Navigate to login page
    navigate('/');
  };

  return (
    <AppBar
      position="fixed"
      color="default"
      sx={{
        top: 'auto',
        bottom: 0,
        boxShadow: 3,
      }}
    >
      <Toolbar sx={{justifyContent: 'space-between'}}>
        <Box>
          <IconButton
            color="primary"
            aria-label="go home"
            onClick={handleGoHome}
            disabled={showingChannels}
            sx={{
              opacity: showingChannels ? 0.5 : 1,
            }}
          >
            <HomeIcon />
          </IconButton>
        </Box>
        <Box>
          <IconButton
            color="error"
            aria-label="logout"
            onClick={handleLogout}
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

Footer.propTypes = {
  showingChannels: PropTypes.bool.isRequired,
};

export default Footer;

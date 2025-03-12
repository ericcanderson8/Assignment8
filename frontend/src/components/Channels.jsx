// Channels.jsx
// This component is used to display the channels in the workspace
// It is a list of channels that the user can select from
// It will also have the dms chanels in the workspace
// both of which have a minimize button

import {useState, useEffect} from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import {styled} from '@mui/material/styles';
import {useWorkspace} from '../context/WorkspaceContext';

// Styled components for custom UI elements
const SectionHeader = styled(Box)(({theme}) => ({
  'display': 'flex',
  'alignItems': 'center',
  'padding': '8px 16px',
  'cursor': 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ChannelItem = styled(ListItem)(({selected, theme}) => ({
  'padding': '4px 16px 4px 24px',
  'cursor': 'pointer',
  'backgroundColor': selected ? theme.palette.action.selected : 'transparent',
  'borderLeft': selected ?
   `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const AddItem = styled(ListItem)(({theme}) => ({
  'padding': '4px 16px 4px 24px',
  'cursor': 'pointer',
  'color': theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
  },
}));

const StatusDot = styled('span')(({online, theme}) => ({
  display: 'inline-block',
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: online ? '#4caf50' : 'transparent',
  marginRight: theme.spacing(1),
  position: 'absolute',
  bottom: 2,
  right: 2,
}));

/**
 * Dashboard component shown after successful login
 * @returns {object} Dashboard UI
 */
export default function Channels() {
  // State for managing collapse/expand of sections
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [directMessagesOpen, setDirectMessagesOpen] = useState(true);

  // State for selected items
  //   const [selectedChannel, setSelectedChannel] = useState(null);
  //   const [selectedDM, setSelectedDM] = useState(null);

  // State for channels data
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);

  // State for storing the selected channel/DM details
  // Gonna put these in Context to use when I separate it to another file
  // State to track if we're viewing message area (for mobile)
  //   const [viewingMessages, setViewingMessages] = useState(false);

  // Get current workspace from context
  const {currentWorkspace,
    currentUser,
    selectedChannel,
    setSelectedChannel,
    selectedDM,
    setSelectedDM,
    setViewingMessages,
    setSelectedChannelData,
    setSelectedDMData,
  } = useWorkspace();
  // put set selected channel and set in useWorkspace context

  const fetchUsers = async () => {
    if (!currentWorkspace) return;

    const response = await fetch(
        `http://localhost:3010/api/v0/workspaces/${currentWorkspace}/users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

    const data = await response.json();
    setUsers(data);
  };

  // Fetch channels when workspace changes
  useEffect(() => {
    const fetchChannels = async () => {
      if (!currentWorkspace) return;

      const response = await fetch(
          `http://localhost:3010/api/v0/workspaces/${currentWorkspace}/channels`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });


      const data = await response.json();
      setChannels(data);

      // Select first channel by default if we have channels and none selected
      if (data && data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0].id);
        setSelectedChannelData(data[0]);
      }
    };

    fetchChannels();
    fetchUsers();
  }, [currentWorkspace, selectedChannel]);

  // Update selected channel data when selectedChannel changes
  useEffect(() => {
    if (selectedChannel) {
      const channel = channels.find((ch) => (ch.id) === selectedChannel);
      if (channel) {
        setSelectedChannelData(channel);
        // Clear any selected DM
        setSelectedDM(null);
        setSelectedDMData(null);
      }
    }
  }, [selectedChannel, channels]);

  // Update selected DM data when selectedDM changes
  useEffect(() => {
    if (selectedDM) {
      const dm = users.find((user) => (user.id) === selectedDM);
      if (dm) {
        setSelectedDMData(dm);
        // Clear any selected channel
        setSelectedChannel(null);
        setSelectedChannelData(null);
      }
    }
  }, [selectedDM, users]);


  const handleSelectChannel = (channelId) => {
    setSelectedChannel(channelId);
    setSelectedChannelData(channels.find((ch) => (ch.id) === channelId));
    setSelectedDM(null); // Deselect any DM
    setSelectedDMData(null); // Clear any DM data
    setViewingMessages(true); // Switch to message view on mobile
  };

  // Handler for selecting a DM
  const handleSelectDM = (dmId) => {
    setSelectedDM(dmId);
    setSelectedDMData(users.find((user) => (user.id) === dmId));
    setSelectedChannel(null); // Deselect any channel
    setSelectedChannelData(null); // Clear any channel data
    setViewingMessages(true); // Switch to message view on mobile
  };

  // this one will move to another file
  // Handler for going back to channel list
  //   const handleBackToChannels = () => {
  //     setViewingMessages(false);
  //   };

  // If we're on mobile and viewing messages, only show the message area

  // Otherwise, show the channel list
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'background.paper',
        overflow: 'auto',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Channels Section */}
      <SectionHeader onClick={() => setChannelsOpen(!channelsOpen)}>
        {channelsOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ml: 1}}>
          Channels
        </Typography>
      </SectionHeader>

      <Collapse in={channelsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{padding: 0, margin: 0}}>
          {channels.length > 0 ? (
            channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                selected={selectedChannel === channel.id}
                onClick={() => handleSelectChannel(channel.id)}
              >
                <Typography variant="body1"
                  sx={{fontWeight: selectedChannel === channel.id ?
                  'bold' : 'normal'}}>
                  # {channel.name}
                </Typography>
              </ChannelItem>
            ))
          ) : currentWorkspace ? (
            <ListItem sx={{pl: 3}}>
              <Typography variant="body2" color="text.secondary">
                No channels found
              </Typography>
            </ListItem>
          ) : (
            <ListItem sx={{pl: 3}}>
              <Typography variant="body2" color="text.secondary">
                Select a workspace to view channels
              </Typography>
            </ListItem>
          )}

          {currentWorkspace && (
            <AddItem>
              <AddIcon sx={{mr: 1}} />
              <Typography variant="body1">
                Add Channel
              </Typography>
            </AddItem>
          )}
        </List>
      </Collapse>

      {/* Direct Messages Section */}
      <SectionHeader
        onClick={() => setDirectMessagesOpen(!directMessagesOpen)}
      >
        {directMessagesOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ml: 1}}>
          Direct Messages
        </Typography>
      </SectionHeader>

      <Collapse in={directMessagesOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{padding: 0, margin: 0}}>
          {users.map((dm) => (
            <ChannelItem
              key={dm.id}
              selected={selectedDM === dm.id}
              onClick={() => handleSelectDM(dm.id)}
            >
              <Box position="relative"
                display="inline-flex" alignItems="center">
                <PersonIcon fontSize="small" />
                <StatusDot online={dm.online} />
              </Box>
              <Typography variant="body1"
                sx={{ml: 1, fontWeight: selectedDM === dm.id ?
                 'bold' : 'normal'}}>
                {dm.name}{(dm.id) === currentUser ? ' (you)' : ''}
              </Typography>
            </ChannelItem>
          ))}

          <AddItem>
            <AddIcon sx={{mr: 1}} />
            <Typography variant="body1">
              Add Teammate
            </Typography>
          </AddItem>
        </List>
      </Collapse>
    </Box>
  );
}


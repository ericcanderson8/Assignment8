// Channels.jsx
// This component is used to display the channels in the workspace
// It is a list of channels that the user can select from
// It will also have the dms chanels in the workspace
// both of which have a minimize button

import {useState} from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Collapse,
//   IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// import TagIcon from '@mui/icons-material/Tag';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import {styled} from '@mui/material/styles';

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

// TODO: get the channels from the backend
// Mock data
const channelsData = [
  {id: 1, name: 'Assignment 1'},
  {id: 2, name: 'Assignment 2'},
  {id: 3, name: 'Assignment 3'},
  {id: 4, name: 'Assignment 4'},
  {id: 5, name: 'General'},
];

// TODO: get the dms from the backend
const directMessagesData = [
  {id: 1, name: 'Dilbot', online: false},
  {id: 2, name: 'Dr Harrison (you)', online: true},
  {id: 3, name: 'Bob Dylan', online: false},
  {id: 4, name: 'Carole King', online: true},
  {id: 5, name: 'George Harrison', online: false},
  {id: 6, name: 'Joni Mitchell', online: false},
];

/**
 * Channels component
 * @returns {object} Channels UI
 */
export default function Channels() {
  // State for managing collapse/expand of sections
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [directMessagesOpen, setDirectMessagesOpen] = useState(true);

  // State for selected items
  const [selectedChannel, setSelectedChannel] = useState(2);
  const [selectedDM, setSelectedDM] = useState(3);

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      bgcolor: 'background.paper',
      overflow: 'auto',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
    }}>
      {/* Channels Section */}
      <SectionHeader onClick={() => setChannelsOpen(!channelsOpen)}>
        {channelsOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ml: 1}}>
          Channels
        </Typography>
      </SectionHeader>

      <Collapse in={channelsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{padding: 0, margin: 0}}>
          {channelsData.map((channel) => (
            <ChannelItem
              key={channel.id}
              selected={selectedChannel === channel.id}
              onClick={() => setSelectedChannel(channel.id)}
            >
              <Typography variant="body1"
                sx={{fontWeight: selectedChannel === channel.id ?
                'bold' : 'normal'}}>
                # {channel.name}
              </Typography>
            </ChannelItem>
          ))}

          <AddItem>
            <AddIcon sx={{mr: 1}} />
            <Typography variant="body1"
              sx={{}}>
              Add Channel
            </Typography>
          </AddItem>
        </List>
      </Collapse>

      {/* Direct Messages Section */}
      <SectionHeader onClick={() => setDirectMessagesOpen(!directMessagesOpen)}>
        {directMessagesOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ml: 1}}>
          Direct Messages
        </Typography>
      </SectionHeader>

      <Collapse in={directMessagesOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{padding: 0, margin: 0}}>
          {directMessagesData.map((dm) => (
            <ChannelItem
              key={dm.id}
              selected={selectedDM === dm.id}
              onClick={() => setSelectedDM(dm.id)}
            >
              <Box position="relative"
                display="inline-flex" alignItems="center">
                <PersonIcon fontSize="small" />
                <StatusDot online={dm.online} />
              </Box>
              <Typography variant="body1"
                sx={{ml: 1, fontWeight: selectedDM === dm.id ?
                 'bold' : 'normal'}}>
                {dm.name}
              </Typography>
            </ChannelItem>
          ))}

          <AddItem>
            <AddIcon sx={{mr: 1}} />
            <Typography variant="body1"
              sx={{}}>
              Add Teammate
            </Typography>
          </AddItem>
        </List>
      </Collapse>
    </Box>
  );
}


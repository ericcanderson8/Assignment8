import {useState, useEffect} from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import PropTypes from 'prop-types';

/**
 * MessageArea component for displaying and sending messages
 * @param {object} props - Component props
 * @param {string} props.channelId - ID of the selected channel
 * @param {string} props.channelName - Name of the selected channel
 * @param {string} props.dmId - ID of the selected DM
 * @param {string} props.dmName - Name of the selected DM
 * @param {object} props.onBack - Callback for when back button is clicked
 * @returns {object} MessageArea component
 */
export default function MessageArea({
  channelId,
  channelName,
  dmId,
  dmName,
  onBack,
}) {
  const [messages, setMessages] = useState([]);

  // console.log('MessageArea received props:', {
  //   channelId,
  //   channelName,
  //   dmId,
  //   dmName,
  // });

  // Fetch real messages from the backend
  useEffect(() => {
    // Different messages depending on whether it's a channel or DM

    // Clear any existing messages first
    setMessages([]);

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        let url;

        // If we have a channel ID, fetch channel messages
        if (channelId) {
          url = `http://localhost:3010/api/v0/channels/${channelId}/messages`;
        } else if (dmId) {
          url = `http://localhost:3010/api/v0/dm/${dmId}/messages`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // if (!response.ok) {
        //   // If the response fails, fall back to demo data
        //   console.error('Failed to fetch messages, using demo data');
        //   loadDemoMessages();
        //   return;
        // }

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        // If there's an error, fall back to demo data
        // loadDemoMessages();
      }
    };

    // const loadDemoMessages = () => {
    //   // If we have a channel ID, load channel demo messages
    //   if (channelId) {
    //     setMessages([
    //       {
    //         id: '1',
    //         content: 'Hello everyone! Welcome to the channel.',
    //         sender: 'Anna',
    //         timestamp: '2023-05-15T10:30:00',
    //         userId: '123456',
    //       },
    //       {
    //         id: '2',
    //         content: 'Thanks for creating this channel. I' +
    //           'very useful.',
    //         sender: 'Bob',
    //         timestamp: '2023-05-15T10:35:00',
    //         userId: '789012',
    //       },
    //       {
    //         id: '3',
    //         content: 'I agree! Let\'s start planning our project here.',
    //         sender: 'Charlie',
    //         timestamp: '2023-05-15T10:40:00',
    //         userId: '345678',
    //       },
    //       {
    //         id: '4',
    //         content: 'Has anyone started working on the UI designs?',
    //         sender: 'Anna',
    //         timestamp: '2023-05-15T11:15:00',
    //         userId: '123456',
    //       },
    //     ]);
    //   } else if (dmId) {
    //     setMessages([
    //       {
    //         id: '1',
    //         content: 'Hey, how are you doing?',
    //         sender: 'You',
    //         timestamp: '2023-05-15T09:30:00',
    //         userId: '123456',
    //       },
    //       {
    //         id: '2',
    //         content: 'I\'m good, thanks! How about you?',
    //         sender: dmName,
    //         timestamp: '2023-05-15T09:32:00',
    //         userId: dmId,
    //       },
    //       {
    //         id: '3',
    //         content: 'Great! Did you get a chance to look at I sent?',
    //         sender: 'You',
    //         timestamp: '2023-05-15T09:35:00',
    //         userId: '123456',
    //       },
    //       {
    //         id: '4',
    //         content: 'Yes, I did. It looks promising. Let\'s discuss it ' +
    //           'tomorrow.',
    //         sender: dmName,
    //         timestamp: '2023-05-15T09:40:00',
    //         userId: dmId,
    //       },
    //     ]);
    //   }
    // };

    fetchMessages();
  }, [channelId, dmId, channelName, dmName]);

  /**
   * Handle sending a new message
   * @param {string} content - Message content
   */
  const handleSendMessage = async (content) => {
    // if (!content.trim()) return;

    const token = localStorage.getItem('token');
    let url;

    // Determine if we're sending to a channel or DM
    if (channelId) {
      url = `http://localhost:3010/api/v0/channels/${channelId}/messages`;
    } else if (dmId) {
      url = `http://localhost:3010/api/v0/dm/${dmId}/messages`;
    }
    // } else {
    //   console.error('No channelId or dmId provided');
    //   return;
    // }

    // Optimistically add message to UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content,
      sender: 'You',
      timestamp: new Date().toISOString(),
      userId: 'temp-user-id', // Will be replaced with actual ID from response
      pending: true, // Flag to show this is pending
    };

    setMessages([...messages, tempMessage]);

    // Send message to backend
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({content}),
    });

    // Replace temp message with actual response
    const newMessage = await response.json();
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
          (msg.id) === tempMessage.id ? newMessage : msg,
      ),
    );
  };

  // Determine if we're in a channel or DM
  const isChannel = Boolean(channelId);
  const title = isChannel ? `# ${channelName}` : dmName;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '90vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        backgroundColor: '#f8f8f8',
      }}
    >
      {/* Header - Styled like the Header component */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            aria-label="back"
            onClick={onBack}
            color="inherit"
            sx={{mr: 2}}
          >
            <Avatar sx={{bgcolor: 'primary.dark', width: 30, height: 30}}>
              <ArrowBackIcon fontSize="small" />
            </Avatar>
          </IconButton>
          <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Message List */}
      <Box sx={{flexGrow: 1, overflow: 'auto', p: 2}}>
        <MessageList messages={messages} />
      </Box>

      {/* Message Input */}
      <Box sx={{p: 2, backgroundColor: '#fff'}}>
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={`Message ${title}`}
        />
      </Box>
    </Paper>
  );
}

MessageArea.propTypes = {
  channelId: PropTypes.string,
  channelName: PropTypes.string,
  dmId: PropTypes.string,
  dmName: PropTypes.string,
  onBack: PropTypes.func.isRequired,
};

import {Box, Typography, Avatar} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Component to display a list of messages
 * @param {object} props - Component props
 * @param {Array} props.messages - Array of message objects
 * @returns {object} MessageList component
 */
export default function MessageList({messages}) {
  // Helper function to format timestamps
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    } catch {
      return 'Invalid time';
    }
  };

  // Format date for date headers
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Group messages by date for date separators
  const groupedMessages = messages.reduce((acc, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <Box key={date}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              my: 2,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }}
            >
              {formatDate(date)}
            </Typography>
          </Box>

          {dateMessages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                mb: 2,
                alignItems: 'flex-start',
              }}
            >
              <Avatar
                sx={{mr: 1, width: 36, height: 36}}
                alt={message.sender}
                src={`https://ui-avatars.com/api/?name=${
                  encodeURIComponent(message.sender)
                }&background=random`}
              />
              <Box>
                <Box sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{mr: 1}}
                  >
                    {message.sender}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(message.timestamp)}
                  </Typography>
                </Box>
                <Typography variant="body1">{message.content}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        sender: PropTypes.string.isRequired,
        timestamp: PropTypes.string.isRequired,
        userId: PropTypes.string.isRequired,
      }),
  ).isRequired,
};

import {useState} from 'react';
import {TextField, IconButton, Box} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PropTypes from 'prop-types';

/**
 * Component for inputting and sending messages
 * @param {object} props - Component props
 * @param {object} props.onSendMessage - message
 * @param {string} props.placeholder - Placeholder text for the input field
 * @returns {object} MessageInput component
 */
export default function MessageInput({onSendMessage, placeholder}) {
  const [message, setMessage] = useState('');

  /**
   * Handle sending a message
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            'borderRadius': 20,
            'bgcolor': '#f0f2f5',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <IconButton
              color="primary"
              aria-label="send message"
              onClick={handleSubmit}
              disabled={!message.trim()}
              sx={{mr: -1}}
            >
              <SendIcon />
            </IconButton>
          ),
        }}
      />
    </Box>
  );
}

MessageInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

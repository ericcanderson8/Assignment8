import {useState} from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
} from '@mui/material';
import {useNavigate} from 'react-router-dom';

/**
 * Login component for user authentication
 * @returns {object} Login form
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * Handles form submission
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      const response = await fetch('http://localhost:3010/api/v0/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message ||
             'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      // Store token for authenticated requests
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('name', data.name || '');

      // Navigate to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{mt: 8, p: 4}}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>

          {/* Display error message if login fails */}
          {error && (
            <Alert severity="error" sx={{mt: 2, width: '100%'}}>
              {error}
            </Alert>
          )}

          <Box component="form"
            onSubmit={handleSubmit} sx={{mt: 3, width: '100%'}}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="login-email"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="login-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{mt: 3, mb: 2}}
              aria-label="login-submit"
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

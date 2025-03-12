import {useEffect} from 'react';
import {Container} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import Header from './Header';
import Channels from './Channels';
import {useWorkspace} from '../context/WorkspaceContext';
/**
 * Dashboard component shown after successful login
 * @returns {object} Dashboard UI
 */
export default function Dashboard() {
//   const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const {setCurrentUser} = useWorkspace();
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    // const name = localStorage.getItem('name');
    const userId = localStorage.getItem('id');
    setCurrentUser(userId);
    if (!token) {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [navigate]);

  return (
    <>
      <Header />
      <Container maxWidth="md">
        {/* <Paper elevation={3} sx={{mt: 4, p: 4}}>
          <Box sx={{textAlign: 'center'}}>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome to Your Dashboard
            </Typography>
            <Typography variant="h6">
              Hello, {userName}!
            </Typography>
            <Typography variant="body1" sx={{mt: 2}}>
              You have successfully logged in.
            </Typography>
          </Box>
        </Paper> */}
        <Channels />
      </Container>
    </>
  );
}

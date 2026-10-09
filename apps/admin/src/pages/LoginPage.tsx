import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Input,
  Button,
  FormControl,
  FormLabel,
  Alert,
  Stack,
  Chip
} from '@mui/joy';
import { Lock, User, Shield, Beer } from 'lucide-react';
import { BAR_SETTINGS } from '../types';
import { clearSessionMessage, getSessionMessage, loginAdmin } from '../services/api';
import { ThemeToggle } from '../components/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(() => getSessionMessage());

  useEffect(() => {
    clearSessionMessage();
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await loginAdmin(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.body',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative'
      }}
    >
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle size="md" variant="outlined" />
      </Box>

      <Card
        variant="outlined"
        sx={{
          maxWidth: 420,
          width: '100%',
          bgcolor: 'background.surface',
          borderColor: 'divider',
          borderRadius: '24px',
          p: 4,
          boxShadow: 'md'
        }}
      >
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                bgcolor: 'primary.softBg',
                color: 'primary.500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Shield size={32} />
            </Box>
            <Typography level="h2" sx={{ color: 'text.primary', fontWeight: 800 }}>
              {BAR_SETTINGS.NAME}
            </Typography>
            <Typography level="body-sm" sx={{ color: 'primary.500', fontWeight: 600 }}>
              Administrator Management Portal
            </Typography>
          </Box>

          {errorMsg && (
            <Alert color="danger" sx={{ mb: 2.5 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <Stack spacing={2}>
              <FormControl>
                <FormLabel sx={{ color: 'text.secondary' }}>Username</FormLabel>
                <Input
                  size="lg"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  startDecorator={<User size={18} color="#71717a" />}
                  sx={{ bgcolor: 'background.level1', borderColor: 'divider', color: 'text.primary' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel sx={{ color: 'text.secondary' }}>Password</FormLabel>
                <Input
                  size="lg"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  startDecorator={<Lock size={18} color="#71717a" />}
                  sx={{ bgcolor: 'background.level1', borderColor: 'divider', color: 'text.primary' }}
                />
              </FormControl>

              <Button
                size="lg"
                type="submit"
                loading={loading}
                sx={{
                  bgcolor: 'primary.solidBg',
                  color: '#fff',
                  mt: 1,
                  borderRadius: '12px',
                  fontWeight: 700,
                  '&:hover': { bgcolor: 'primary.solidHoverBg' }
                }}
              >
                Sign In to Admin Portal
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 3.5, pt: 2.5, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
              Default credentials: <code>admin</code> / <code>admin123</code>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

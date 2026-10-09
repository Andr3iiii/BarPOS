import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, Stack } from '@mui/joy';
import { Compass, Home } from 'lucide-react';
import { getStoredUser, getStoredToken } from '../services/api';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const token = getStoredToken();
  const user = getStoredUser();

  const handleGoHome = () => {
    if (!token || !user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/pos');
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
        p: 3
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 480,
          width: '100%',
          bgcolor: 'background.surface',
          borderColor: 'divider',
          borderRadius: '24px',
          p: 4,
          textAlign: 'center',
          boxShadow: 'md'
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              p: 2,
              borderRadius: '20px',
              bgcolor: 'primary.softBg',
              color: 'primary.500',
              display: 'inline-flex'
            }}
          >
            <Compass size={40} />
          </Box>
          <Typography level="h1" sx={{ color: 'text.primary', fontWeight: 800 }}>
            404
          </Typography>
          <Typography level="title-md" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Page Not Found
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', maxWidth: 360 }}>
            The destination URL does not exist or has been moved to a different route.
          </Typography>
          <Button
            size="md"
            variant="solid"
            onClick={handleGoHome}
            startDecorator={<Home size={18} />}
            sx={{
              bgcolor: 'primary.solidBg',
              color: '#fff',
              mt: 2,
              borderRadius: '12px',
              fontWeight: 600,
              '&:hover': { bgcolor: 'primary.solidHoverBg' }
            }}
          >
            Return to Dashboard
          </Button>
        </Stack>
      </Card>
    </Box>
  );
};

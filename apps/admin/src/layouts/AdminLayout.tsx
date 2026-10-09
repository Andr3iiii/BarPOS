import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Sheet,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  IconButton
} from '@mui/joy';
import {
  LayoutDashboard,
  Wine,
  FolderTree,
  QrCode,
  TrendingUp,
  Users,
  LogOut,
  Beer,
  ExternalLink
} from 'lucide-react';
import { BAR_SETTINGS } from '../types';
import { getStoredUser, clearAdminSession } from '../services/api';
import { ThemeToggle } from '../components/ThemeToggle';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAdminSession();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Wine },
    { label: 'Categories', path: '/categories', icon: FolderTree },
    { label: 'Tables & QR Codes', path: '/tables', icon: QrCode },
    { label: 'Sales Reports', path: '/sales', icon: TrendingUp },
    { label: 'Users & Roles', path: '/users', icon: Users }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body', color: 'text.primary' }}>
      {/* Sidebar Navigation */}
      <Sheet
        variant="plain"
        sx={{
          width: 260,
          bgcolor: 'background.surface',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          p: 2.5,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50
        }}
      >
        {/* Brand & Theme Toggle */}
        <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="center" sx={{ mb: 3, px: 0.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                p: 1,
                borderRadius: '12px',
                bgcolor: 'primary.softBg',
                color: 'primary.500'
              }}
            >
              <Beer size={22} />
            </Box>
            <Box>
              <Typography level="title-sm" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1.2 }}>
                {BAR_SETTINGS.NAME}
              </Typography>
              <Typography level="body-xs" sx={{ color: 'primary.500', fontWeight: 600 }}>
                ADMIN PORTAL
              </Typography>
            </Box>
          </Stack>
          <ThemeToggle size="sm" variant="outlined" />
        </Stack>

        <Divider sx={{ mb: 2.5, borderColor: 'divider' }} />

        {/* Navigation Items */}
        <Stack spacing={0.8} sx={{ flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={isActive ? 'solid' : 'plain'}
                onClick={() => navigate(item.path)}
                startDecorator={<Icon size={18} />}
                sx={{
                  justifyContent: 'flex-start',
                  bgcolor: isActive ? 'primary.solidBg' : 'transparent',
                  color: isActive ? '#fff' : 'text.secondary',
                  borderRadius: '12px',
                  py: 1.2,
                  px: 1.5,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: isActive ? 'primary.solidHoverBg' : 'background.level1',
                    color: isActive ? '#fff' : 'text.primary'
                  }
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        <Divider sx={{ my: 2, borderColor: 'divider' }} />

        {/* Quick link to Mobile Customer Menu & POS */}
        <Box sx={{ mb: 2, px: 1 }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 1, textTransform: 'uppercase' }}>
            Quick Links
          </Typography>
          <Stack spacing={0.6}>
            <a
              href="http://localhost:3001/order/table/1"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none',
                color: '#e05624',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ExternalLink size={14} /> Open Customer Mobile App
            </a>
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none',
                color: '#10b981',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ExternalLink size={14} /> Open Cashier POS Terminal
            </a>
          </Stack>
        </Box>

        {/* User Info & Logout */}
        <Box sx={{ p: 1.5, bgcolor: 'background.level1', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography level="title-sm" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {user?.full_name || 'Admin'}
              </Typography>
              <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px' }}>
                ADMINISTRATOR
              </Chip>
            </Box>
            <IconButton
              size="sm"
              variant="plain"
              color="danger"
              onClick={handleLogout}
              sx={{ '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
            >
              <LogOut size={16} />
            </IconButton>
          </Stack>
        </Box>
      </Sheet>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: 4, maxWidth: 1400, overflowY: 'auto' }}>{children}</Box>
    </Box>
  );
};

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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0b0d14', color: '#f4f4f5' }}>
      {/* Sidebar Navigation */}
      <Sheet
        variant="solid"
        sx={{
          width: 260,
          bgcolor: '#12141f',
          borderRight: '1px solid #202438',
          display: 'flex',
          flexDirection: 'column',
          p: 2.5,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50
        }}
      >
        {/* Brand */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3, px: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: '12px',
              bgcolor: 'rgba(224, 86, 36, 0.15)',
              color: '#ff7a45'
            }}
          >
            <Beer size={22} />
          </Box>
          <Box>
            <Typography level="title-sm" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2 }}>
              {BAR_SETTINGS.NAME}
            </Typography>
            <Typography level="body-xs" sx={{ color: '#ff7a45', fontWeight: 600 }}>
              ADMIN PORTAL
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2.5, borderColor: '#202438' }} />

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
                  bgcolor: isActive ? '#e05624' : 'transparent',
                  color: isActive ? '#fff' : '#a1a1aa',
                  borderRadius: '12px',
                  py: 1.2,
                  px: 1.5,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: isActive ? '#c8461b' : '#191c2b',
                    color: '#fff'
                  }
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        <Divider sx={{ my: 2, borderColor: '#202438' }} />

        {/* Quick link to Mobile Customer Menu & POS */}
        <Box sx={{ mb: 2, px: 1 }}>
          <Typography level="body-xs" sx={{ color: '#71717a', mb: 1, textTransform: 'uppercase' }}>
            Quick Links
          </Typography>
          <Stack spacing={0.6}>
            <a
              href="http://localhost:3001/order/table/1"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none',
                color: '#ff7a45',
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
                color: '#34d399',
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
        <Box sx={{ p: 1.5, bgcolor: '#181b2a', borderRadius: '12px', border: '1px solid #252a3f' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography level="title-sm" sx={{ color: '#fff', fontWeight: 600 }}>
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

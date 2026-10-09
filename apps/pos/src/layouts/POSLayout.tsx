import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Sheet,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  Dropdown,
  Menu,
  MenuItem,
  MenuButton,
  Alert,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent
} from '@mui/joy';
import {
  Receipt,
  LayoutDashboard,
  LogOut,
  User,
  Shield,
  Clock,
  PlusCircle,
  Bell,
  RefreshCw,
  Sparkles,
  Download
} from 'lucide-react';
import { BAR_SETTINGS } from '../types';
import { getStoredUser, clearSession } from '../services/api';
import { ThemeToggle } from '../components/ThemeToggle';
import { UpdateModal } from '../components/UpdateModal';

interface POSLayoutProps {
  children: React.ReactNode;
  onOpenWalkIn?: () => void;
  onRefreshOrders?: () => void;
  isPolling?: boolean;
}

export const POSLayout: React.FC<POSLayoutProps> = ({
  children,
  onOpenWalkIn,
  onRefreshOrders,
  isPolling = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [updateReady, setUpdateReady] = useState<boolean>(false);
  const [newVersion, setNewVersion] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkStatusMessage, setCheckStatusMessage] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getVersion().then((v) => setCurrentVersion(v)).catch(() => {});

      window.electronAPI.onUpdateAvailable((info: any) => {
        const ver = info?.version || 'Latest';
        setNewVersion(ver);
        setCheckStatusMessage(`New version v${ver} detected. Downloading in the background...`);
      });

      window.electronAPI.onUpdateDownloaded((info: any) => {
        const ver = info?.version || 'Latest';
        setNewVersion(ver);
        setUpdateReady(true);
        // Automatically pop up modal asking cashier to update now or later
        setUpdateModalOpen(true);
      });
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.body', color: 'text.primary', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Sheet
        variant="plain"
        sx={{
          bgcolor: 'background.surface',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 1.5,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {/* Brand & Mode */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography level="title-md" sx={{ color: 'text.primary', fontWeight: 800, letterSpacing: '0.04em' }}>
                {BAR_SETTINGS.NAME}
              </Typography>
              <Typography level="body-xs" sx={{ color: '#e05624', fontWeight: 600 }}>
                POS CASHIER TERMINAL
              </Typography>
            </Box>

            {/* Nav Tabs */}
            <Stack direction="row" spacing={1} sx={{ ml: 4 }}>
              <Button
                size="sm"
                variant={
                  location.pathname === '/' ||
                  location.pathname === '/pos' ||
                  location.pathname === '/pos/orders' ||
                  location.pathname === '/orders'
                    ? 'solid'
                    : 'plain'
                }
                onClick={() => navigate('/pos/orders')}
                startDecorator={<Receipt size={17} />}
                sx={{
                  bgcolor:
                    location.pathname === '/' ||
                    location.pathname === '/pos' ||
                    location.pathname === '/pos/orders' ||
                    location.pathname === '/orders'
                      ? 'primary.solidBg'
                      : 'transparent',
                  color:
                    location.pathname === '/' ||
                    location.pathname === '/pos' ||
                    location.pathname === '/pos/orders' ||
                    location.pathname === '/orders'
                      ? '#fff'
                      : 'text.secondary',
                  fontWeight: 600,
                  borderRadius: '10px',
                  '&:hover': {
                    bgcolor:
                      location.pathname === '/' ||
                      location.pathname === '/pos' ||
                      location.pathname === '/pos/orders' ||
                      location.pathname === '/orders'
                        ? 'primary.solidHoverBg'
                        : 'background.level1'
                  }
                }}
              >
                Orders
              </Button>

              <Button
                size="sm"
                variant={
                  location.pathname === '/pos/dashboard' || location.pathname === '/dashboard'
                    ? 'solid'
                    : 'plain'
                }
                onClick={() => navigate('/pos/dashboard')}
                startDecorator={<LayoutDashboard size={17} />}
                sx={{
                  bgcolor:
                    location.pathname === '/pos/dashboard' || location.pathname === '/dashboard'
                      ? 'primary.solidBg'
                      : 'transparent',
                  color:
                    location.pathname === '/pos/dashboard' || location.pathname === '/dashboard'
                      ? '#fff'
                      : 'text.secondary',
                  fontWeight: 600,
                  borderRadius: '10px',
                  '&:hover': {
                    bgcolor:
                      location.pathname === '/pos/dashboard' || location.pathname === '/dashboard'
                        ? 'primary.solidHoverBg'
                        : 'background.level1'
                  }
                }}
              >
                Dashboard
              </Button>

              {user?.role === 'admin' && (
                <Button
                  size="sm"
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/admin')}
                  startDecorator={<Shield size={16} />}
                  sx={{
                    borderRadius: '10px',
                    fontWeight: 700,
                    borderColor: 'primary.500',
                    color: 'primary.500',
                    '&:hover': { bgcolor: 'primary.softBg' }
                  }}
                >
                  Admin Portal
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Right Action Items: Live status, Clock, Walk-in, Theme Toggle, Cashier Profile */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Live sync badge */}
            <Chip
              variant="soft"
              size="sm"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                fontWeight: 600
              }}
            >
              ● Live Sync
            </Chip>

            {/* Clock */}
            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ color: 'text.secondary' }}>
              <Clock size={16} />
              <Typography level="body-sm" sx={{ color: 'text.primary', fontFamily: 'monospace', fontWeight: 600 }}>
                {currentTime}
              </Typography>
            </Stack>

            {/* Walk-in order button */}
            {onOpenWalkIn && (
              <Button
                size="sm"
                variant="solid"
                onClick={onOpenWalkIn}
                startDecorator={<PlusCircle size={16} />}
                sx={{
                  bgcolor: 'primary.solidBg',
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: '10px',
                  '&:hover': { bgcolor: 'primary.solidHoverBg' }
                }}
              >
                Counter Order
              </Button>
            )}

            {/* Manual refresh button */}
            {onRefreshOrders && (
              <IconButton
                size="sm"
                variant="outlined"
                onClick={onRefreshOrders}
                sx={{ borderColor: 'divider', color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'background.level1' } }}
              >
                <RefreshCw size={16} />
              </IconButton>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle size="sm" variant="outlined" />

            {/* Cashier / Admin profile & logout */}
            <Dropdown>
              <MenuButton
                variant="outlined"
                size="sm"
                sx={{
                  borderColor: 'divider',
                  color: 'text.primary',
                  borderRadius: '10px',
                  px: 1.5
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {user?.role === 'admin' ? (
                    <Shield size={16} color="#e05624" />
                  ) : (
                    <User size={16} color="#e05624" />
                  )}
                  <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600 }}>
                    {user?.full_name || (user?.role === 'admin' ? 'Admin' : 'Cashier')}
                  </Typography>
                  {user?.role === 'admin' && (
                    <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px' }}>
                      Admin
                    </Chip>
                  )}
                </Stack>
              </MenuButton>
              <Menu sx={{ bgcolor: 'background.surface', borderColor: 'divider', color: 'text.primary', zIndex: 1200 }}>
                {user?.role === 'admin' && (
                  <MenuItem onClick={() => navigate('/admin')} sx={{ color: 'primary.500', fontWeight: 600 }}>
                    <Shield size={16} /> Open Admin Portal
                  </MenuItem>
                )}
                <MenuItem onClick={() => setUpdateModalOpen(true)}>
                  <Download size={16} /> Check System Updates
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                  <LogOut size={16} /> Logout
                </MenuItem>
              </Menu>
            </Dropdown>
          </Stack>
        </Stack>
      </Sheet>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: 3, maxWidth: 1600, width: '100%', mx: 'auto' }}>{children}</Box>

      {/* Auto-updater Modal Popup */}
      <UpdateModal open={updateModalOpen} onClose={() => setUpdateModalOpen(false)} />
    </Box>
  );
};

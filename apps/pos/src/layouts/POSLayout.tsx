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
  Download,
  Beer
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
          px: { xs: 2, md: 3 },
          py: 1.25,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          {/* Brand & Terminal Identifier */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: 'primary.softBg',
                color: 'primary.500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Beer size={20} />
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography level="title-md" sx={{ color: 'text.primary', fontWeight: 800, lineHeight: 1.2 }}>
                {BAR_SETTINGS.NAME}
              </Typography>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.2 }}>
                <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px', fontWeight: 700, px: 0.8, py: 0.1 }}>
                  POS TERMINAL
                </Chip>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>
                  Front Counter
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {/* Center Navigation Tabs */}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{
              bgcolor: 'background.level1',
              p: 0.5,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
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
              startDecorator={<Receipt size={16} />}
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
                borderRadius: '9px',
                px: 1.8,
                '&:hover': {
                  bgcolor:
                    location.pathname === '/' ||
                    location.pathname === '/pos' ||
                    location.pathname === '/pos/orders' ||
                    location.pathname === '/orders'
                      ? 'primary.solidHoverBg'
                      : 'background.level2'
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
              startDecorator={<LayoutDashboard size={16} />}
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
                borderRadius: '9px',
                px: 1.8,
                '&:hover': {
                  bgcolor:
                    location.pathname === '/pos/dashboard' || location.pathname === '/dashboard'
                      ? 'primary.solidHoverBg'
                      : 'background.level2'
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
                startDecorator={<Shield size={15} />}
                sx={{
                  borderRadius: '9px',
                  fontWeight: 700,
                  px: 1.5,
                  borderColor: 'primary.300',
                  color: 'primary.500',
                  '&:hover': { bgcolor: 'primary.softBg' }
                }}
              >
                Admin
              </Button>
            )}
          </Stack>

          {/* Right Action Items: Live status, Clock, Walk-in, Theme Toggle, Profile */}
          <Stack direction="row" spacing={1.2} alignItems="center">
            {/* Live sync badge */}
            <Chip
              variant="soft"
              color="success"
              size="sm"
              sx={{
                display: { xs: 'none', lg: 'inline-flex' },
                fontWeight: 600,
                fontSize: '11px',
                borderRadius: '8px'
              }}
            >
              ● Live Sync
            </Chip>

            {/* Clock */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 0.6,
                px: 1.2,
                py: 0.5,
                bgcolor: 'background.level1',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary'
              }}
            >
              <Clock size={14} />
              <Typography level="body-xs" sx={{ color: 'text.primary', fontFamily: 'monospace', fontWeight: 600 }}>
                {currentTime}
              </Typography>
            </Box>

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
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 1.8,
                  boxShadow: 'sm',
                  '&:hover': { bgcolor: 'primary.solidHoverBg' }
                }}
              >
                + Counter Order
              </Button>
            )}

            {/* Manual refresh button */}
            {onRefreshOrders && (
              <IconButton
                size="sm"
                variant="outlined"
                onClick={onRefreshOrders}
                sx={{
                  borderRadius: '10px',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', bgcolor: 'background.level1' }
                }}
              >
                <RefreshCw size={15} />
              </IconButton>
            )}

            {/* Theme Toggle Button */}
            <ThemeToggle size="sm" variant="outlined" />

            {/* Cashier / Admin profile dropdown */}
            <Dropdown>
              <MenuButton
                variant="outlined"
                size="sm"
                sx={{
                  borderColor: 'divider',
                  color: 'text.primary',
                  borderRadius: '10px',
                  px: 1.2,
                  py: 0.6
                }}
              >
                <Stack direction="row" spacing={0.8} alignItems="center">
                  {user?.role === 'admin' ? (
                    <Shield size={15} color="var(--joy-palette-primary-500, #e05624)" />
                  ) : (
                    <User size={15} color="var(--joy-palette-primary-500, #e05624)" />
                  )}
                  <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600, display: { xs: 'none', sm: 'inline-block' } }}>
                    {user?.full_name || (user?.role === 'admin' ? 'Admin' : 'Cashier')}
                  </Typography>
                </Stack>
              </MenuButton>
              <Menu sx={{ bgcolor: 'background.surface', borderColor: 'divider', color: 'text.primary', zIndex: 1200, minWidth: 180 }}>
                <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography level="title-sm" sx={{ color: 'text.primary', fontWeight: 700 }}>
                    {user?.full_name || 'Staff User'}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'primary.500', fontWeight: 600 }}>
                    {user?.role?.toUpperCase() || 'CASHIER'}
                  </Typography>
                </Box>
                {user?.role === 'admin' && (
                  <MenuItem onClick={() => navigate('/admin')} sx={{ color: 'primary.500', fontWeight: 600 }}>
                    <Shield size={15} /> Open Admin Portal
                  </MenuItem>
                )}
                <MenuItem onClick={() => setUpdateModalOpen(true)}>
                  <Download size={15} /> Check System Updates
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: 'danger.500' }}>
                  <LogOut size={15} /> Logout
                </MenuItem>
              </Menu>
            </Dropdown>
          </Stack>
        </Stack>
      </Sheet>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, maxWidth: 1600, width: '100%', mx: 'auto' }}>{children}</Box>

      {/* Auto-updater Modal Popup */}
      <UpdateModal open={updateModalOpen} onClose={() => setUpdateModalOpen(false)} />
    </Box>
  );
};

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
  Clock,
  PlusCircle,
  Bell,
  RefreshCw,
  Sparkles,
  Download
} from 'lucide-react';
import { BAR_SETTINGS } from '../types';
import { getStoredUser, clearSession } from '../services/api';

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
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0b12', color: '#f4f4f5', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <Sheet
        variant="solid"
        sx={{
          bgcolor: '#11131f',
          borderBottom: '1px solid #202438',
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
              <Typography level="title-md" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '0.04em' }}>
                {BAR_SETTINGS.NAME}
              </Typography>
              <Typography level="body-xs" sx={{ color: '#ff7a45', fontWeight: 600 }}>
                POS CASHIER TERMINAL
              </Typography>
            </Box>

            {/* Nav Tabs */}
            <Stack direction="row" spacing={1} sx={{ ml: 4 }}>
              <Button
                size="sm"
                variant={location.pathname === '/' || location.pathname === '/orders' ? 'solid' : 'plain'}
                onClick={() => navigate('/orders')}
                startDecorator={<Receipt size={17} />}
                sx={{
                  bgcolor: location.pathname === '/' || location.pathname === '/orders' ? '#e05624' : 'transparent',
                  color: location.pathname === '/' || location.pathname === '/orders' ? '#fff' : '#a1a1aa',
                  fontWeight: 600,
                  borderRadius: '10px',
                  '&:hover': { bgcolor: location.pathname === '/' || location.pathname === '/orders' ? '#c8461b' : '#1c2032' }
                }}
              >
                Orders
              </Button>

              <Button
                size="sm"
                variant={location.pathname === '/dashboard' ? 'solid' : 'plain'}
                onClick={() => navigate('/dashboard')}
                startDecorator={<LayoutDashboard size={17} />}
                sx={{
                  bgcolor: location.pathname === '/dashboard' ? '#e05624' : 'transparent',
                  color: location.pathname === '/dashboard' ? '#fff' : '#a1a1aa',
                  fontWeight: 600,
                  borderRadius: '10px',
                  '&:hover': { bgcolor: location.pathname === '/dashboard' ? '#c8461b' : '#1c2032' }
                }}
              >
                Dashboard
              </Button>
            </Stack>
          </Stack>

          {/* Right Action Items: Live status, Clock, Walk-in, Cashier Profile */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Live sync badge */}
            <Chip
              variant="soft"
              size="sm"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                fontWeight: 600
              }}
            >
              ● Live Sync
            </Chip>

            {/* Clock */}
            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ color: '#a1a1aa' }}>
              <Clock size={16} />
              <Typography level="body-sm" sx={{ color: '#e4e4e7', fontFamily: 'monospace', fontWeight: 600 }}>
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
                  bgcolor: '#ff7a45',
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: '10px',
                  '&:hover': { bgcolor: '#e05624' }
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
                sx={{ borderColor: '#2e3450', color: '#a1a1aa', '&:hover': { color: '#fff', borderColor: '#4e5680' } }}
              >
                <RefreshCw size={16} />
              </IconButton>
            )}

            {/* Cashier profile & logout */}
            <Dropdown>
              <MenuButton
                variant="outlined"
                size="sm"
                sx={{
                  borderColor: '#2e3450',
                  color: '#f4f4f5',
                  borderRadius: '10px',
                  px: 1.5
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <User size={16} color="#ff7a45" />
                  <Typography level="body-sm" sx={{ color: '#fff', fontWeight: 600 }}>
                    {user?.full_name || 'Cashier'}
                  </Typography>
                </Stack>
              </MenuButton>
              <Menu sx={{ bgcolor: '#181b2b', borderColor: '#2e3450', color: '#f4f4f5' }}>
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
      <Modal open={updateModalOpen} onClose={() => setUpdateModalOpen(false)}>
        <ModalDialog
          variant="outlined"
          sx={{
            maxWidth: 480,
            width: '90%',
            bgcolor: '#131522',
            borderColor: updateReady ? '#ff7a45' : '#2e3450',
            color: '#fff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            p: 3
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: '12px',
                bgcolor: updateReady ? 'rgba(255, 122, 69, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: updateReady ? '#ff7a45' : '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {updateReady ? <Sparkles size={24} /> : <Download size={24} />}
            </Box>
            <Box>
              <Typography level="title-lg" sx={{ color: '#fff', fontWeight: 700 }}>
                {updateReady ? 'Software Update Ready' : 'Application Updates'}
              </Typography>
              <Typography level="body-xs" sx={{ color: '#8f95b2' }}>
                Current Version: v{currentVersion}
              </Typography>
            </Box>
          </Stack>

          <DialogContent>
            {updateReady ? (
              <Box sx={{ my: 1.5 }}>
                <Chip variant="soft" color="warning" size="md" sx={{ mb: 1.5, fontWeight: 700 }}>
                  NEW VERSION: v{newVersion || 'LATEST'}
                </Chip>
                <Typography level="body-sm" sx={{ color: '#d4d4d8', lineHeight: 1.6 }}>
                  A new version of <strong>BarPOS Terminal</strong> has been downloaded and is ready to install.
                  Would you like to restart the application now to apply the update, or continue working and update later?
                </Typography>
                <Alert
                  variant="soft"
                  color="warning"
                  sx={{ mt: 2, bgcolor: 'rgba(255, 122, 69, 0.1)', borderColor: 'rgba(255, 122, 69, 0.25)' }}
                >
                  <Typography level="body-xs" sx={{ color: '#f4f4f5' }}>
                    💡 Restarting takes just a few seconds. All database transactions and open tables remain safely preserved.
                  </Typography>
                </Alert>
              </Box>
            ) : (
              <Box sx={{ my: 1.5 }}>
                <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
                  {checkStatusMessage || `Your BarPOS Terminal is running version v${currentVersion}.`}
                </Typography>
                <Alert variant="soft" color="neutral" sx={{ mt: 2, bgcolor: '#191c2b', borderColor: '#2c314a' }}>
                  <Typography level="body-xs" sx={{ color: '#a1a1aa' }}>
                    Updates are automatically verified against official releases and safely installed.
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setUpdateModalOpen(false)}
              sx={{ borderColor: '#3a4163', color: '#a1a1aa', borderRadius: '12px', '&:hover': { bgcolor: '#1c2032', color: '#fff' } }}
            >
              {updateReady ? 'Update Later' : 'Close'}
            </Button>

            {updateReady ? (
              <Button
                variant="solid"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.electronAPI?.restartAppForUpdate) {
                    window.electronAPI.restartAppForUpdate();
                  } else {
                    alert('Restarting application to apply update...');
                  }
                }}
                startDecorator={<Sparkles size={16} />}
                sx={{
                  bgcolor: '#e05624',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '12px',
                  '&:hover': { bgcolor: '#c8461b' }
                }}
              >
                Update Now
              </Button>
            ) : (
              <Button
                variant="solid"
                loading={isChecking}
                onClick={async () => {
                  setIsChecking(true);
                  if (typeof window !== 'undefined' && window.electronAPI?.checkForUpdates) {
                    try {
                      const res = await window.electronAPI.checkForUpdates();
                      if (res.available) {
                        setCheckStatusMessage(`Found update v${res.version || ''}! Downloading in background...`);
                      } else {
                        setCheckStatusMessage(res.message || `BarPOS is up-to-date (v${currentVersion}).`);
                      }
                    } catch (e: any) {
                      setCheckStatusMessage(e.message || 'Unable to check for updates.');
                    }
                  } else {
                    setCheckStatusMessage('Running in browser development mode. Updates apply to packaged desktop app.');
                  }
                  setIsChecking(false);
                }}
                startDecorator={<RefreshCw size={16} />}
                sx={{ bgcolor: '#e05624', color: '#fff', fontWeight: 600, borderRadius: '12px', '&:hover': { bgcolor: '#c8461b' } }}
              >
                Check for Updates
              </Button>
            )}
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

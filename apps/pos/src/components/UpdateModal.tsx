import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalDialog,
  DialogContent,
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  Alert
} from '@mui/joy';
import { Download, Sparkles, RefreshCw } from 'lucide-react';

interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ open, onClose }) => {
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [updateReady, setUpdateReady] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getVersion().then((v: string) => setCurrentVersion(v)).catch(() => {});

      window.electronAPI.onUpdateAvailable((info: any) => {
        const ver = info?.version || 'Latest';
        setNewVersion(ver);
        setStatusMessage(`New version v${ver} detected. Downloading update in background...`);
      });

      window.electronAPI.onUpdateDownloaded((info: any) => {
        const ver = info?.version || 'Latest';
        setNewVersion(ver);
        setUpdateReady(true);
      });
    }
  }, []);

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    if (typeof window !== 'undefined' && window.electronAPI?.checkForUpdates) {
      try {
        const res = await window.electronAPI.checkForUpdates();
        if (res.available) {
          setStatusMessage(`Found update v${res.version || ''}! Downloading in background...`);
        } else {
          setStatusMessage(res.message || `BarPOS is up-to-date (v${currentVersion}).`);
        }
      } catch (e: any) {
        setStatusMessage(e.message || 'Unable to check for updates. Please verify internet connection.');
      }
    } else {
      setStatusMessage('Running in browser/development mode. Auto-updates apply to the packaged desktop application.');
    }
    setIsChecking(false);
  };

  const handleApplyUpdate = () => {
    if (typeof window !== 'undefined' && window.electronAPI?.restartAppForUpdate) {
      window.electronAPI.restartAppForUpdate();
    } else {
      alert('Restarting application to apply update...');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 480,
          width: '90%',
          bgcolor: 'background.surface',
          borderColor: updateReady ? 'primary.500' : 'divider',
          color: 'text.primary',
          borderRadius: '20px',
          boxShadow: 'lg',
          p: 3
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: '12px',
              bgcolor: updateReady ? 'primary.softBg' : 'background.level1',
              color: updateReady ? 'primary.500' : 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {updateReady ? <Sparkles size={24} /> : <Download size={24} />}
          </Box>
          <Box>
            <Typography level="title-lg" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {updateReady ? 'Software Update Ready' : 'Application Updates'}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
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
              <Typography level="body-sm" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                A new version of <strong>BarPOS Terminal</strong> has been downloaded and is ready to install.
                Would you like to restart now to apply the update?
              </Typography>
              <Alert
                variant="soft"
                color="warning"
                sx={{ mt: 2 }}
              >
                <Typography level="body-xs" sx={{ color: 'text.primary' }}>
                  💡 Restarting takes just a few seconds. Database transactions and orders remain safely preserved.
                </Typography>
              </Alert>
            </Box>
          ) : (
            <Box sx={{ my: 1.5 }}>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                {statusMessage || `Your BarPOS Terminal is running version v${currentVersion}.`}
              </Typography>
              <Alert variant="soft" color="neutral" sx={{ mt: 2 }}>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                  Updates are published and checked against official GitHub releases.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '12px' }}
          >
            {updateReady ? 'Update Later' : 'Close'}
          </Button>

          {updateReady ? (
            <Button
              variant="solid"
              onClick={handleApplyUpdate}
              startDecorator={<Sparkles size={16} />}
              sx={{
                bgcolor: 'primary.solidBg',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '12px',
                '&:hover': { bgcolor: 'primary.solidHoverBg' }
              }}
            >
              Update Now
            </Button>
          ) : (
            <Button
              variant="solid"
              loading={isChecking}
              onClick={handleCheckUpdates}
              startDecorator={<RefreshCw size={16} />}
              sx={{
                bgcolor: 'primary.solidBg',
                color: '#fff',
                fontWeight: 600,
                borderRadius: '12px',
                '&:hover': { bgcolor: 'primary.solidHoverBg' }
              }}
            >
              Check for Updates
            </Button>
          )}
        </Stack>
      </ModalDialog>
    </Modal>
  );
};

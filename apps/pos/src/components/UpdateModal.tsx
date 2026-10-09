import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalDialog,
  DialogContent,
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  Alert,
  IconButton,
  LinearProgress,
  Sheet
} from '@mui/joy';
import {
  Download,
  Sparkles,
  RefreshCw,
  Minus,
  X,
  Maximize2,
  CheckCircle2,
  ArrowUpCircle,
  HardDrive
} from 'lucide-react';

interface UpdateModalProps {
  open: boolean;
  onClose: () => void;
}

interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  total: number;
  transferred: number;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
  const mb = bytesPerSec / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
  const kb = bytesPerSec / 1024;
  return `${kb.toFixed(0)} KB/s`;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ open, onClose }) => {
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    bytesPerSecond: 0,
    percent: 0,
    total: 0,
    transferred: 0
  });
  const [updateReady, setUpdateReady] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.getVersion().then((v: string) => setCurrentVersion(v)).catch(() => {});

      // Event when update is available (from check)
      window.electronAPI.onUpdateAvailable((info: any) => {
        const ver = info?.version;
        if (ver) {
          setNewVersion(ver);
          setUpdateAvailable(true);
          setStatusMessage(`New release v${ver} is available! Click "Update New Release" to download.`);
        }
      });

      // Event for download progress
      if (window.electronAPI.onDownloadProgress) {
        window.electronAPI.onDownloadProgress((prog: DownloadProgress) => {
          setIsDownloading(true);
          setDownloadProgress({
            bytesPerSecond: prog.bytesPerSecond || 0,
            percent: Math.min(100, Math.max(0, prog.percent || 0)),
            total: prog.total || 0,
            transferred: prog.transferred || 0
          });
        });
      }

      // Event when download finishes
      window.electronAPI.onUpdateDownloaded((info: any) => {
        const ver = info?.version || newVersion || 'Latest';
        setNewVersion(ver);
        setIsDownloading(false);
        setUpdateReady(true);
        setDownloadProgress((prev) => ({ ...prev, percent: 100 }));
        setStatusMessage(`Update v${ver} downloaded and ready to install.`);
      });
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [newVersion]);

  // Check for updates
  const handleCheckUpdates = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    setUpdateAvailable(false);
    setUpdateReady(false);
    setIsDownloading(false);

    if (typeof window !== 'undefined' && window.electronAPI?.checkForUpdates) {
      try {
        const res = await window.electronAPI.checkForUpdates();
        if (res.available) {
          setUpdateAvailable(true);
          setNewVersion(res.version || '1.0.1');
          setStatusMessage(`New release v${res.version} is available! Click "Update New Release" to download.`);
        } else {
          setUpdateAvailable(false);
          setStatusMessage(res.message || `BarPOS is up-to-date (v${currentVersion}). No new releases found.`);
        }
      } catch (e: any) {
        setStatusMessage(e.message || 'Unable to check for updates. Please verify your connection.');
      }
    } else {
      // Browser / dev mode demo simulation
      setTimeout(() => {
        setUpdateAvailable(true);
        setNewVersion('1.0.1');
        setStatusMessage('Found update v1.0.1! Click "Update New Release" to download and test the progress bar.');
      }, 500);
    }
    setIsChecking(false);
  };

  // Start downloading the update
  const handleStartDownload = async () => {
    setIsDownloading(true);
    setStatusMessage(`Downloading update v${newVersion || ''}...`);
    setDownloadProgress({
      bytesPerSecond: 0,
      percent: 0,
      total: 0,
      transferred: 0
    });

    if (typeof window !== 'undefined' && window.electronAPI?.startDownloadUpdate) {
      try {
        const res = await window.electronAPI.startDownloadUpdate();
        if (!res.success) {
          setIsDownloading(false);
          setStatusMessage(res.error || 'Failed to start downloading update.');
        }
      } catch (err: any) {
        setIsDownloading(false);
        setStatusMessage(err.message || 'Download error occurred.');
      }
    } else {
      // Browser / Dev mode simulation: smoothly simulate progress 0% -> 100%
      const totalBytes = 38 * 1024 * 1024; // 38 MB
      let currentBytes = 0;
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);

      simIntervalRef.current = setInterval(() => {
        currentBytes += 1.8 * 1024 * 1024;
        if (currentBytes >= totalBytes) {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          setDownloadProgress({
            bytesPerSecond: 0,
            percent: 100,
            total: totalBytes,
            transferred: totalBytes
          });
          setIsDownloading(false);
          setUpdateReady(true);
          setStatusMessage(`Update v${newVersion || '1.0.1'} downloaded and ready to install.`);
        } else {
          const pct = Math.round((currentBytes / totalBytes) * 100);
          setDownloadProgress({
            bytesPerSecond: 2.2 * 1024 * 1024,
            percent: pct,
            total: totalBytes,
            transferred: currentBytes
          });
        }
      }, 250);
    }
  };

  // Restart & apply update
  const handleApplyUpdate = () => {
    if (typeof window !== 'undefined' && window.electronAPI?.restartAppForUpdate) {
      window.electronAPI.restartAppForUpdate();
    } else {
      alert('Restarting application to apply update...');
      setUpdateReady(false);
      onClose();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleFullClose = () => {
    setIsMinimized(false);
    onClose();
  };

  const roundedPercent = Math.round(downloadProgress.percent);

  // If user closed dialog while not minimized, don't show floating widget unless an active download/ready state is running
  const showFloatingWidget = isMinimized && (isDownloading || updateReady || updateAvailable);
  const showModalDialog = open && !isMinimized;

  return (
    <>
      {/* 1. Minimized Non-Intrusive Floating Widget at Bottom-Right */}
      {showFloatingWidget && (
        <Sheet
          variant="outlined"
          onClick={handleRestore}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1400,
            p: 1.8,
            borderRadius: '16px',
            bgcolor: 'background.surface',
            borderColor: updateReady ? 'success.500' : isDownloading ? 'primary.500' : 'divider',
            boxShadow: 'xl',
            cursor: 'pointer',
            maxWidth: 320,
            minWidth: 260,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '2xl'
            }
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: updateReady ? 'success.softBg' : 'primary.softBg',
                    color: updateReady ? 'success.500' : 'primary.500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {updateReady ? <Sparkles size={16} /> : <Download size={16} />}
                </Box>
                <Typography level="title-sm" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {updateReady
                    ? `Update Ready (v${newVersion})`
                    : isDownloading
                    ? `Downloading v${newVersion}`
                    : `Update v${newVersion}`}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore();
                  }}
                  sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                  title="Expand to Full Dialog"
                >
                  <Maximize2 size={15} />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFullClose();
                  }}
                  sx={{ p: 0.5, color: 'text.tertiary', '&:hover': { color: 'danger.500' } }}
                  title="Close"
                >
                  <X size={15} />
                </IconButton>
              </Stack>
            </Stack>

            {isDownloading && (
              <Box>
                <LinearProgress
                  determinate
                  value={downloadProgress.percent}
                  color="primary"
                  sx={{ height: 6, borderRadius: '4px', my: 0.5 }}
                />
                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '11px', color: 'text.tertiary' }}>
                  <span>{roundedPercent}%</span>
                  <span>{formatSpeed(downloadProgress.bytesPerSecond)}</span>
                </Stack>
              </Box>
            )}

            {updateReady && (
              <Button
                size="sm"
                variant="solid"
                color="success"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyUpdate();
                }}
                startDecorator={<Sparkles size={14} />}
                sx={{ borderRadius: '8px', fontWeight: 700, py: 0.4 }}
              >
                Restart Now
              </Button>
            )}

            {!isDownloading && !updateReady && (
              <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                Tap to view update details
              </Typography>
            )}
          </Stack>
        </Sheet>
      )}

      {/* 2. Full Modal Dialog */}
      <Modal open={showModalDialog} onClose={handleFullClose}>
        <ModalDialog
          variant="outlined"
          sx={{
            maxWidth: 500,
            width: '92vw',
            bgcolor: 'background.surface',
            borderColor: updateReady ? 'success.500' : updateAvailable ? 'primary.500' : 'divider',
            color: 'text.primary',
            borderRadius: '24px',
            boxShadow: 'xl',
            p: 3
          }}
        >
          {/* Header Row with Title, Current Version, Minimize Button & Close Button */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: '12px',
                  bgcolor: updateReady ? 'success.softBg' : updateAvailable ? 'primary.softBg' : 'background.level1',
                  color: updateReady ? 'success.500' : updateAvailable ? 'primary.500' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {updateReady ? <Sparkles size={24} /> : updateAvailable ? <ArrowUpCircle size={24} /> : <Download size={24} />}
              </Box>
              <Box>
                <Typography level="title-lg" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {updateReady
                    ? 'Update Ready to Install'
                    : isDownloading
                    ? 'Downloading Update'
                    : updateAvailable
                    ? 'New Release Available'
                    : 'Application Updates'}
                </Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontFamily: 'monospace' }}>
                  Current Version: v{currentVersion}
                </Typography>
              </Box>
            </Stack>

            {/* Window Controls: Minimize (-) and Close (X) */}
            <Stack direction="row" spacing={0.8} alignItems="center">
              <IconButton
                size="sm"
                variant="outlined"
                onClick={handleMinimize}
                title="Minimize (keep active in corner without distraction)"
                sx={{
                  borderColor: 'divider',
                  borderRadius: '8px',
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'background.level1', color: 'text.primary' }
                }}
              >
                <Minus size={16} />
              </IconButton>
              <IconButton
                size="sm"
                variant="plain"
                onClick={handleFullClose}
                title="Close"
                sx={{ color: 'text.tertiary', '&:hover': { bgcolor: 'background.level1', color: 'danger.500' } }}
              >
                <X size={18} />
              </IconButton>
            </Stack>
          </Stack>

          <DialogContent>
            {/* STATE 1: Update Ready (Downloaded) */}
            {updateReady ? (
              <Box sx={{ my: 1 }}>
                <Chip variant="soft" color="success" size="md" sx={{ mb: 1.5, fontWeight: 800, borderRadius: '8px' }}>
                  VERSION READY: v{newVersion || 'LATEST'}
                </Chip>
                <Typography level="body-sm" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 1.5 }}>
                  The new release of <strong>BarPOS Terminal</strong> has been fully downloaded and verified.
                  Restart the application to finish installing.
                </Typography>

                <Alert
                  variant="soft"
                  color="success"
                  startDecorator={<CheckCircle2 size={18} />}
                  sx={{ borderRadius: '12px' }}
                >
                  <Typography level="body-xs" sx={{ color: 'text.primary' }}>
                    Restarting takes ~3 seconds. Open tables, orders, and database transactions remain safely saved.
                  </Typography>
                </Alert>
              </Box>
            ) : isDownloading ? (
              /* STATE 2: Actively Downloading with Real-Time Progress Bar */
              <Box sx={{ my: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography level="title-sm" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Downloading v{newVersion}...
                  </Typography>
                  <Typography level="title-md" sx={{ fontWeight: 900, color: 'primary.500' }}>
                    {roundedPercent}%
                  </Typography>
                </Stack>

                {/* Joy UI High-Contrast Progress Bar */}
                <LinearProgress
                  determinate
                  value={downloadProgress.percent}
                  color="primary"
                  sx={{
                    height: 12,
                    borderRadius: '8px',
                    bgcolor: 'background.level2',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                  }}
                />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    {downloadProgress.total > 0
                      ? `${formatBytes(downloadProgress.transferred)} of ${formatBytes(downloadProgress.total)}`
                      : 'Connecting to release stream...'}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {downloadProgress.bytesPerSecond > 0 ? formatSpeed(downloadProgress.bytesPerSecond) : ''}
                  </Typography>
                </Stack>

                <Alert variant="soft" color="neutral" sx={{ mt: 2, borderRadius: '12px' }}>
                  <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                    💡 You can click the <strong>Minimize (-)</strong> button at top right to continue cashier transactions while the download finishes in the background.
                  </Typography>
                </Alert>
              </Box>
            ) : updateAvailable ? (
              /* STATE 3: Update Detected (Ready to Download) */
              <Box sx={{ my: 1 }}>
                <Chip variant="soft" color="primary" size="md" sx={{ mb: 1.5, fontWeight: 800, borderRadius: '8px' }}>
                  NEW RELEASE DETECTED: v{newVersion}
                </Chip>
                <Typography level="body-sm" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 1.5 }}>
                  A new official release (<strong>v{newVersion}</strong>) is available on GitHub.
                  Click <strong>"Update New Release"</strong> below to begin downloading with real-time progress.
                </Typography>
                <Alert variant="soft" color="primary" sx={{ borderRadius: '12px' }}>
                  <Typography level="body-xs" sx={{ color: 'text.primary' }}>
                    Downloads are not started in the background without your confirmation.
                  </Typography>
                </Alert>
              </Box>
            ) : (
              /* STATE 4: Idle / Up-to-Date */
              <Box sx={{ my: 1 }}>
                <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  {statusMessage || `Your BarPOS Terminal is running the current version (v${currentVersion}).`}
                </Typography>
                <Alert variant="soft" color="neutral" sx={{ borderRadius: '12px' }}>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    Official releases and updates are verified against GitHub releases repository.
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>

          {/* Modal Action Buttons */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            {/* Secondary Action */}
            <Button
              variant="outlined"
              onClick={isDownloading ? handleMinimize : handleFullClose}
              sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '12px', px: 2 }}
            >
              {isDownloading ? 'Minimize' : updateReady ? 'Later' : 'Close'}
            </Button>

            {/* Primary Action Button */}
            {updateReady ? (
              <Button
                variant="solid"
                onClick={handleApplyUpdate}
                startDecorator={<Sparkles size={16} />}
                sx={{
                  bgcolor: 'success.solidBg',
                  color: '#fff',
                  fontWeight: 800,
                  borderRadius: '12px',
                  px: 2.5,
                  '&:hover': { bgcolor: 'success.solidHoverBg' }
                }}
              >
                Restart & Install Now
              </Button>
            ) : isDownloading ? (
              <Button
                variant="solid"
                disabled
                sx={{
                  bgcolor: 'primary.solidBg',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '12px',
                  opacity: 0.85
                }}
              >
                Downloading {roundedPercent}%...
              </Button>
            ) : updateAvailable ? (
              /* The requested "Update New Release" button */
              <Button
                variant="solid"
                onClick={handleStartDownload}
                startDecorator={<Download size={16} />}
                sx={{
                  bgcolor: 'primary.solidBg',
                  color: '#fff',
                  fontWeight: 800,
                  borderRadius: '12px',
                  px: 2.5,
                  boxShadow: 'sm',
                  '&:hover': { bgcolor: 'primary.solidHoverBg' }
                }}
              >
                Update New Release
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
                  fontWeight: 700,
                  borderRadius: '12px',
                  px: 2.5,
                  '&:hover': { bgcolor: 'primary.solidHoverBg' }
                }}
              >
                Check for Updates
              </Button>
            )}
          </Stack>
        </ModalDialog>
      </Modal>
    </>
  );
};

export default UpdateModal;

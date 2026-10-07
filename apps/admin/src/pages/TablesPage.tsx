import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Input,
  IconButton,
  Chip,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  FormControl,
  FormLabel,
  Stack,
  Divider,
  Alert,
  Sheet
} from '@mui/joy';
import { Plus, QrCode, Printer, Download, ExternalLink, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarTable, BAR_SETTINGS } from '../types';
import { fetchTables, createTable, updateTable } from '../services/api';

export const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<BarTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Table Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newNumber, setNewNumber] = useState<string>('');
  const [newLabel, setNewLabel] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);

  // QR Modal
  const [qrModalTable, setQrModalTable] = useState<BarTable | null>(null);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await fetchTables(true);
      setTables(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;

    try {
      setAddError(null);
      await createTable(newNumber.trim(), newLabel.trim() || undefined);
      setIsAddOpen(false);
      setNewNumber('');
      setNewLabel('');
      loadTables();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create table identifier.');
    }
  };

  const getTableUrl = (tableNumber: string) => {
    // URL matching Section 2: /order/table/:tableNumber
    // Typically deployed host or window.location.origin
    const origin = window.location.origin.replace(':3003', ':3001');
    return `${origin}/order/table/${encodeURIComponent(tableNumber)}`;
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleDownloadSVG = () => {
    if (!qrModalTable) return;
    const svgElement = document.getElementById('table-qr-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR-${qrModalTable.label.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography level="h2" sx={{ color: '#fff', fontWeight: 800 }}>
            Table QR Code Identifiers
          </Typography>
          <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
            QR codes assigned to tables for mobile menu browsing and ordering
          </Typography>
        </Box>
        <Button
          size="md"
          variant="solid"
          onClick={() => setIsAddOpen(true)}
          startDecorator={<Plus size={18} />}
          sx={{ bgcolor: '#e05624', color: '#fff', borderRadius: '12px', '&:hover': { bgcolor: '#c8461b' } }}
        >
          Add Table Identifier
        </Button>
      </Stack>

      <Alert variant="soft" sx={{ mb: 3, bgcolor: '#161928', borderColor: '#2e3450' }}>
        <Typography level="body-sm" sx={{ color: '#8f95b2' }}>
          📌 <strong>Architecture Note:</strong> Tables in this system are strictly identifiers for incoming customer
          orders through the table QR code. Table occupancy, reservations, and floor plans are intentionally
          out-of-scope.
        </Typography>
      </Alert>

      {/* Tables Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 2.5
        }}
      >
        {tables.map((t) => {
          const qrUrl = getTableUrl(t.table_number);
          return (
            <Card
              key={t.id}
              variant="outlined"
              sx={{
                bgcolor: '#12141f',
                borderColor: '#22263a',
                borderRadius: '16px',
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#ff7a45' }
              }}
            >
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography level="title-md" sx={{ color: '#fff', fontWeight: 700 }}>
                    {t.label}
                  </Typography>
                  <Chip size="sm" variant="soft" color={t.is_active ? 'success' : 'neutral'}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </Chip>
                </Stack>

                <Typography level="body-xs" sx={{ color: '#71717a', mb: 2 }}>
                  Identifier: <code>{t.table_number}</code>
                </Typography>

                {/* QR Preview Thumbnail */}
                <Box
                  sx={{
                    bgcolor: '#ffffff',
                    p: 1.5,
                    borderRadius: '12px',
                    width: 'fit-content',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  <QRCodeSVG value={qrUrl} size={110} level="M" />
                </Box>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  size="sm"
                  variant="solid"
                  fullWidth
                  onClick={() => setQrModalTable(t)}
                  startDecorator={<QrCode size={16} />}
                  sx={{ bgcolor: '#e05624', color: '#fff', '&:hover': { bgcolor: '#c8461b' } }}
                >
                  Print / View Stand
                </Button>
                <IconButton
                  size="sm"
                  variant="outlined"
                  component="a"
                  href={qrUrl}
                  target="_blank"
                  sx={{ borderColor: '#2e3450', color: '#a1a1aa' }}
                >
                  <ExternalLink size={16} />
                </IconButton>
              </Stack>
            </Card>
          );
        })}
      </Box>

      {/* Add Table Modal */}
      <Modal open={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <ModalDialog
          variant="outlined"
          sx={{ maxWidth: 420, width: '92vw', bgcolor: '#131522', borderColor: '#2e3450', color: '#fff' }}
        >
          <DialogTitle>Add Table / QR Identifier</DialogTitle>
          <Divider sx={{ my: 1.5, borderColor: '#262a40' }} />
          <DialogContent>
            {addError && (
              <Alert color="danger" sx={{ mb: 2 }}>
                {addError}
              </Alert>
            )}
            <form onSubmit={handleAddTable}>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel sx={{ color: '#a1a1aa' }}>Table Number / Identifier Code</FormLabel>
                  <Input
                    required
                    placeholder="e.g. 11, VIP-1, PATIO-2"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel sx={{ color: '#a1a1aa' }}>Display Label</FormLabel>
                  <Input
                    placeholder="e.g. Table 11, VIP Lounge 1"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
                  />
                </FormControl>
                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={() => setIsAddOpen(false)} sx={{ borderColor: '#333' }}>
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    type="submit"
                    sx={{ flex: 1, bgcolor: '#e05624', '&:hover': { bgcolor: '#c8461b' } }}
                  >
                    Create Table
                  </Button>
                </Stack>
              </Stack>
            </form>
          </DialogContent>
        </ModalDialog>
      </Modal>

      {/* Printable QR Code Stand Card Modal */}
      <Modal open={Boolean(qrModalTable)} onClose={() => setQrModalTable(null)}>
        <ModalDialog
          variant="outlined"
          sx={{ maxWidth: 500, width: '92vw', bgcolor: '#131522', borderColor: '#2e3450', color: '#fff' }}
        >
          <DialogTitle sx={{ color: '#fff' }}>Table QR Stand Card</DialogTitle>
          <Divider sx={{ my: 1.5, borderColor: '#262a40' }} />
          <DialogContent>
            {qrModalTable && (
              <Sheet
                id="printable-table-qr"
                variant="outlined"
                sx={{
                  p: 4,
                  bgcolor: '#ffffff',
                  color: '#000000',
                  borderRadius: '16px',
                  textAlign: 'center',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
                }}
              >
                <Typography level="title-lg" sx={{ color: '#000', fontWeight: 800, letterSpacing: '0.04em' }}>
                  {BAR_SETTINGS.NAME}
                </Typography>
                <Typography level="body-xs" sx={{ color: '#52525b', mb: 2 }}>
                  {BAR_SETTINGS.TAGLINE}
                </Typography>

                <Box
                  sx={{
                    bgcolor: '#000',
                    color: '#fff',
                    py: 1,
                    px: 3,
                    borderRadius: '8px',
                    display: 'inline-block',
                    mb: 2.5
                  }}
                >
                  <Typography level="h3" sx={{ color: '#fff', fontWeight: 800 }}>
                    {qrModalTable.label.toUpperCase()}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, display: 'inline-block' }}>
                  <QRCodeSVG
                    id="table-qr-svg"
                    value={getTableUrl(qrModalTable.table_number)}
                    size={180}
                    level="H"
                  />
                </Box>

                <Typography level="title-sm" sx={{ color: '#000', fontWeight: 700, mt: 2 }}>
                  SCAN TO VIEW MENU & ORDER
                </Typography>
                <Typography level="body-xs" sx={{ color: '#71717a', mt: 0.5 }}>
                  Point your mobile camera at this QR code to browse cocktails, beers, and bar food.
                </Typography>
                <Typography level="body-xs" sx={{ color: '#e05624', fontWeight: 600, mt: 1 }}>
                  Pay at the cashier counter upon order submission.
                </Typography>
              </Sheet>
            )}
          </DialogContent>

          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleDownloadSVG}
              startDecorator={<Download size={16} />}
              sx={{ borderColor: '#3a4163', color: '#d4d4d8' }}
            >
              Download SVG
            </Button>
            <Button
              variant="solid"
              onClick={handlePrintQR}
              startDecorator={<Printer size={16} />}
              sx={{ flex: 1, bgcolor: '#e05624', color: '#fff', '&:hover': { bgcolor: '#c8461b' } }}
            >
              Print Stand Card
            </Button>
            <Button variant="soft" onClick={() => setQrModalTable(null)} sx={{ bgcolor: '#24283b', color: '#fff' }}>
              Close
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

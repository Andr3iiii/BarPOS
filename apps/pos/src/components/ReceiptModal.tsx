import React from 'react';
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Divider,
  Button,
  Stack,
  Typography,
  Box,
  Sheet,
  IconButton
} from '@mui/joy';
import { Printer, CheckCircle, Copy, Check, X } from 'lucide-react';
import { BAR_SETTINGS } from '../types';

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receiptData: any;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ open, onClose, receiptData }) => {
  const [copied, setCopied] = React.useState(false);

  if (!receiptData) return null;

  const handlePrint = () => {
    if (window.electronAPI?.isElectron) {
      window.electronAPI.printReceipt();
    } else {
      window.print();
    }
  };

  const handleCopyText = () => {
    const text = `
================================
    ${receiptData.bar_name || BAR_SETTINGS.NAME}
    ${receiptData.tagline || BAR_SETTINGS.TAGLINE}
================================
Order #: ${receiptData.reference_no}
Table:   ${receiptData.table_label || receiptData.table_number}
Date:    ${receiptData.date} ${receiptData.time}
Cashier: ${receiptData.cashier_name || 'Front Counter'}
--------------------------------
${receiptData.items?.map((it: any) => `${it.name} x ${it.quantity}  ₱${Number(it.subtotal).toFixed(2)}`).join('\n')}
--------------------------------
TOTAL:          ₱${Number(receiptData.total || 0).toFixed(2)}
Payment:        ${receiptData.payment_method}
Amount Received: ₱${Number(receiptData.amount_received || 0).toFixed(2)}
Change:         ₱${Number(receiptData.change_amount || 0).toFixed(2)}
================================
${receiptData.footer_message || 'Thank you!'}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 460,
          width: '95vw',
          maxHeight: '92vh',
          bgcolor: 'background.surface',
          borderColor: 'divider',
          color: 'text.primary',
          borderRadius: '24px',
          p: 3,
          boxShadow: 'xl',
          overflowY: 'auto'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <CheckCircle size={22} color="var(--joy-palette-success-500, #10b981)" />
            <Typography level="title-lg" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Payment Settled
            </Typography>
          </Stack>
          <IconButton size="sm" variant="plain" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <X size={18} />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2, borderColor: 'divider' }} />

        <DialogContent sx={{ overflowY: 'auto', p: 0.5 }}>
          {/* Printable Thermal Receipt Paper (Crisp 80mm ESC/POS Styling) */}
          <Sheet
            id="printable-receipt"
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: '#ffffff',
              color: '#000000',
              borderColor: '#e5e7eb',
              borderRadius: '12px',
              fontFamily: '"JetBrains Mono", Courier, monospace',
              fontSize: '13px',
              lineHeight: 1.45,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography level="title-md" sx={{ color: '#000000', fontWeight: 900, letterSpacing: '0.05em' }}>
                {receiptData.bar_name || BAR_SETTINGS.NAME}
              </Typography>
              <Typography level="body-xs" sx={{ color: '#4b5563', mt: 0.2 }}>
                {receiptData.tagline || BAR_SETTINGS.TAGLINE}
              </Typography>
            </Box>

            <Divider sx={{ my: 1, borderColor: '#000000', borderStyle: 'dashed' }} />

            {/* Meta Details */}
            <Stack spacing={0.4} sx={{ my: 1, fontSize: '12px', color: '#111827' }}>
              <Stack direction="row" justifyContent="space-between">
                <span>Order Ref:</span>
                <strong>{receiptData.reference_no}</strong>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <span>Table:</span>
                <strong>{receiptData.table_label || `Table ${receiptData.table_number}`}</strong>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <span>Date:</span>
                <span>{receiptData.date}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <span>Time:</span>
                <span>{receiptData.time}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <span>Cashier:</span>
                <span>{receiptData.cashier_name || 'Front Counter'}</span>
              </Stack>
            </Stack>

            <Divider sx={{ my: 1, borderColor: '#000000', borderStyle: 'dashed' }} />

            {/* Items */}
            <Stack spacing={0.8} sx={{ my: 1.5, color: '#111827' }}>
              {receiptData.items?.map((item: any, idx: number) => (
                <Stack key={idx} direction="row" justifyContent="space-between">
                  <span style={{ maxWidth: '65%' }}>
                    {item.name} × {item.quantity}
                  </span>
                  <span>₱{Number(item.subtotal).toFixed(2)}</span>
                </Stack>
              ))}
            </Stack>

            <Divider sx={{ my: 1, borderColor: '#000000', borderStyle: 'dashed' }} />

            {/* Totals */}
            <Stack spacing={0.5} sx={{ my: 1.5, color: '#111827' }}>
              <Stack direction="row" justifyContent="space-between">
                <span>Subtotal:</span>
                <span>₱{Number(receiptData.subtotal || receiptData.total || 0).toFixed(2)}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '15px', fontWeight: 900 }}>
                <span>TOTAL:</span>
                <span>₱{Number(receiptData.total || 0).toFixed(2)}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <span>Payment Method:</span>
                <span style={{ fontWeight: 600 }}>{receiptData.payment_method}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <span>Amount Received:</span>
                <span>₱{Number(receiptData.amount_received || 0).toFixed(2)}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 800 }}>
                <span>Change:</span>
                <span>₱{Number(receiptData.change_amount || 0).toFixed(2)}</span>
              </Stack>
              {receiptData.payment_reference && (
                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '11px', color: '#4b5563' }}>
                  <span>Ref #:</span>
                  <span>{receiptData.payment_reference}</span>
                </Stack>
              )}
            </Stack>

            <Divider sx={{ my: 1, borderColor: '#000000', borderStyle: 'dashed' }} />

            {/* Receipt Footer */}
            <Box sx={{ textAlign: 'center', mt: 2, fontSize: '12px', color: '#374151' }}>
              <p style={{ margin: '4px 0', fontWeight: 600 }}>{receiptData.footer_message || 'Thank you for your visit!'}</p>
              <p style={{ margin: '2px 0', fontSize: '10px', color: '#6b7280' }}>*** OFFICIAL POS RECEIPT ***</p>
            </Box>
          </Sheet>
        </DialogContent>

        {/* Modal Action Buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <Button
            variant="outlined"
            onClick={handleCopyText}
            startDecorator={copied ? <Check size={16} /> : <Copy size={16} />}
            sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '10px' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="solid"
            onClick={handlePrint}
            startDecorator={<Printer size={18} />}
            sx={{
              flex: 1,
              bgcolor: 'primary.solidBg',
              color: '#fff',
              fontWeight: 800,
              borderRadius: '10px',
              '&:hover': { bgcolor: 'primary.solidHoverBg' }
            }}
          >
            Print Receipt
          </Button>
          <Button
            variant="soft"
            onClick={onClose}
            sx={{ borderRadius: '10px', bgcolor: 'background.level2', color: 'text.primary' }}
          >
            Done
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
};

export default ReceiptModal;

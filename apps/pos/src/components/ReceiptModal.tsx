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
  Sheet
} from '@mui/joy';
import { Printer, CheckCircle, Copy, Check } from 'lucide-react';
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
    window.print();
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
${receiptData.items?.map((it: any) => `${it.name} x ${it.quantity}  ₱${it.subtotal.toFixed(2)}`).join('\n')}
--------------------------------
TOTAL:          ₱${receiptData.total?.toFixed(2)}
Payment:        ${receiptData.payment_method}
Amount Received: ₱${receiptData.amount_received?.toFixed(2)}
Change:         ₱${receiptData.change_amount?.toFixed(2)}
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
          maxWidth: 440,
          width: '95vw',
          bgcolor: '#131522',
          borderColor: '#2e3450',
          color: '#f4f4f5',
          borderRadius: '20px',
          p: 3
        }}
      >
        <DialogTitle sx={{ color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle size={22} color="#10b981" />
          <span>Payment Successful — Receipt</span>
        </DialogTitle>
        <Divider sx={{ my: 1.5, borderColor: '#262a40' }} />

        <DialogContent sx={{ maxHeight: '68vh', overflowY: 'auto' }}>
          {/* Printable Receipt Paper Container */}
          <Sheet
            id="printable-receipt"
            variant="outlined"
            sx={{
              p: 3,
              bgcolor: '#ffffff',
              color: '#000000',
              borderColor: '#e5e7eb',
              borderRadius: '8px',
              fontFamily: '"JetBrains Mono", Courier, monospace',
              fontSize: '13px',
              lineHeight: 1.4,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography level="title-md" sx={{ color: '#000', fontWeight: 800, letterSpacing: '0.05em' }}>
                {receiptData.bar_name || BAR_SETTINGS.NAME}
              </Typography>
              <Typography level="body-xs" sx={{ color: '#4b5563' }}>
                {receiptData.tagline || BAR_SETTINGS.TAGLINE}
              </Typography>
            </Box>

            <Divider sx={{ my: 1, borderColor: '#000', borderStyle: 'dashed' }} />

            {/* Meta */}
            <Stack spacing={0.3} sx={{ my: 1, fontSize: '12px' }}>
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

            <Divider sx={{ my: 1, borderColor: '#000', borderStyle: 'dashed' }} />

            {/* Items */}
            <Stack spacing={0.8} sx={{ my: 1.5 }}>
              {receiptData.items?.map((item: any, idx: number) => (
                <Stack key={idx} direction="row" justifyContent="space-between">
                  <span style={{ maxWidth: '65%' }}>
                    {item.name} × {item.quantity}
                  </span>
                  <span>₱{Number(item.subtotal).toFixed(2)}</span>
                </Stack>
              ))}
            </Stack>

            <Divider sx={{ my: 1, borderColor: '#000', borderStyle: 'dashed' }} />

            {/* Totals */}
            <Stack spacing={0.4} sx={{ my: 1.5 }}>
              <Stack direction="row" justifyContent="space-between">
                <span>Subtotal:</span>
                <span>₱{Number(receiptData.subtotal).toFixed(2)}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '15px', fontWeight: 'bold' }}>
                <span>TOTAL:</span>
                <span>₱{Number(receiptData.total).toFixed(2)}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <span>Payment:</span>
                <span>{receiptData.payment_method}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <span>Received:</span>
                <span>₱{Number(receiptData.amount_received).toFixed(2)}</span>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 'bold' }}>
                <span>Change:</span>
                <span>₱{Number(receiptData.change_amount).toFixed(2)}</span>
              </Stack>
              {receiptData.payment_reference && (
                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '11px', color: '#4b5563' }}>
                  <span>Ref #:</span>
                  <span>{receiptData.payment_reference}</span>
                </Stack>
              )}
            </Stack>

            <Divider sx={{ my: 1, borderColor: '#000', borderStyle: 'dashed' }} />

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 2, fontSize: '12px' }}>
              <p style={{ margin: '4px 0' }}>{receiptData.footer_message || 'Thank you!'}</p>
              <p style={{ margin: '2px 0', fontSize: '10px', color: '#6b7280' }}>*** CUSTOMER RECEIPT ***</p>
            </Box>
          </Sheet>
        </DialogContent>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCopyText}
            startDecorator={copied ? <Check size={16} /> : <Copy size={16} />}
            sx={{ borderColor: '#3a4163', color: '#d4d4d8' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="solid"
            onClick={handlePrint}
            startDecorator={<Printer size={18} />}
            sx={{ bgcolor: '#e05624', color: '#fff', flex: 1, '&:hover': { bgcolor: '#c8461b' } }}
          >
            Print Receipt
          </Button>
          <Button variant="soft" onClick={onClose} sx={{ bgcolor: '#24283b', color: '#f4f4f5' }}>
            Done
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
};

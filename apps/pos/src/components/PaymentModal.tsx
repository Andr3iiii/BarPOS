import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalDialog,
  Divider,
  Button,
  Stack,
  Typography,
  Box,
  Input,
  Chip,
  Alert,
  Sheet,
  IconButton
} from '@mui/joy';
import { CreditCard, Banknote, QrCode, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Order, PaymentMethod, BAR_SETTINGS } from '../types';
import { processOrderPayment } from '../services/api';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onPaymentSuccess: (receiptData: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  order,
  onPaymentSuccess
}) => {
  if (!order) return null;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const orderTotal = Number(order.total || 0);

  // Set default received amount when order opens
  useEffect(() => {
    if (order) {
      setAmountReceived(String(orderTotal));
      setPaymentMethod('CASH');
      setPaymentRef('');
      setErrorMsg(null);
    }
  }, [order, orderTotal]);

  const numReceived = parseFloat(amountReceived) || 0;
  const change = paymentMethod === 'CASH' ? Math.max(0, numReceived - orderTotal) : 0;
  const isInsufficient = paymentMethod === 'CASH' && numReceived < orderTotal;

  const setQuickAmount = (val: number) => {
    setAmountReceived(String(val));
  };

  const handleProcessPayment = async () => {
    try {
      setErrorMsg(null);

      if (paymentMethod === 'CASH') {
        if (numReceived <= 0) {
          setErrorMsg('Please enter the cash amount received from customer.');
          return;
        }
        if (isInsufficient) {
          setErrorMsg(
            `Insufficient cash. Order total is ₱${orderTotal.toFixed(2)}, but received ₱${numReceived.toFixed(2)}.`
          );
          return;
        }
      }

      setIsSubmitting(true);

      const result = await processOrderPayment({
        order_id: order.id,
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'CASH' ? numReceived : orderTotal,
        payment_reference: paymentRef.trim() || undefined
      });

      onPaymentSuccess(result.receipt);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: 620,
          width: '95vw',
          maxHeight: '90vh',
          bgcolor: 'background.surface',
          borderColor: 'divider',
          color: 'text.primary',
          borderRadius: '24px',
          p: 3,
          boxShadow: 'xl',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: 'primary.softBg',
                color: 'primary.500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Banknote size={22} />
            </Box>
            <Box>
              <Typography level="title-lg" sx={{ color: 'text.primary', fontWeight: 800 }}>
                Process Payment
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontFamily: 'monospace' }}>
                Ref: {order.reference_no}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip variant="soft" color="primary" size="md" sx={{ fontWeight: 700, borderRadius: '8px' }}>
              {order.table_label || `Table ${order.table_number}`}
            </Chip>
            <IconButton
              size="sm"
              variant="plain"
              onClick={onClose}
              sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'background.level1' } }}
            >
              <X size={18} />
            </IconButton>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2.5, borderColor: 'divider' }} />

        {errorMsg && (
          <Alert color="danger" startDecorator={<AlertCircle size={18} />} sx={{ mb: 2.5 }}>
            {errorMsg}
          </Alert>
        )}

        {/* Order Items & Total Summary Box */}
        <Sheet
          variant="plain"
          sx={{
            p: 2,
            borderRadius: '14px',
            bgcolor: 'background.level1',
            border: '1px solid',
            borderColor: 'divider',
            mb: 2.5
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
              Order Breakdown ({order.items?.length || 0} items)
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              Unit & Subtotal
            </Typography>
          </Stack>

          <Stack spacing={0.8} sx={{ maxHeight: 120, overflowY: 'auto', pr: 0.5, mb: 1.5 }}>
            {order.items?.map((item, idx) => (
              <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                <Typography level="body-sm" sx={{ color: 'text.primary' }}>
                  {item.product_name} <span style={{ opacity: 0.65 }}>× {item.quantity}</span>
                </Typography>
                <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  ₱{Number(item.subtotal).toFixed(2)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {order.customer_notes && (
            <Box sx={{ mb: 1.5, p: 1, bgcolor: 'warning.softBg', borderRadius: '8px' }}>
              <Typography level="body-xs" sx={{ color: 'warning.700', fontWeight: 500 }}>
                Notes: {order.customer_notes}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1, borderColor: 'divider' }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography level="title-md" sx={{ color: 'text.primary', fontWeight: 800 }}>
              AMOUNT DUE
            </Typography>
            <Typography level="h2" sx={{ color: 'primary.500', fontWeight: 900 }}>
              ₱{orderTotal.toFixed(2)}
            </Typography>
          </Stack>
        </Sheet>

        {/* Payment Method Selector */}
        <Box sx={{ mb: 2.5 }}>
          <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>
            Select Payment Method
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant={paymentMethod === 'CASH' ? 'solid' : 'outlined'}
              onClick={() => setPaymentMethod('CASH')}
              startDecorator={<Banknote size={18} />}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: '12px',
                bgcolor: paymentMethod === 'CASH' ? 'primary.solidBg' : 'background.level1',
                borderColor: paymentMethod === 'CASH' ? 'primary.solidBg' : 'divider',
                color: paymentMethod === 'CASH' ? '#fff' : 'text.secondary',
                fontWeight: 700,
                '&:hover': { bgcolor: paymentMethod === 'CASH' ? 'primary.solidHoverBg' : 'background.level2' }
              }}
            >
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'GCASH' ? 'solid' : 'outlined'}
              onClick={() => setPaymentMethod('GCASH')}
              startDecorator={<QrCode size={18} />}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: '12px',
                bgcolor: paymentMethod === 'GCASH' ? '#007dfe' : 'background.level1',
                borderColor: paymentMethod === 'GCASH' ? '#007dfe' : 'divider',
                color: paymentMethod === 'GCASH' ? '#fff' : 'text.secondary',
                fontWeight: 700,
                '&:hover': { bgcolor: paymentMethod === 'GCASH' ? '#006cdb' : 'background.level2' }
              }}
            >
              GCash
            </Button>
            <Button
              variant={paymentMethod === 'CARD' ? 'solid' : 'outlined'}
              onClick={() => setPaymentMethod('CARD')}
              startDecorator={<CreditCard size={18} />}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: '12px',
                bgcolor: paymentMethod === 'CARD' ? '#7c3aed' : 'background.level1',
                borderColor: paymentMethod === 'CARD' ? '#7c3aed' : 'divider',
                color: paymentMethod === 'CARD' ? '#fff' : 'text.secondary',
                fontWeight: 700,
                '&:hover': { bgcolor: paymentMethod === 'CARD' ? '#6d28d9' : 'background.level2' }
              }}
            >
              Card / POS
            </Button>
          </Stack>
        </Box>

        {/* Payment Detail Section */}
        {paymentMethod === 'CASH' ? (
          <Box sx={{ mb: 2.5 }}>
            <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>
              Cash Received (₱)
            </Typography>
            <Input
              size="lg"
              type="number"
              placeholder="0.00"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              autoFocus
              sx={{
                fontSize: '1.4rem',
                fontWeight: 800,
                bgcolor: 'background.level1',
                borderColor: isInsufficient ? 'danger.500' : 'divider',
                color: 'text.primary',
                borderRadius: '12px',
                mb: 1.5,
                '&:focus-within': { borderColor: 'primary.500' }
              }}
            />

            {/* Quick Preset Bill Chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              <Button
                size="sm"
                variant="outlined"
                onClick={() => setQuickAmount(orderTotal)}
                sx={{
                  borderRadius: '8px',
                  borderColor: 'divider',
                  color: 'primary.500',
                  fontWeight: 700
                }}
              >
                Exact (₱{orderTotal.toFixed(2)})
              </Button>
              {[100, 200, 500, 1000, 2000].map((amt) => {
                if (amt >= orderTotal || (orderTotal > 1000 && amt === 2000)) {
                  return (
                    <Button
                      key={amt}
                      size="sm"
                      variant="soft"
                      onClick={() => setQuickAmount(amt)}
                      sx={{
                        borderRadius: '8px',
                        bgcolor: 'background.level2',
                        color: 'text.primary',
                        fontWeight: 600
                      }}
                    >
                      ₱{amt}
                    </Button>
                  );
                }
                return null;
              })}
            </Stack>

            {/* Live Change Due / Short Banner */}
            <Sheet
              variant="soft"
              color={isInsufficient ? 'danger' : 'success'}
              sx={{
                p: 2,
                borderRadius: '14px',
                border: '1px solid',
                borderColor: isInsufficient ? 'danger.300' : 'success.300'
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography level="title-md" sx={{ fontWeight: 700 }}>
                    {isInsufficient ? 'Short by' : 'Change Due'}
                  </Typography>
                  <Typography level="body-xs" sx={{ mt: 0.2 }}>
                    {isInsufficient ? 'Customer provided less than bill' : 'Return exact change to customer'}
                  </Typography>
                </Box>
                <Typography level="h2" sx={{ fontWeight: 900 }}>
                  ₱{Math.abs(numReceived - orderTotal).toFixed(2)}
                </Typography>
              </Stack>
            </Sheet>
          </Box>
        ) : (
          /* GCash / Card Section */
          <Box sx={{ mb: 2.5 }}>
            <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>
              {paymentMethod === 'GCASH' ? 'GCash Reference No.' : 'Card Auth / Approval Code'} (Optional)
            </Typography>
            <Input
              size="lg"
              placeholder={paymentMethod === 'GCASH' ? 'e.g. 100293847291' : 'e.g. 482910'}
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              sx={{
                bgcolor: 'background.level1',
                borderColor: 'divider',
                color: 'text.primary',
                borderRadius: '12px',
                mb: 1.5,
                '&:focus-within': { borderColor: 'primary.500' }
              }}
            />
            <Sheet
              variant="soft"
              color="success"
              sx={{
                p: 2,
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'success.300'
              }}
            >
              <Typography level="body-sm" sx={{ color: 'success.700', fontWeight: 600 }}>
                Exact cashless charge: <strong>₱{orderTotal.toFixed(2)}</strong>. Change is ₱0.00.
              </Typography>
            </Sheet>
          </Box>
        )}

        {/* Modal Action Footer */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ borderColor: 'divider', color: 'text.secondary', borderRadius: '12px', px: 2.5 }}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            loading={isSubmitting}
            disabled={isInsufficient}
            onClick={handleProcessPayment}
            startDecorator={<CheckCircle2 size={18} />}
            sx={{
              flex: 1,
              bgcolor: 'primary.solidBg',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 800,
              py: 1.3,
              borderRadius: '12px',
              '&:hover': { bgcolor: 'primary.solidHoverBg' }
            }}
          >
            Confirm & Complete Settlement
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
};

export default PaymentModal;

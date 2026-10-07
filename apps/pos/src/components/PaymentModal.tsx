import React, { useState, useEffect } from 'react';
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
  Input,
  RadioGroup,
  Radio,
  Chip,
  Alert,
  Sheet
} from '@mui/joy';
import { CreditCard, Banknote, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order, PaymentMethod, BAR_SETTINGS } from '@barpos/shared';
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

  // Set default received amount when order changes
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

  // Preset quick cash buttons
  const setQuickAmount = (val: number) => {
    setAmountReceived(String(val));
  };

  const handleProcessPayment = async () => {
    try {
      setErrorMsg(null);

      if (paymentMethod === 'CASH') {
        if (numReceived <= 0) {
          setErrorMsg('Please enter the cash amount received from the customer.');
          return;
        }
        if (isInsufficient) {
          setErrorMsg(
            `Insufficient cash received. Order total is ₱${orderTotal.toFixed(2)}, but received ₱${numReceived.toFixed(2)}.`
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
          bgcolor: '#131522',
          borderColor: '#2e3450',
          color: '#f4f4f5',
          borderRadius: '20px',
          p: 3
        }}
      >
        <DialogTitle sx={{ color: '#f4f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Banknote size={24} color="#ff7a45" />
            <Typography level="title-lg" sx={{ color: '#fff', fontWeight: 700 }}>
              Process Payment — {order.reference_no}
            </Typography>
          </Stack>
          <Chip variant="soft" size="md" sx={{ bgcolor: 'rgba(224, 86, 36, 0.2)', color: '#ff7a45', fontWeight: 700 }}>
            {order.table_label || `Table ${order.table_number}`}
          </Chip>
        </DialogTitle>
        <Divider sx={{ my: 1.5, borderColor: '#262a40' }} />

        <DialogContent sx={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {errorMsg && (
            <Alert color="danger" startDecorator={<AlertCircle size={18} />} sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Items Preview */}
          <Sheet
            variant="solid"
            sx={{
              p: 2,
              borderRadius: '12px',
              bgcolor: '#181b2a',
              border: '1px solid #262b42',
              mb: 2.5
            }}
          >
            <Typography level="body-xs" sx={{ color: '#8f95b2', textTransform: 'uppercase', mb: 1 }}>
              Order Items ({order.items?.length || 0})
            </Typography>
            <Stack spacing={0.8} sx={{ maxHeight: 150, overflowY: 'auto' }}>
              {order.items?.map((item, idx) => (
                <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography level="body-sm" sx={{ color: '#e4e4e7' }}>
                    {item.product_name} <span style={{ color: '#a1a1aa' }}>× {item.quantity}</span>
                  </Typography>
                  <Typography level="body-sm" sx={{ color: '#ff7a45', fontWeight: 600 }}>
                    ₱{Number(item.subtotal).toFixed(2)}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            {order.customer_notes && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #2b304c' }}>
                <Typography level="body-xs" sx={{ color: '#eab308' }}>
                  <strong>Notes:</strong> {order.customer_notes}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 1.5, borderColor: '#2b304c' }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="title-md" sx={{ color: '#f4f4f5', fontWeight: 700 }}>
                TOTAL AMOUNT
              </Typography>
              <Typography level="h3" sx={{ color: '#ff7a45', fontWeight: 800 }}>
                ₱{orderTotal.toFixed(2)}
              </Typography>
            </Stack>
          </Sheet>

          {/* Payment Method Selector */}
          <Box sx={{ mb: 2.5 }}>
            <Typography level="body-sm" sx={{ color: '#a1a1aa', mb: 1, fontWeight: 600 }}>
              Payment Method
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant={paymentMethod === 'CASH' ? 'solid' : 'outlined'}
                onClick={() => setPaymentMethod('CASH')}
                startDecorator={<Banknote size={18} />}
                sx={{
                  flex: 1,
                  py: 1.4,
                  bgcolor: paymentMethod === 'CASH' ? '#e05624' : '#181b2a',
                  borderColor: paymentMethod === 'CASH' ? '#e05624' : '#2e3450',
                  color: paymentMethod === 'CASH' ? '#fff' : '#a1a1aa',
                  '&:hover': { bgcolor: paymentMethod === 'CASH' ? '#c8461b' : '#22263a' }
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
                  py: 1.4,
                  bgcolor: paymentMethod === 'GCASH' ? '#007dfe' : '#181b2a',
                  borderColor: paymentMethod === 'GCASH' ? '#007dfe' : '#2e3450',
                  color: paymentMethod === 'GCASH' ? '#fff' : '#a1a1aa',
                  '&:hover': { bgcolor: paymentMethod === 'GCASH' ? '#006cdb' : '#22263a' }
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
                  py: 1.4,
                  bgcolor: paymentMethod === 'CARD' ? '#7c3aed' : '#181b2a',
                  borderColor: paymentMethod === 'CARD' ? '#7c3aed' : '#2e3450',
                  color: paymentMethod === 'CARD' ? '#fff' : '#a1a1aa',
                  '&:hover': { bgcolor: paymentMethod === 'CARD' ? '#6d28d9' : '#22263a' }
                }}
              >
                Card / POS
              </Button>
            </Stack>
          </Box>

          {/* Cash Inputs & Change Calculation */}
          {paymentMethod === 'CASH' ? (
            <Box sx={{ mb: 2 }}>
              <Typography level="body-sm" sx={{ color: '#a1a1aa', mb: 1, fontWeight: 600 }}>
                Amount Received (₱)
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
                  fontWeight: 700,
                  bgcolor: '#181b2a',
                  borderColor: isInsufficient ? '#ef4444' : '#2e3450',
                  color: '#fff',
                  mb: 1.5,
                  '&:focus-within': { borderColor: '#e05624' }
                }}
              />

              {/* Quick Cash Buttons */}
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                <Button
                  size="sm"
                  variant="outlined"
                  onClick={() => setQuickAmount(orderTotal)}
                  sx={{ borderColor: '#3a4163', color: '#ff7a45' }}
                >
                  Exact (₱{orderTotal})
                </Button>
                {[100, 200, 500, 1000, 2000].map((amt) => {
                  if (amt >= orderTotal || (orderTotal > 1000 && amt === 2000)) {
                    return (
                      <Button
                        key={amt}
                        size="sm"
                        variant="soft"
                        onClick={() => setQuickAmount(amt)}
                        sx={{ bgcolor: '#24283b', color: '#f4f4f5' }}
                      >
                        ₱{amt}
                      </Button>
                    );
                  }
                  return null;
                })}
              </Stack>

              {/* Live Change Calculation Box */}
              <Sheet
                variant="solid"
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isInsufficient ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: isInsufficient ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography level="title-md" sx={{ color: isInsufficient ? '#f87171' : '#34d399', fontWeight: 700 }}>
                    {isInsufficient ? 'Short Amount' : 'Change Due'}
                  </Typography>
                  <Typography level="h3" sx={{ color: isInsufficient ? '#ef4444' : '#10b981', fontWeight: 800 }}>
                    ₱{Math.abs(numReceived - orderTotal).toFixed(2)}
                  </Typography>
                </Stack>
                {isInsufficient && (
                  <Typography level="body-xs" sx={{ color: '#fca5a5', mt: 0.5 }}>
                    Cannot confirm: customer provided less than the order total.
                  </Typography>
                )}
              </Sheet>
            </Box>
          ) : (
            /* GCash / Card Reference Input */
            <Box sx={{ mb: 2 }}>
              <Typography level="body-sm" sx={{ color: '#a1a1aa', mb: 1, fontWeight: 600 }}>
                {paymentMethod === 'GCASH' ? 'GCash Reference No.' : 'Card Approval / Auth Code'} (Optional)
              </Typography>
              <Input
                size="lg"
                placeholder={paymentMethod === 'GCASH' ? 'e.g. 100293847291' : 'e.g. 482910'}
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                sx={{
                  bgcolor: '#181b2a',
                  borderColor: '#2e3450',
                  color: '#fff',
                  mb: 1.5,
                  '&:focus-within': { borderColor: '#e05624' }
                }}
              />
              <Sheet
                variant="solid"
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <Typography level="body-sm" sx={{ color: '#34d399' }}>
                  Exact payment required: <strong>₱{orderTotal.toFixed(2)}</strong>. Change is ₱0.00.
                </Typography>
              </Sheet>
            </Box>
          )}
        </DialogContent>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderColor: '#3a4163', color: '#a1a1aa' }}>
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
              bgcolor: '#e05624',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              '&:hover': { bgcolor: '#c8461b' }
            }}
          >
            Confirm Payment
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
};

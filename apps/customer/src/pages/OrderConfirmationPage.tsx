import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Sheet,
  Button,
  Chip,
  Divider,
  Stack,
  Alert
} from '@mui/joy';
import { CheckCircle2, Clock, Sparkles, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Order, BAR_SETTINGS } from '../types';
import { API_BASE, fetchOrderByRef } from '../services/api';
import { connectRealtime } from '../../../../shared/realtime';
import { ThemeToggle } from '../components/ThemeToggle';

export const OrderConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const initialOrder = (location.state as any)?.order as Order | null;
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [tableNumber, setTableNumber] = useState<string>(
    (location.state as any)?.tableNumber || ''
  );
  const [pollingStatus, setPollingStatus] = useState<string>(initialOrder?.status || 'PENDING');
  const [realtimeToken, setRealtimeToken] = useState<string | null>(() =>
    initialOrder?.realtime_token || (reference ? sessionStorage.getItem(`barpos-order:${reference}`) : null)
  );

  useEffect(() => {
    if (!reference) return;
    if (!order) {
      fetchOrderByRef(reference)
        .then((fetched) => {
          setOrder(fetched);
          setPollingStatus(fetched.status);
          if (fetched.table_number) setTableNumber(fetched.table_number);
          if (fetched.realtime_token) {
            setRealtimeToken(fetched.realtime_token);
            sessionStorage.setItem(`barpos-order:${reference}`, fetched.realtime_token);
          }
        })
        .catch((err) => {
          console.warn('Could not load order by reference:', err);
        });
    }
  }, [reference, order]);

  useEffect(() => {
    if (reference && realtimeToken) {
      sessionStorage.setItem(`barpos-order:${reference}`, realtimeToken);
    }
  }, [reference, realtimeToken]);

  useEffect(() => {
    if (!reference || !realtimeToken) return;
    const socket = connectRealtime({ apiBase: API_BASE, token: realtimeToken });
    const applyStatus = (payload: {
      referenceNo: string;
      status: string;
      paymentStatus: string;
      tableNumber?: string;
    }) => {
      if (payload.referenceNo.toLowerCase() !== reference.toLowerCase()) return;
      setPollingStatus(payload.status);
      setOrder((current) => current ? {
        ...current,
        status: payload.status as Order['status'],
        payment_status: payload.paymentStatus as Order['payment_status']
      } : current);
      if (payload.tableNumber) setTableNumber(payload.tableNumber);
    };
    const requestCurrentStatus = () => socket.emit('order.status.request');
    socket.on('order.status', applyStatus);
    socket.on('order.status.changed', applyStatus);
    socket.on('connect', requestCurrentStatus);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [reference, realtimeToken]);

  const isPaid = pollingStatus === 'PAID' || order?.status === 'PAID';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.body',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle size="md" variant="outlined" />
      </Box>

      <Card
        variant="outlined"
        sx={{
          maxWidth: 420,
          width: '100%',
          bgcolor: 'background.surface',
          borderColor: isPaid ? 'success.500' : 'divider',
          borderRadius: '24px',
          p: 3,
          boxShadow: isPaid
            ? '0 12px 32px rgba(16, 185, 129, 0.2)'
            : 'md',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        <CardContent sx={{ alignItems: 'center' }}>
          {isPaid ? (
            <Box sx={{ mb: 2 }}>
              <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto' }} />
              <Typography level="h2" sx={{ color: '#10b981', mt: 1.5, fontWeight: 700 }}>
                PAYMENT CONFIRMED
              </Typography>
              <Chip variant="soft" color="success" size="lg" sx={{ mt: 1, fontWeight: 700 }}>
                STATUS: PAID
              </Chip>
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <Clock size={60} color="#ff7a45" style={{ margin: '0 auto' }} />
              <Typography level="h2" sx={{ color: 'text.primary', mt: 1.5, fontWeight: 700 }}>
                ORDER CONFIRMED
              </Typography>
              <Chip variant="soft" color="warning" size="md" sx={{ mt: 1, fontWeight: 600 }}>
                STATUS: PENDING PAYMENT
              </Chip>
            </Box>
          )}

          <Typography level="title-md" sx={{ color: 'text.secondary', mt: 1 }}>
            {BAR_SETTINGS.NAME}
          </Typography>

          {/* Table Badge */}
          <Chip
            variant="outlined"
            size="lg"
            sx={{
              mt: 1.5,
              borderColor: 'divider',
              color: 'text.primary',
              fontWeight: 700,
              px: 2
            }}
          >
            {order?.table_label || (tableNumber ? `Table ${tableNumber}` : 'Table')}
          </Chip>

          {/* Order Reference Box */}
          <Sheet
            variant="plain"
            sx={{
              my: 3,
              p: 2.5,
              borderRadius: '16px',
              bgcolor: 'background.level1',
              border: '2px dashed',
              borderColor: 'divider',
              width: '100%'
            }}
          >
            <Typography level="body-xs" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Your Order Reference
            </Typography>
            <Typography
              level="h1"
              sx={{
                color: 'primary.500',
                letterSpacing: '0.08em',
                fontWeight: 800,
                fontSize: '2.4rem',
                my: 0.5
              }}
            >
              {reference || order?.reference_no}
            </Typography>
            <Typography level="title-lg" sx={{ color: 'text.primary', fontWeight: 700 }}>
              Total: ₱{Number(order?.total || 0).toFixed(2)}
            </Typography>
          </Sheet>

          {/* Instructions Box */}
          {!isPaid ? (
            <Alert
              variant="soft"
              color="primary"
              sx={{
                mb: 3,
                bgcolor: 'primary.softBg',
                borderColor: 'primary.outlinedBorder',
                textAlign: 'left'
              }}
            >
              <Typography level="body-sm" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                👉 <strong>Next Step:</strong> Please proceed to the counter and provide your order reference number (
                <strong>{reference}</strong>) to the cashier for payment.
              </Typography>
            </Alert>
          ) : (
            <Alert
              variant="soft"
              color="success"
              sx={{
                mb: 3,
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                textAlign: 'left'
              }}
            >
              <Typography level="body-sm" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                🎉 <strong>Thank you!</strong> Your payment has been received by the cashier. Your drinks and food are
                being prepared and will be delivered to your table.
              </Typography>
            </Alert>
          )}

          {/* Items Summary if available */}
          {order?.items && order.items.length > 0 && (
            <Box sx={{ width: '100%', mb: 3, textAlign: 'left' }}>
              <Typography level="body-xs" sx={{ color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>
                Order Items ({order.items.length})
              </Typography>
              <Stack spacing={0.8}>
                {order.items.map((item, idx) => (
                  <Stack key={idx} direction="row" justifyContent="space-between">
                    <Typography level="body-sm" sx={{ color: 'text.primary' }}>
                      {item.product_name} × {item.quantity}
                    </Typography>
                    <Typography level="body-sm" sx={{ color: 'primary.500', fontWeight: 600 }}>
                      ₱{Number(item.subtotal).toFixed(2)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 1.5, borderColor: 'divider', width: '100%' }} />

          {/* Order more button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              const targetTable = tableNumber || order?.table_number || '1';
              navigate(`/order/table/${targetTable}`);
            }}
            startDecorator={<ArrowLeft size={16} />}
            sx={{
              borderColor: 'divider',
              color: 'text.secondary',
              borderRadius: '12px',
              py: 1.2,
              '&:hover': { bgcolor: 'background.level1', color: 'text.primary' }
            }}
          >
            Order More for Table {tableNumber || order?.table_number || '1'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

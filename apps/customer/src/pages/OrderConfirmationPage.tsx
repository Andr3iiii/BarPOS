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

export const OrderConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(
    (location.state as any)?.order || null
  );
  const [tableNumber, setTableNumber] = useState<string>(
    (location.state as any)?.tableNumber || ''
  );
  const [pollingStatus, setPollingStatus] = useState<string>('PENDING');

  // Poll backend every 4 seconds to detect when Cashier marks order PAID!
  useEffect(() => {
    let intervalId: any;

    async function checkOrderStatus() {
      if (!reference) return;
      try {
        const res = await fetch(`/api/v1/orders/ref/${encodeURIComponent(reference)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setOrder(json.data);
            setPollingStatus(json.data.status);
            if (json.data.table_number) {
              setTableNumber(json.data.table_number);
            }
          }
        }
      } catch (err) {
        // Silent background check error
      }
    }

    checkOrderStatus();
    intervalId = setInterval(checkOrderStatus, 4000);
    return () => clearInterval(intervalId);
  }, [reference]);

  const isPaid = pollingStatus === 'PAID' || order?.status === 'PAID';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#090a10',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 420,
          width: '100%',
          bgcolor: '#12141f',
          borderColor: isPaid ? '#10b981' : '#2d334d',
          borderRadius: '24px',
          p: 3,
          boxShadow: isPaid
            ? '0 12px 32px rgba(16, 185, 129, 0.2)'
            : '0 12px 32px rgba(0, 0, 0, 0.5)',
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
              <Typography level="h2" sx={{ color: '#f4f4f5', mt: 1.5, fontWeight: 700 }}>
                ORDER CONFIRMED
              </Typography>
              <Chip variant="soft" color="warning" size="md" sx={{ mt: 1, fontWeight: 600 }}>
                STATUS: PENDING PAYMENT
              </Chip>
            </Box>
          )}

          <Typography level="title-md" sx={{ color: '#a1a1aa', mt: 1 }}>
            {BAR_SETTINGS.NAME}
          </Typography>

          {/* Table Badge */}
          <Chip
            variant="outlined"
            size="lg"
            sx={{
              mt: 1.5,
              borderColor: '#383e5c',
              color: '#f4f4f5',
              fontWeight: 700,
              px: 2
            }}
          >
            {order?.table_label || (tableNumber ? `Table ${tableNumber}` : 'Table')}
          </Chip>

          {/* Order Reference Box */}
          <Sheet
            variant="solid"
            sx={{
              my: 3,
              p: 2.5,
              borderRadius: '16px',
              bgcolor: '#191c2b',
              border: '2px dashed #3a4163',
              width: '100%'
            }}
          >
            <Typography level="body-xs" sx={{ color: '#8f95b2', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Your Order Reference
            </Typography>
            <Typography
              level="h1"
              sx={{
                color: '#ff7a45',
                letterSpacing: '0.08em',
                fontWeight: 800,
                fontSize: '2.4rem',
                my: 0.5
              }}
            >
              {reference || order?.reference_no}
            </Typography>
            <Typography level="title-lg" sx={{ color: '#f4f4f5', fontWeight: 700 }}>
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
                bgcolor: 'rgba(224, 86, 36, 0.12)',
                borderColor: 'rgba(224, 86, 36, 0.3)',
                textAlign: 'left'
              }}
            >
              <Typography level="body-sm" sx={{ color: '#f4f4f5', lineHeight: 1.5 }}>
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
              <Typography level="body-sm" sx={{ color: '#f4f4f5', lineHeight: 1.5 }}>
                🎉 <strong>Thank you!</strong> Your payment has been received by the cashier. Your drinks and food are
                being prepared and will be delivered to your table.
              </Typography>
            </Alert>
          )}

          {/* Items Summary if available */}
          {order?.items && order.items.length > 0 && (
            <Box sx={{ width: '100%', mb: 3, textAlign: 'left' }}>
              <Typography level="body-xs" sx={{ color: '#71717a', textTransform: 'uppercase', mb: 1 }}>
                Order Items ({order.items.length})
              </Typography>
              <Stack spacing={0.8}>
                {order.items.map((item, idx) => (
                  <Stack key={idx} direction="row" justifyContent="space-between">
                    <Typography level="body-sm" sx={{ color: '#d4d4d8' }}>
                      {item.product_name} × {item.quantity}
                    </Typography>
                    <Typography level="body-sm" sx={{ color: '#ff7a45' }}>
                      ₱{Number(item.subtotal).toFixed(2)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 1.5, borderColor: '#23273c', width: '100%' }} />

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
              borderColor: '#383e5c',
              color: '#d4d4d8',
              borderRadius: '12px',
              py: 1.2,
              '&:hover': { bgcolor: '#1c2032', borderColor: '#ff7a45', color: '#fff' }
            }}
          >
            Order More for Table {tableNumber || order?.table_number || '1'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

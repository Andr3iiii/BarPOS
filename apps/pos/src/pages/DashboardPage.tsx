import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Sheet,
  Stack,
  Divider,
  CircularProgress,
  Button
} from '@mui/joy';
import { DollarSign, Clock, CheckCircle2, ShoppingBag, ArrowUpRight, RefreshCw } from 'lucide-react';
import { DashboardMetrics } from '../types';
import { API_BASE, expireSession, fetchDashboardMetrics, getStoredToken } from '../services/api';
import { connectRealtime } from '../../../../shared/realtime';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const token = getStoredToken();
    if (!token) return;

    const socket = connectRealtime({ apiBase: API_BASE, token, onUnauthorized: expireSession });
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let hasConnected = false;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => loadMetrics(), 150);
    };
    socket.on('order.created', scheduleRefresh);
    socket.on('order.status.changed', scheduleRefresh);
    socket.on('connect', () => {
      if (hasConnected) scheduleRefresh();
      hasConnected = true;
    });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  if (loading && !metrics) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <CircularProgress size="lg" sx={{ color: '#e05624' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography level="h2" sx={{ color: '#fff', fontWeight: 800 }}>
            Operational Dashboard
          </Typography>
          <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
            Real-time sales performance for today
          </Typography>
        </Box>
        <Button
          size="sm"
          variant="outlined"
          onClick={loadMetrics}
          startDecorator={<RefreshCw size={16} />}
          sx={{ borderColor: '#2e3450', color: '#a1a1aa' }}
        >
          Refresh Metrics
        </Button>
      </Stack>

      {/* Operational Metrics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 2.5
        }}
      >
        {/* Today's Sales */}
        <Card
          variant="outlined"
          sx={{
            bgcolor: 'background.surface',
            borderColor: 'divider',
            borderRadius: '16px',
            p: 2.5
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="body-xs" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
                Today's Sales
              </Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'primary.softBg', color: 'primary.500' }}>
                <DollarSign size={20} />
              </Box>
            </Stack>
            <Typography level="h2" sx={{ color: 'primary.500', fontWeight: 800, mt: 1.5 }}>
              ₱{metrics ? metrics.today_sales.toFixed(2) : '0.00'}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              Gross revenue collected today
            </Typography>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card
          variant="outlined"
          sx={{
            bgcolor: 'background.surface',
            borderColor: 'divider',
            borderRadius: '16px',
            p: 2.5
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="body-xs" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
                Pending Orders
              </Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
                <Clock size={20} />
              </Box>
            </Stack>
            <Typography level="h2" sx={{ color: '#eab308', fontWeight: 800, mt: 1.5 }}>
              {metrics ? metrics.pending_orders : 0}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              Awaiting counter payment
            </Typography>
          </CardContent>
        </Card>

        {/* Paid Orders */}
        <Card
          variant="outlined"
          sx={{
            bgcolor: 'background.surface',
            borderColor: 'divider',
            borderRadius: '16px',
            p: 2.5
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="body-xs" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
                Paid Orders
              </Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <CheckCircle2 size={20} />
              </Box>
            </Stack>
            <Typography level="h2" sx={{ color: '#10b981', fontWeight: 800, mt: 1.5 }}>
              {metrics ? metrics.paid_orders : 0}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              Completed transactions today
            </Typography>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card
          variant="outlined"
          sx={{
            bgcolor: 'background.surface',
            borderColor: 'divider',
            borderRadius: '16px',
            p: 2.5
          }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="body-xs" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Orders
              </Typography>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <ShoppingBag size={20} />
              </Box>
            </Stack>
            <Typography level="h2" sx={{ color: '#818cf8', fontWeight: 800, mt: 1.5 }}>
              {metrics ? metrics.total_orders : 0}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              All tickets created today
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* POS Quick Instructions */}
      <Sheet
        variant="plain"
        sx={{
          mt: 4,
          p: 3,
          borderRadius: '16px',
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography level="title-md" sx={{ color: 'text.primary', mb: 1, fontWeight: 700 }}>
          ⚡ Cashier Quick Workflow Tips
        </Typography>
        <Stack spacing={1} sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
          <div>
            1. <strong>Customer Scans QR:</strong> Customer scans their table QR code and submits an order from their mobile phone.
          </div>
          <div>
            2. <strong>Incoming Order:</strong> The order immediately pops up on the <strong>Orders</strong> screen with reference e.g. <code>T1-1001</code>.
          </div>
          <div>
            3. <strong>Fast Counter Lookup:</strong> When the customer arrives at the counter, enter their order reference into the search bar.
          </div>
          <div>
            4. <strong>Payment & Receipt:</strong> Click <strong>Open & Pay</strong>, enter the cash amount received (or GCash/Card), and confirm to print an official thermal receipt!
          </div>
        </Stack>
      </Sheet>
    </Box>
  );
};

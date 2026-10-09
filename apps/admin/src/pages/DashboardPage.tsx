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
  Chip
} from '@mui/joy';
import { DollarSign, Clock, CheckCircle2, TrendingUp, CreditCard, Banknote, QrCode } from 'lucide-react';
import { DashboardMetrics, SalesSummary } from '../types';
import { API_BASE, expireSession, fetchDashboardMetrics, fetchSalesReports, getStoredToken } from '../services/api';
import { connectRealtime } from '../../../../shared/realtime';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    async function loadData() {
      try {
        setLoading(true);
        const [m, s] = await Promise.all([
          fetchDashboardMetrics(),
          fetchSalesReports({ period: 'today' })
        ]);
        setMetrics(m);
        setSalesSummary(s);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const token = getStoredToken();
    if (!token) return;
    const socket = connectRealtime({ apiBase: API_BASE, token, onUnauthorized: expireSession });
    let hasConnected = false;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => loadData(), 150);
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

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <CircularProgress size="lg" sx={{ color: '#e05624' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography level="h2" sx={{ color: '#fff', fontWeight: 800 }}>
          Executive Dashboard
        </Typography>
        <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
          Overview of bar operations, sales revenue, and transactions
        </Typography>
      </Box>

      {/* Primary KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 2.5,
          mb: 4
        }}
      >
        <Card variant="outlined" sx={{ bgcolor: 'background.surface', borderColor: 'divider', borderRadius: '16px', p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
              Today's Gross Sales
            </Typography>
            <DollarSign size={18} color="#e05624" />
          </Stack>
          <Typography level="h2" sx={{ color: 'primary.500', fontWeight: 800, mt: 1 }}>
            ₱{metrics?.today_sales.toFixed(2) || '0.00'}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {metrics?.paid_orders || 0} completed transactions
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: 'background.surface', borderColor: 'divider', borderRadius: '16px', p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
              Average Ticket
            </Typography>
            <TrendingUp size={18} color="#10b981" />
          </Stack>
          <Typography level="h2" sx={{ color: '#10b981', fontWeight: 800, mt: 1 }}>
            ₱{salesSummary?.average_ticket.toFixed(2) || '0.00'}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            Per completed customer order
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: 'background.surface', borderColor: 'divider', borderRadius: '16px', p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
              Pending at Counter
            </Typography>
            <Clock size={18} color="#eab308" />
          </Stack>
          <Typography level="h2" sx={{ color: '#eab308', fontWeight: 800, mt: 1 }}>
            {metrics?.pending_orders || 0}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            Awaiting cashier payment
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: 'background.surface', borderColor: 'divider', borderRadius: '16px', p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Orders Today
            </Typography>
            <CheckCircle2 size={18} color="#818cf8" />
          </Stack>
          <Typography level="h2" sx={{ color: '#818cf8', fontWeight: 800, mt: 1 }}>
            {metrics?.total_orders || 0}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            Submitted across all tables
          </Typography>
        </Card>
      </Box>

      {/* Payment Method Breakdown */}
      <Card variant="outlined" sx={{ bgcolor: 'background.surface', borderColor: 'divider', borderRadius: '16px', p: 3, mb: 4 }}>
        <Typography level="title-md" sx={{ color: 'text.primary', fontWeight: 700, mb: 2 }}>
          Payment Method Breakdown (Today)
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            gap: 2
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Banknote size={18} color="#e05624" />
              <Typography level="title-sm" sx={{ color: 'text.primary' }}>
                Cash
              </Typography>
            </Stack>
            <Typography level="h3" sx={{ color: 'text.primary', fontWeight: 800 }}>
              ₱{salesSummary?.by_payment_method.CASH.toFixed(2) || '0.00'}
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <QrCode size={18} color="#007dfe" />
              <Typography level="title-sm" sx={{ color: 'text.primary' }}>
                GCash
              </Typography>
            </Stack>
            <Typography level="h3" sx={{ color: 'text.primary', fontWeight: 800 }}>
              ₱{Number(salesSummary?.by_payment_method.GCASH || 0).toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <CreditCard size={18} color="#a855f7" />
              <Typography level="title-sm" sx={{ color: 'text.primary' }}>
                Card / POS Terminal
              </Typography>
            </Stack>
            <Typography level="h3" sx={{ color: 'text.primary', fontWeight: 800 }}>
              ₱{salesSummary?.by_payment_method.CARD.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

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
import { fetchDashboardMetrics, fetchSalesReports } from '../services/api';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
        <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', borderRadius: '16px', p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: '#8f95b2', fontWeight: 700, textTransform: 'uppercase' }}>
              Today's Gross Sales
            </Typography>
            <DollarSign size={18} color="#ff7a45" />
          </Stack>
          <Typography level="h2" sx={{ color: '#ff7a45', fontWeight: 800, mt: 1 }}>
            ₱{metrics?.today_sales.toFixed(2) || '0.00'}
          </Typography>
          <Typography level="body-xs" sx={{ color: '#71717a' }}>
            {metrics?.paid_orders || 0} completed transactions
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', borderRadius: '16px', p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: '#8f95b2', fontWeight: 700, textTransform: 'uppercase' }}>
              Average Ticket
            </Typography>
            <TrendingUp size={18} color="#34d399" />
          </Stack>
          <Typography level="h2" sx={{ color: '#34d399', fontWeight: 800, mt: 1 }}>
            ₱{salesSummary?.average_ticket.toFixed(2) || '0.00'}
          </Typography>
          <Typography level="body-xs" sx={{ color: '#71717a' }}>
            Per completed customer order
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', borderRadius: '16px', p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: '#8f95b2', fontWeight: 700, textTransform: 'uppercase' }}>
              Pending at Counter
            </Typography>
            <Clock size={18} color="#facc15" />
          </Stack>
          <Typography level="h2" sx={{ color: '#facc15', fontWeight: 800, mt: 1 }}>
            {metrics?.pending_orders || 0}
          </Typography>
          <Typography level="body-xs" sx={{ color: '#71717a' }}>
            Awaiting cashier payment
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', borderRadius: '16px', p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography level="body-xs" sx={{ color: '#8f95b2', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Orders Today
            </Typography>
            <CheckCircle2 size={18} color="#818cf8" />
          </Stack>
          <Typography level="h2" sx={{ color: '#818cf8', fontWeight: 800, mt: 1 }}>
            {metrics?.total_orders || 0}
          </Typography>
          <Typography level="body-xs" sx={{ color: '#71717a' }}>
            Submitted across all tables
          </Typography>
        </Card>
      </Box>

      {/* Payment Method Breakdown */}
      <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', borderRadius: '16px', p: 3, mb: 4 }}>
        <Typography level="title-md" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
          Payment Method Breakdown (Today)
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            gap: 2
          }}
        >
          <Box sx={{ p: 2, bgcolor: '#181b2a', borderRadius: '12px', border: '1px solid #282d44' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Banknote size={18} color="#ff7a45" />
              <Typography level="title-sm" sx={{ color: '#e4e4e7' }}>
                Cash
              </Typography>
            </Stack>
            <Typography level="h3" sx={{ color: '#fff', fontWeight: 800 }}>
              ₱{salesSummary?.by_payment_method.CASH.toFixed(2) || '0.00'}
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#181b2a', borderRadius: '12px', border: '1px solid #282d44' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <QrCode size={18} color="#007dfe" />
              <Typography level="title-sm" sx={{ color: '#e4e4e7' }}>
                GCash
              </Typography>
            </Stack>
            <Typography level="h3" sx={{ color: '#fff', fontWeight: 800 }}>
              ₱{Number(salesSummary?.by_payment_method.GCASH || 0).toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#181b2a', borderRadius: '12px', border: '1px solid #282d44' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <CreditCard size={18} color="#a855f7" />
              <Typography level="title-sm" sx={{ color: '#e4e4e7' }}>
                Card / POS Terminal
              </Typography>
            </Stack>
            <Typography level="h3" sx={{ color: '#fff', fontWeight: 800 }}>
              ₱{salesSummary?.by_payment_method.CARD.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

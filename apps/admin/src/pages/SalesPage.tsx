import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  Button,
  Select,
  Option,
  Stack,
  Divider,
  Chip,
  Input
} from '@mui/joy';
import { Download, Filter, TrendingUp, DollarSign, Receipt, CreditCard } from 'lucide-react';
import { SalesSummary, SalesRecord, PaymentMethod } from '../types';
import { API_BASE, expireSession, fetchSalesReports, getStoredToken } from '../services/api';
import { connectRealtime } from '../../../../shared/realtime';

export const SalesPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [paymentMethod, setPaymentMethod] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await fetchSalesReports({
        period,
        payment_method: paymentMethod as any,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
    const token = getStoredToken();
    if (!token) return;
    const socket = connectRealtime({ apiBase: API_BASE, token, onUnauthorized: expireSession });
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let hasConnected = false;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => loadSales(), 150);
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
  }, [period, paymentMethod]);

  const handleExportCSV = () => {
    if (!summary || summary.records.length === 0) return;

    const headers = ['Order Ref', 'Table', 'Date', 'Time', 'Total', 'Payment Method', 'Received', 'Change', 'Cashier', 'Status'];
    const rows = summary.records.map((r) => [
      r.reference_no,
      r.table_label || r.table_number,
      r.date,
      r.time,
      r.total,
      r.payment_method,
      r.amount_received,
      r.change_amount,
      r.cashier_name,
      r.status
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bar_Sales_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography level="h2" sx={{ color: '#fff', fontWeight: 800 }}>
            Sales & Transaction Ledger
          </Typography>
          <Typography level="body-sm" sx={{ color: '#a1a1aa' }}>
            Historical transaction records, revenue breakdown, and audit trails
          </Typography>
        </Box>
        <Button
          size="md"
          variant="solid"
          onClick={handleExportCSV}
          disabled={!summary || summary.records.length === 0}
          startDecorator={<Download size={18} />}
          sx={{ bgcolor: '#e05624', color: '#fff', borderRadius: '12px', '&:hover': { bgcolor: '#c8461b' } }}
        >
          Export CSV Report
        </Button>
      </Stack>

      {/* Filter Bar */}
      <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Box sx={{ minWidth: 180 }}>
            <Typography level="body-xs" sx={{ color: '#8f95b2', mb: 0.5 }}>
              Date Range:
            </Typography>
            <Select
              value={period}
              onChange={(_, val) => val && setPeriod(val as any)}
              sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
            >
              <Option value="today">Today</Option>
              <Option value="yesterday">Yesterday</Option>
              <Option value="week">This Week (Last 7 Days)</Option>
              <Option value="month">This Month (Last 30 Days)</Option>
              <Option value="custom">Custom Range</Option>
            </Select>
          </Box>

          <Box sx={{ minWidth: 180 }}>
            <Typography level="body-xs" sx={{ color: '#8f95b2', mb: 0.5 }}>
              Payment Method:
            </Typography>
            <Select
              value={paymentMethod}
              onChange={(_, val) => val && setPaymentMethod(val as any)}
              sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
            >
              <Option value="ALL">All Methods</Option>
              <Option value="CASH">Cash</Option>
              <Option value="GCASH">GCash</Option>
              <Option value="CARD">Card</Option>
            </Select>
          </Box>

          {period === 'custom' && (
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <Box>
                <Typography level="body-xs" sx={{ color: '#8f95b2', mb: 0.5 }}>
                  From:
                </Typography>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
                />
              </Box>
              <Box>
                <Typography level="body-xs" sx={{ color: '#8f95b2', mb: 0.5 }}>
                  To:
                </Typography>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  sx={{ bgcolor: '#181b2a', borderColor: '#2e3450', color: '#fff' }}
                />
              </Box>
              <Button onClick={loadSales} sx={{ bgcolor: '#e05624' }}>
                Filter
              </Button>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Summary KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
          gap: 2.5,
          mb: 3
        }}
      >
        <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', p: 2.5, borderRadius: '16px' }}>
          <Typography level="body-xs" sx={{ color: '#8f95b2', textTransform: 'uppercase' }}>
            Period Gross Revenue
          </Typography>
          <Typography level="h2" sx={{ color: '#ff7a45', fontWeight: 800, mt: 1 }}>
            ₱{summary?.total_revenue.toFixed(2) || '0.00'}
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', p: 2.5, borderRadius: '16px' }}>
          <Typography level="body-xs" sx={{ color: '#8f95b2', textTransform: 'uppercase' }}>
            Paid Orders Count
          </Typography>
          <Typography level="h2" sx={{ color: '#34d399', fontWeight: 800, mt: 1 }}>
            {summary?.total_orders || 0}
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', p: 2.5, borderRadius: '16px' }}>
          <Typography level="body-xs" sx={{ color: '#8f95b2', textTransform: 'uppercase' }}>
            Average Spend / Order
          </Typography>
          <Typography level="h2" sx={{ color: '#818cf8', fontWeight: 800, mt: 1 }}>
            ₱{summary?.average_ticket.toFixed(2) || '0.00'}
          </Typography>
        </Card>
      </Box>

      {/* Itemized Transactions Table */}
      <Card variant="outlined" sx={{ bgcolor: '#12141f', borderColor: '#202438', p: 0, overflow: 'hidden' }}>
        <Table hoverRow sx={{ '& th': { bgcolor: '#181b2a', color: '#8f95b2' }, '& td': { color: '#e4e4e7' } }}>
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Table</th>
              <th>Date & Time</th>
              <th>Total</th>
              <th>Payment Method</th>
              <th>Cashier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {summary?.records.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  No sales recorded for this period.
                </td>
              </tr>
            ) : (
              summary?.records.map((r) => (
                <tr key={r.order_id}>
                  <td>
                    <Typography level="title-sm" sx={{ color: '#ff7a45', fontFamily: 'monospace', fontWeight: 700 }}>
                      {r.reference_no}
                    </Typography>
                  </td>
                  <td>{r.table_label || `Table ${r.table_number}`}</td>
                  <td>
                    {r.date} <span style={{ color: '#71717a' }}>{r.time}</span>
                  </td>
                  <td>
                    <Typography level="title-sm" sx={{ color: '#fff', fontWeight: 700 }}>
                      ₱{r.total.toFixed(2)}
                    </Typography>
                  </td>
                  <td>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={r.payment_method === 'CASH' ? 'primary' : r.payment_method === 'GCASH' ? 'success' : 'neutral'}
                    >
                      {r.payment_method}
                    </Chip>
                  </td>
                  <td>{r.cashier_name}</td>
                  <td>
                    <Chip size="sm" variant="soft" color="success">
                      {r.status}
                    </Chip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </Box>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Sheet,
  Input,
  Button,
  Chip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Dropdown,
  Menu,
  MenuItem,
  MenuButton
} from '@mui/joy';
import {
  Search,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Banknote,
  Printer,
  X,
  Coffee,
  Beer
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { API_BASE, expireSession, fetchOrders, cancelOrder, fetchReceiptData, getStoredToken } from '../services/api';
import { connectRealtime } from '../../../../shared/realtime';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { WalkInOrderModal } from '../components/WalkInOrderModal';

interface OrdersPageProps {
  isWalkInOpen?: boolean;
  onCloseWalkIn?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeReceiptData, setActiveReceiptData] = useState<any | null>(null);
  const [isWalkInOpen, setIsWalkInOpen] = useState<boolean>(false);

  // Load orders
  const loadOrders = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      setErrorMsg(null);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err: any) {
      if (!isPolling) {
        setErrorMsg(err.message || 'Unable to load orders from the server.');
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, []);

  // Initial load plus event-driven refreshes. Reconnection performs a REST
  // refresh so a temporary disconnect cannot leave the order list stale.
  useEffect(() => {
    loadOrders(false);

    const token = getStoredToken();
    if (!token) return;

    const socket = connectRealtime({ apiBase: API_BASE, token, onUnauthorized: expireSession });
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let hasConnected = false;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => loadOrders(true), 150);
    };
    const handleConnect = () => {
      if (hasConnected) scheduleRefresh();
      hasConnected = true;
    };

    socket.on('connect', handleConnect);
    socket.on('order.created', scheduleRefresh);
    socket.on('order.status.changed', scheduleRefresh);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [loadOrders]);

  // Cancel order handler
  const handleCancel = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      loadOrders(true);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    }
  };

  // View existing receipt for paid order
  const handleViewReceipt = async (orderId: number) => {
    try {
      const receipt = await fetchReceiptData(orderId);
      setActiveReceiptData(receipt);
    } catch (err: any) {
      alert('Unable to load receipt.');
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === 'ALL' || order.status === selectedStatus;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.reference_no.toLowerCase().includes(q) ||
        order.table_number.toLowerCase().includes(q) ||
        (order.table_label && order.table_label.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === 'PENDING').length,
    [orders]
  );
  const paidCount = useMemo(
    () => orders.filter((o) => o.status === 'PAID').length,
    [orders]
  );

  return (
    <Box>
      {/* Top Controls: Search Bar & Status Filters */}
      <Sheet
        variant="plain"
        sx={{
          p: 2.5,
          borderRadius: '16px',
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          mb: 3
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          {/* Prominent Search Bar */}
          <Box sx={{ width: { xs: '100%', md: '500px' } }}>
            <Input
              size="lg"
              placeholder="Search by Order Ref (e.g. T1-1001) or Table #..."
              startDecorator={<Search size={20} color="#e05624" />}
              endDecorator={
                searchQuery ? (
                  <IconButton size="sm" variant="plain" onClick={() => setSearchQuery('')} sx={{ color: 'text.secondary' }}>
                    <X size={16} />
                  </IconButton>
                ) : null
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                bgcolor: 'background.level1',
                borderColor: 'divider',
                color: 'text.primary',
                fontSize: '1rem',
                '&:focus-within': { borderColor: 'primary.500' }
              }}
            />
          </Box>

          {/* Status Filter Buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="sm"
              variant={selectedStatus === 'ALL' ? 'solid' : 'outlined'}
              onClick={() => setSelectedStatus('ALL')}
              sx={{
                borderRadius: '10px',
                bgcolor: selectedStatus === 'ALL' ? 'primary.solidBg' : 'background.level1',
                borderColor: selectedStatus === 'ALL' ? 'primary.solidBg' : 'divider',
                color: selectedStatus === 'ALL' ? '#fff' : 'text.secondary'
              }}
            >
              All Orders ({orders.length})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'PENDING' ? 'solid' : 'outlined'}
              onClick={() => setSelectedStatus('PENDING')}
              sx={{
                borderRadius: '10px',
                bgcolor: selectedStatus === 'PENDING' ? '#ff7a45' : 'background.level1',
                borderColor: selectedStatus === 'PENDING' ? '#ff7a45' : 'divider',
                color: selectedStatus === 'PENDING' ? '#fff' : 'text.secondary'
              }}
            >
              Pending ({pendingCount})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'PAID' ? 'solid' : 'outlined'}
              onClick={() => setSelectedStatus('PAID')}
              sx={{
                borderRadius: '10px',
                bgcolor: selectedStatus === 'PAID' ? '#10b981' : 'background.level1',
                borderColor: selectedStatus === 'PAID' ? '#10b981' : 'divider',
                color: selectedStatus === 'PAID' ? '#fff' : 'text.secondary'
              }}
            >
              Paid ({paidCount})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'CANCELLED' ? 'solid' : 'outlined'}
              onClick={() => setSelectedStatus('CANCELLED')}
              sx={{
                borderRadius: '10px',
                bgcolor: selectedStatus === 'CANCELLED' ? '#ef4444' : 'background.level1',
                borderColor: selectedStatus === 'CANCELLED' ? '#ef4444' : 'divider',
                color: selectedStatus === 'CANCELLED' ? '#fff' : 'text.secondary'
              }}
            >
              Cancelled
            </Button>
          </Stack>
        </Stack>
      </Sheet>

      {/* Error state */}
      {errorMsg && (
        <Alert color="danger" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Loading state */}
      {loading && orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CircularProgress size="lg" sx={{ color: '#e05624', mb: 2 }} />
          <Typography level="body-md" sx={{ color: '#a1a1aa' }}>
            Syncing orders with backend...
          </Typography>
        </Box>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            bgcolor: 'background.surface',
            borderRadius: '16px',
            border: '1px dashed',
            borderColor: 'divider',
            p: 4
          }}
        >
          <Receipt size={48} color="#71717a" style={{ margin: '0 auto 16px' }} />
          <Typography level="title-lg" sx={{ color: 'text.primary', mb: 0.5 }}>
            No Orders Found
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            {searchQuery
              ? `No matching orders for "${searchQuery}". Check the reference number or table identifier.`
              : 'Waiting for customers to scan table QR and submit orders.'}
          </Typography>
        </Box>
      ) : (
        /* Orders Grid */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: 2.5
          }}
        >
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPaid = order.status === 'PAID';
            const isCancelled = order.status === 'CANCELLED';

            return (
              <Card
                key={order.id}
                variant="outlined"
                sx={{
                  bgcolor: 'background.surface',
                  borderColor: isPending ? 'primary.400' : 'divider',
                  boxShadow: isPending ? '0 4px 20px rgba(224, 86, 36, 0.12)' : 'sm',
                  borderRadius: '16px',
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: isPending ? 'primary.solidBg' : 'primary.300'
                  }
                }}
              >
                <Box>
                  {/* Card Header: Table + Status + Ref */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Chip
                        variant="outlined"
                        size="md"
                        sx={{
                          borderColor: 'divider',
                          color: 'text.primary',
                          fontWeight: 700,
                          bgcolor: 'background.level1',
                          mb: 0.5
                        }}
                      >
                        {order.table_label || `Table ${order.table_number}`}
                      </Chip>
                      <Typography
                        level="h3"
                        sx={{
                          color: 'primary.500',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          fontFamily: 'monospace'
                        }}
                      >
                        {order.reference_no}
                      </Typography>
                    </Box>

                    {/* Status Badge */}
                    <Chip
                      variant="soft"
                      size="sm"
                      color={isPending ? 'warning' : isPaid ? 'success' : 'danger'}
                      sx={{ fontWeight: 700 }}
                    >
                      {order.status}
                    </Chip>
                  </Stack>

                  <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                    {new Date(order.created_at).toLocaleTimeString('en-PH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </Typography>

                  <Divider sx={{ my: 1.5, borderColor: 'divider' }} />

                  {/* Items Preview */}
                  <Stack spacing={0.6} sx={{ mb: 1.5 }}>
                    {order.items?.slice(0, 3).map((item, idx) => (
                      <Stack key={idx} direction="row" justifyContent="space-between">
                        <Typography level="body-sm" sx={{ color: 'text.primary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {item.product_name} <span style={{ opacity: 0.7 }}>× {item.quantity}</span>
                        </Typography>
                        <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600 }}>
                          ₱{Number(item.subtotal).toFixed(2)}
                        </Typography>
                      </Stack>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <Typography level="body-xs" sx={{ color: 'text.tertiary', fontStyle: 'italic' }}>
                        + {order.items.length - 3} more item(s)...
                      </Typography>
                    )}
                  </Stack>

                  {order.customer_notes && (
                    <Box sx={{ p: 1, bgcolor: 'background.level1', borderRadius: '8px', mb: 1.5 }}>
                      <Typography level="body-xs" sx={{ color: 'warning.500' }}>
                        "{order.customer_notes}"
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Bottom Total & Actions */}
                <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography level="body-xs" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                      Order Total
                    </Typography>
                    <Typography level="h3" sx={{ color: 'text.primary', fontWeight: 800 }}>
                      ₱{Number(order.total).toFixed(2)}
                    </Typography>
                  </Stack>

                  {/* Primary CTA Buttons */}
                  {isPending && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="solid"
                        fullWidth
                        onClick={() => setActivePaymentOrder(order)}
                        startDecorator={<Banknote size={18} />}
                        sx={{
                          bgcolor: 'primary.solidBg',
                          color: '#fff',
                          fontWeight: 700,
                          py: 1.2,
                          borderRadius: '12px',
                          '&:hover': { bgcolor: 'primary.solidHoverBg' }
                        }}
                      >
                        Open & Pay
                      </Button>
                      <IconButton
                        variant="outlined"
                        onClick={() => handleCancel(order.id)}
                        sx={{ borderColor: 'divider', color: 'danger.500', borderRadius: '12px' }}
                      >
                        <XCircle size={18} />
                      </IconButton>
                    </Stack>
                  )}

                  {isPaid && (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleViewReceipt(order.id)}
                      startDecorator={<Printer size={16} />}
                      sx={{
                        borderColor: 'divider',
                        color: 'success.500',
                        borderRadius: '12px',
                        py: 1,
                        '&:hover': { bgcolor: 'background.level1' }
                      }}
                    >
                      View Receipt
                    </Button>
                  )}

                  {isCancelled && (
                    <Chip variant="soft" color="danger" sx={{ width: '100%', py: 1, borderRadius: '12px' }}>
                      Cancelled
                    </Chip>
                  )}
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Payment Processing Modal */}
      <PaymentModal
        open={Boolean(activePaymentOrder)}
        order={activePaymentOrder}
        onClose={() => setActivePaymentOrder(null)}
        onPaymentSuccess={(receipt) => {
          setActivePaymentOrder(null);
          setActiveReceiptData(receipt);
          loadOrders(true);
        }}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        open={Boolean(activeReceiptData)}
        receiptData={activeReceiptData}
        onClose={() => setActiveReceiptData(null)}
      />
    </Box>
  );
};

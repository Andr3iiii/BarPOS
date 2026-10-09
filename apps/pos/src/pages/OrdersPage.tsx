import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  Sheet,
  Input,
  Button,
  Chip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/joy';
import {
  Search,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  Printer,
  X,
  PlusCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';
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

  // Global event listener for header "Counter Order" button
  useEffect(() => {
    const handleOpenWalkIn = () => setIsWalkInOpen(true);
    window.addEventListener('open-walkin-modal', handleOpenWalkIn);
    return () => window.removeEventListener('open-walkin-modal', handleOpenWalkIn);
  }, []);

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

  // Realtime updates
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

  // View receipt for paid order
  const handleViewReceipt = async (orderId: number) => {
    try {
      const receipt = await fetchReceiptData(orderId);
      setActiveReceiptData(receipt);
    } catch (err: any) {
      alert('Unable to load receipt.');
    }
  };

  // Metrics
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'PENDING'), [orders]);
  const paidOrders = useMemo(() => orders.filter((o) => o.status === 'PAID'), [orders]);
  const cancelledOrders = useMemo(() => orders.filter((o) => o.status === 'CANCELLED'), [orders]);

  const pendingTotal = useMemo(
    () => pendingOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    [pendingOrders]
  );
  const paidTotal = useMemo(
    () => paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    [paidOrders]
  );

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

  return (
    <Box sx={{ pb: 6 }}>
      {/* 1. Quick KPI Cards: Cashier Situation Overview */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        {/* Pending Card */}
        <Card
          variant="outlined"
          onClick={() => setSelectedStatus(selectedStatus === 'PENDING' ? 'ALL' : 'PENDING')}
          sx={{
            cursor: 'pointer',
            p: 2,
            borderRadius: '16px',
            bgcolor: 'background.surface',
            borderColor: selectedStatus === 'PENDING' ? 'warning.500' : 'divider',
            transition: 'all 0.15s ease',
            '&:hover': { borderColor: 'warning.400', transform: 'translateY(-2px)' }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                Awaiting Settlement
              </Typography>
              <Typography level="h2" sx={{ fontWeight: 800, color: pendingOrders.length > 0 ? 'warning.500' : 'text.primary', mt: 0.3 }}>
                {pendingOrders.length} {pendingOrders.length === 1 ? 'Order' : 'Orders'}
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.2 }}>
                Total: ₱{pendingTotal.toFixed(2)}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: 'warning.softBg',
                color: 'warning.500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Clock size={22} />
            </Box>
          </Stack>
        </Card>

        {/* Paid Card */}
        <Card
          variant="outlined"
          onClick={() => setSelectedStatus(selectedStatus === 'PAID' ? 'ALL' : 'PAID')}
          sx={{
            cursor: 'pointer',
            p: 2,
            borderRadius: '16px',
            bgcolor: 'background.surface',
            borderColor: selectedStatus === 'PAID' ? 'success.500' : 'divider',
            transition: 'all 0.15s ease',
            '&:hover': { borderColor: 'success.400', transform: 'translateY(-2px)' }
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                Paid / Settled Today
              </Typography>
              <Typography level="h2" sx={{ fontWeight: 800, color: 'success.500', mt: 0.3 }}>
                {paidOrders.length} {paidOrders.length === 1 ? 'Order' : 'Orders'}
              </Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.2 }}>
                Collected: ₱{paidTotal.toFixed(2)}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: 'success.softBg',
                color: 'success.500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={22} />
            </Box>
          </Stack>
        </Card>

        {/* Quick Action / Counter Order CTA */}
        <Card
          variant="solid"
          sx={{
            p: 2,
            borderRadius: '16px',
            bgcolor: 'primary.solidBg',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: 'sm'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography level="title-md" sx={{ color: '#fff', fontWeight: 800 }}>
                Walk-In Register
              </Typography>
              <Typography level="body-xs" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.3 }}>
                Take counter orders directly
              </Typography>
            </Box>
            <Button
              size="md"
              variant="solid"
              onClick={() => setIsWalkInOpen(true)}
              startDecorator={<PlusCircle size={18} />}
              sx={{
                bgcolor: '#fff',
                color: 'primary.solidBg',
                fontWeight: 800,
                borderRadius: '10px',
                px: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' }
              }}
            >
              New Order
            </Button>
          </Stack>
        </Card>
      </Box>

      {/* 2. Top Controls: Search Bar & Segmented Filters */}
      <Sheet
        variant="plain"
        sx={{
          p: 2,
          borderRadius: '16px',
          bgcolor: 'background.surface',
          border: '1px solid',
          borderColor: 'divider',
          mb: 3
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          {/* Prominent Search Bar */}
          <Box sx={{ width: { xs: '100%', md: '440px' } }}>
            <Input
              size="md"
              placeholder="Search Order Ref (e.g. T1-1001) or Table #..."
              startDecorator={<Search size={18} color="var(--joy-palette-primary-500, #e05624)" />}
              endDecorator={
                searchQuery ? (
                  <IconButton size="sm" variant="plain" onClick={() => setSearchQuery('')} sx={{ color: 'text.secondary' }}>
                    <X size={15} />
                  </IconButton>
                ) : null
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                bgcolor: 'background.level1',
                borderColor: 'divider',
                color: 'text.primary',
                borderRadius: '10px',
                '&:focus-within': { borderColor: 'primary.500' }
              }}
            />
          </Box>

          {/* Segmented Status Filters */}
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              bgcolor: 'background.level1',
              p: 0.5,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              flexWrap: 'wrap'
            }}
          >
            <Button
              size="sm"
              variant={selectedStatus === 'ALL' ? 'solid' : 'plain'}
              onClick={() => setSelectedStatus('ALL')}
              sx={{
                borderRadius: '8px',
                px: 1.5,
                fontWeight: 600,
                bgcolor: selectedStatus === 'ALL' ? 'primary.solidBg' : 'transparent',
                color: selectedStatus === 'ALL' ? '#fff' : 'text.secondary',
                '&:hover': { bgcolor: selectedStatus === 'ALL' ? 'primary.solidHoverBg' : 'background.level2' }
              }}
            >
              All ({orders.length})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'PENDING' ? 'solid' : 'plain'}
              onClick={() => setSelectedStatus('PENDING')}
              sx={{
                borderRadius: '8px',
                px: 1.5,
                fontWeight: 600,
                bgcolor: selectedStatus === 'PENDING' ? 'warning.solidBg' : 'transparent',
                color: selectedStatus === 'PENDING' ? '#fff' : 'text.secondary',
                '&:hover': { bgcolor: selectedStatus === 'PENDING' ? 'warning.solidHoverBg' : 'background.level2' }
              }}
            >
              Pending ({pendingOrders.length})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'PAID' ? 'solid' : 'plain'}
              onClick={() => setSelectedStatus('PAID')}
              sx={{
                borderRadius: '8px',
                px: 1.5,
                fontWeight: 600,
                bgcolor: selectedStatus === 'PAID' ? 'success.solidBg' : 'transparent',
                color: selectedStatus === 'PAID' ? '#fff' : 'text.secondary',
                '&:hover': { bgcolor: selectedStatus === 'PAID' ? 'success.solidHoverBg' : 'background.level2' }
              }}
            >
              Paid ({paidOrders.length})
            </Button>
            <Button
              size="sm"
              variant={selectedStatus === 'CANCELLED' ? 'solid' : 'plain'}
              onClick={() => setSelectedStatus('CANCELLED')}
              sx={{
                borderRadius: '8px',
                px: 1.5,
                fontWeight: 600,
                bgcolor: selectedStatus === 'CANCELLED' ? 'danger.solidBg' : 'transparent',
                color: selectedStatus === 'CANCELLED' ? '#fff' : 'text.secondary',
                '&:hover': { bgcolor: selectedStatus === 'CANCELLED' ? 'danger.solidHoverBg' : 'background.level2' }
              }}
            >
              Cancelled ({cancelledOrders.length})
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
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <CircularProgress size="lg" sx={{ color: 'primary.500', mb: 2 }} />
          <Typography level="body-md" sx={{ color: 'text.secondary' }}>
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
          <Receipt size={48} color="var(--joy-palette-text-tertiary, #71717a)" style={{ margin: '0 auto 16px' }} />
          <Typography level="title-lg" sx={{ color: 'text.primary', mb: 0.5, fontWeight: 700 }}>
            No Orders Found
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2.5, maxWidth: 420, mx: 'auto' }}>
            {searchQuery
              ? `No matching orders found for "${searchQuery}". Try searching by order reference or table number.`
              : selectedStatus !== 'ALL'
              ? `No ${selectedStatus.toLowerCase()} orders currently in the system.`
              : 'Waiting for orders from Table QR scans or counter walk-ins.'}
          </Typography>
          <Button
            variant="solid"
            onClick={() => setIsWalkInOpen(true)}
            startDecorator={<PlusCircle size={16} />}
            sx={{
              bgcolor: 'primary.solidBg',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '10px',
              '&:hover': { bgcolor: 'primary.solidHoverBg' }
            }}
          >
            Create Counter Order
          </Button>
        </Box>
      ) : (
        /* Perfectly Aligned Orders Grid */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' },
            gap: 2.5
          }}
        >
          {filteredOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPaid = order.status === 'PAID';
            const isCancelled = order.status === 'CANCELLED';
            const itemCount = order.items?.reduce((sum, it) => sum + it.quantity, 0) || 0;

            return (
              <Card
                key={order.id}
                variant="outlined"
                sx={{
                  bgcolor: 'background.surface',
                  borderColor: isPending ? 'primary.400' : 'divider',
                  boxShadow: isPending ? '0 4px 16px rgba(224, 86, 36, 0.10)' : 'xs',
                  borderRadius: '16px',
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 380,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: isPending ? 'primary.solidBg' : 'primary.300',
                    boxShadow: 'sm'
                  }
                }}
              >
                {/* Upper Section */}
                <Box>
                  {/* Card Header Row 1: Table Badge + Status Chip */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Chip
                      variant="soft"
                      size="sm"
                      color="primary"
                      sx={{
                        fontWeight: 700,
                        fontSize: '11px',
                        borderRadius: '8px',
                        px: 1
                      }}
                    >
                      {order.table_label || `Table ${order.table_number}`}
                    </Chip>

                    <Chip
                      variant="soft"
                      size="sm"
                      color={isPending ? 'warning' : isPaid ? 'success' : 'danger'}
                      sx={{ fontWeight: 700, fontSize: '11px', borderRadius: '8px' }}
                    >
                      {order.status}
                    </Chip>
                  </Stack>

                  {/* Card Header Row 2: Reference Number + Timestamp */}
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
                    <Typography
                      level="title-lg"
                      sx={{
                        color: 'primary.500',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        fontFamily: 'monospace'
                      }}
                    >
                      {order.reference_no}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      {new Date(order.created_at).toLocaleTimeString('en-PH', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Stack>

                  <Divider sx={{ mb: 1.5, borderColor: 'divider' }} />

                  {/* Item List Header */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography level="body-xs" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                      Items
                    </Typography>
                    <Chip size="sm" variant="outlined" sx={{ fontSize: '10px', borderColor: 'divider', color: 'text.tertiary' }}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </Chip>
                  </Stack>

                  {/* Standardized Height Item Container (Scrolls cleanly if > 3 items) */}
                  <Box
                    sx={{
                      height: 110,
                      overflowY: 'auto',
                      pr: 0.5,
                      '&::-webkit-scrollbar': { width: '4px' },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' }
                    }}
                  >
                    <Stack spacing={0.8}>
                      {order.items?.map((item, idx) => (
                        <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ overflow: 'hidden', mr: 1 }}>
                            <Box
                              sx={{
                                px: 0.6,
                                py: 0.1,
                                bgcolor: 'background.level2',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: 'text.secondary',
                                flexShrink: 0
                              }}
                            >
                              {item.quantity}×
                            </Box>
                            <Typography
                              level="body-sm"
                              sx={{
                                color: 'text.primary',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.product_name}
                            </Typography>
                          </Stack>
                          <Typography level="body-sm" sx={{ color: 'text.primary', fontWeight: 600, flexShrink: 0 }}>
                            ₱{Number(item.subtotal).toFixed(2)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>

                  {/* Customer Notes (if any) */}
                  {order.customer_notes && (
                    <Box sx={{ mt: 1, p: 0.8, bgcolor: 'warning.softBg', borderRadius: '6px', border: '1px solid', borderColor: 'warning.200' }}>
                      <Typography level="body-xs" sx={{ color: 'warning.700', fontSize: '11px', fontWeight: 500 }}>
                        Note: {order.customer_notes}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Bottom Total & Actions (Guaranteed Alignment Across All Cards) */}
                <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider', mt: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography level="body-xs" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
                      Total Bill
                    </Typography>
                    <Typography level="h3" sx={{ color: 'text.primary', fontWeight: 800 }}>
                      ₱{Number(order.total).toFixed(2)}
                    </Typography>
                  </Stack>

                  {/* Card Action Buttons */}
                  {isPending && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="solid"
                        fullWidth
                        onClick={() => setActivePaymentOrder(order)}
                        startDecorator={<Banknote size={17} />}
                        sx={{
                          bgcolor: 'primary.solidBg',
                          color: '#fff',
                          fontWeight: 700,
                          py: 1,
                          borderRadius: '10px',
                          '&:hover': { bgcolor: 'primary.solidHoverBg' }
                        }}
                      >
                        Open & Pay
                      </Button>
                      <IconButton
                        variant="outlined"
                        onClick={() => handleCancel(order.id)}
                        sx={{
                          borderColor: 'divider',
                          color: 'danger.500',
                          borderRadius: '10px',
                          '&:hover': { bgcolor: 'danger.softBg' }
                        }}
                      >
                        <XCircle size={18} />
                      </IconButton>
                    </Stack>
                  )}

                  {isPaid && (
                    <Button
                      variant="soft"
                      color="success"
                      fullWidth
                      onClick={() => handleViewReceipt(order.id)}
                      startDecorator={<Printer size={16} />}
                      sx={{
                        borderRadius: '10px',
                        py: 0.9,
                        fontWeight: 700
                      }}
                    >
                      Print Receipt
                    </Button>
                  )}

                  {isCancelled && (
                    <Box sx={{ textAlign: 'center', py: 0.8, bgcolor: 'background.level1', borderRadius: '10px' }}>
                      <Typography level="body-xs" sx={{ color: 'danger.500', fontWeight: 600 }}>
                        Order Cancelled
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Walk-in Order Modal */}
      <WalkInOrderModal
        open={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        onOrderCreated={(newOrder) => {
          setIsWalkInOpen(false);
          setActivePaymentOrder(newOrder);
          loadOrders(true);
        }}
      />

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

export default OrdersPage;

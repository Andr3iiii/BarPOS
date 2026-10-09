import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSLayout } from './layouts/POSLayout';
import { WalkInOrderModal } from './components/WalkInOrderModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { getStoredToken } from './services/api';
import { Order } from './types';
import { posTheme } from './theme';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getStoredToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const [isWalkInOpen, setIsWalkInOpen] = useState<boolean>(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  const handleOrderCreated = (order: Order) => {
    setActivePaymentOrder(order);
  };

  return (
    <CssVarsProvider theme={posTheme} defaultMode="dark" modeStorageKey="barpos_pos_theme">
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Orders Main Screen */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <POSLayout onOpenWalkIn={() => setIsWalkInOpen(true)}>
                  <OrdersPage />
                </POSLayout>
              </ProtectedRoute>
            }
          />

          {/* Dashboard Screen */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <POSLayout onOpenWalkIn={() => setIsWalkInOpen(true)}>
                  <DashboardPage />
                </POSLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/orders" replace />} />
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>

        {/* Global Walk-in counter order modal */}
        <WalkInOrderModal
          open={isWalkInOpen}
          onClose={() => setIsWalkInOpen(false)}
          onOrderCreated={handleOrderCreated}
        />

        {/* Payment modal triggered from walk-in creation */}
        <PaymentModal
          open={Boolean(activePaymentOrder)}
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={(receipt) => {
            setActivePaymentOrder(null);
            setActiveReceipt(receipt);
          }}
        />

        {/* Receipt modal */}
        <ReceiptModal
          open={Boolean(activeReceipt)}
          receiptData={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      </HashRouter>
    </CssVarsProvider>
  );
};

export default App;

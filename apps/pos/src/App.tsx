import React, { useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';

// Authentication & Shared Services
import { getStoredToken, getStoredUser } from './services/api';
import { Order } from './types';
import { posTheme } from './theme';

// Layouts
import { POSLayout } from './layouts/POSLayout';
import { AdminLayout } from './layouts/AdminLayout';

// POS Components & Modals
import { WalkInOrderModal } from './components/WalkInOrderModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { TablesPage } from './pages/admin/TablesPage';
import { SalesPage } from './pages/admin/SalesPage';
import { UsersPage } from './pages/admin/UsersPage';

// Determine Router environment:
// Desktop Electron packaged file:// protocol requires HashRouter.
// Web deployment on Vercel or localhost uses standard BrowserRouter with clean paths.
const isDesktop =
  typeof window !== 'undefined' &&
  (Boolean((window as any).electronAPI) || window.location.protocol === 'file:');

const SmartRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isDesktop) {
    return <HashRouter>{children}</HashRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'cashier')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If cashier tries to access admin-only pages, redirect to /pos
    if (user.role === 'cashier') {
      return <Navigate to="/pos" replace />;
    }
    // If admin is restricted (not applicable, but failsafe)
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/pos" replace />;
};

export const App: React.FC = () => {
  const [isWalkInOpen, setIsWalkInOpen] = useState<boolean>(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  const handleOrderCreated = (order: Order) => {
    setActivePaymentOrder(order);
  };

  return (
    <CssVarsProvider theme={posTheme} defaultMode="dark" modeStorageKey="barpos_theme">
      <CssBaseline />
      <SmartRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Role-Based Redirection */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Dashboard & Management Routes (Admin Role Only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <ProductsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <CategoriesPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tables"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <TablesPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <SalesPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <UsersPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* POS Cashier Terminal Routes (Both Cashier & Admin Permitted) */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={['cashier', 'admin']}>
                <POSLayout onOpenWalkIn={() => setIsWalkInOpen(true)}>
                  <OrdersPage />
                </POSLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos/orders"
            element={
              <ProtectedRoute allowedRoles={['cashier', 'admin']}>
                <POSLayout onOpenWalkIn={() => setIsWalkInOpen(true)}>
                  <OrdersPage />
                </POSLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos/dashboard"
            element={
              <ProtectedRoute allowedRoles={['cashier', 'admin']}>
                <POSLayout onOpenWalkIn={() => setIsWalkInOpen(true)}>
                  <DashboardPage />
                </POSLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy Route Aliases */}
          <Route path="/orders" element={<Navigate to="/pos/orders" replace />} />
          <Route path="/dashboard" element={<Navigate to="/pos/dashboard" replace />} />

          {/* Catch-all Not Found Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global Walk-in counter order modal */}
        <WalkInOrderModal
          open={isWalkInOpen}
          onClose={() => setIsWalkInOpen(false)}
          onOrderCreated={handleOrderCreated}
        />

        {/* Payment modal triggered from walk-in creation or order card */}
        <PaymentModal
          open={Boolean(activePaymentOrder)}
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={(receipt) => {
            setActivePaymentOrder(null);
            setActiveReceipt(receipt);
          }}
        />

        {/* Thermal Receipt modal */}
        <ReceiptModal
          open={Boolean(activeReceipt)}
          receiptData={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      </SmartRouter>
    </CssVarsProvider>
  );
};

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { CustomerOrderPage } from './pages/CustomerOrderPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { customerTheme } from './theme';

export const App: React.FC = () => {
  return (
    <CssVarsProvider theme={customerTheme} defaultMode="dark" modeStorageKey="barpos_customer_theme">
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route
            path="/order/table/:tableNumber"
            element={<CustomerOrderPage />}
          />

          <Route
            path="/order/confirmed/:reference"
            element={<OrderConfirmationPage />}
          />

          <Route
            path="/"
            element={<Navigate to="/order/table/1" replace />}
          />

          <Route
            path="*"
            element={<Navigate to="/order/table/1" replace />}
          />
        </Routes>
      </BrowserRouter>
    </CssVarsProvider>
  );
};

export default App;

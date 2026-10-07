import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { CustomerOrderPage } from './pages/CustomerOrderPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';

export const App: React.FC = () => {
  return (
    <CssVarsProvider defaultMode="dark">
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Main QR route: /order/table/:tableNumber */}
          <Route path="/order/table/:tableNumber" element={<CustomerOrderPage />} />
          <Route path="/order/confirmed/:reference" element={<OrderConfirmationPage />} />
          
          {/* Default redirect to Table 1 for demonstration */}
          <Route path="/" element={<Navigate to="/order/table/1" replace />} />
          <Route path="*" element={<Navigate to="/order/table/1" replace />} />
        </Routes>
      </BrowserRouter>
    </CssVarsProvider>
  );
};

export default App;

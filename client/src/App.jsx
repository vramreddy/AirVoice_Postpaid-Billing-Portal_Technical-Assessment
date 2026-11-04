import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Protected } from './components/Shell';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Subscribe } from './pages/Subscribe';
import { Dashboard } from './pages/Dashboard';
import { Bills } from './pages/Bills';
import { BillDetail } from './pages/BillDetail';
import { Payment } from './pages/Payment';
import { Payments } from './pages/Payments';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/bills"
            element={
              <Protected>
                <Bills />
              </Protected>
            }
          />
          <Route
            path="/bills/:id"
            element={
              <Protected>
                <BillDetail />
              </Protected>
            }
          />
          <Route
            path="/bills/:id/pay"
            element={
              <Protected>
                <Payment />
              </Protected>
            }
          />
          <Route
            path="/payments"
            element={
              <Protected>
                <Payments />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


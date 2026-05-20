import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { LoginPage }     from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage }  from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrdersPage }    from './pages/OrdersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UsersPage }     from './pages/UsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products"  element={<ProductsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="orders"    element={<OrdersPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="users"     element={<ProtectedRoute roles={['admin']} />}>
                <Route index element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

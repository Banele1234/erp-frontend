import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import CustomerList from './components/customers/CustomerList';
import ProductList from './components/products/ProductList';
import InventoryManagement from './components/inventory/InventoryManagement';
import WarehouseManagement from './components/warehouses/WarehouseManagement';
import OrderManagement from './components/orders/OrderManagement';
import InvoiceManagement from './components/invoices/InvoiceManagement';
import PaymentManagement from './components/payments/PaymentManagement';
import RejectionManagement from './components/rejections/RejectionManagement';
import ProductionTrackingManagement from './components/production/ProductionTracking';
import NotificationList from './components/notifications/NotificationList';
import SettingsPage from './components/common/SettingsPage';
import ProfilePage from './components/common/ProfilePage';
import Reports from './components/reports/Reports';
import UserManagement from './components/users/UserManagement';
import DispatchesPage from './components/dispatches/DispatchesPage';
import NotFoundPage from './components/common/NotFoundPage';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  // ✅ useAuth always returns an object (thanks to fallback in AuthContext)
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role || '')) return <Navigate to="/" />;

  return <>{children}</>;
}

function AuthenticatedRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin', 'management']}><Layout><CustomerList /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute allowedRoles={['admin', 'management', 'warehouse_staff']}><Layout><ProductList /></Layout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'management', 'warehouse_staff']}><Layout><InventoryManagement /></Layout></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute allowedRoles={['admin', 'management']}><Layout><WarehouseManagement /></Layout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute allowedRoles={['admin', 'management', 'warehouse_staff', 'production', 'customer']}><Layout><OrderManagement /></Layout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute allowedRoles={['admin', 'management', 'warehouse_staff', 'customer']}><Layout><InvoiceManagement /></Layout></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute allowedRoles={['admin', 'management', 'customer']}><Layout><PaymentManagement /></Layout></ProtectedRoute>} />
      <Route path="/rejections" element={<ProtectedRoute allowedRoles={['admin', 'management', 'warehouse_staff', 'production']}><Layout><RejectionManagement /></Layout></ProtectedRoute>} />
      <Route path="/production" element={<ProtectedRoute allowedRoles={['admin', 'management', 'production']}><Layout><ProductionTrackingManagement /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={['admin', 'management', 'warehouse_staff', 'production', 'customer']}><Layout><NotificationList /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'management']}><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/dispatches" element={<ProtectedRoute allowedRoles={['admin', 'management', 'warehouse_staff']}><Layout><DispatchesPage /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  // ✅ AuthProvider wraps the entire router – context available everywhere
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthenticatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
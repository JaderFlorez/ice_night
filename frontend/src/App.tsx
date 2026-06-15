import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DashboardPage } from './pages/DashboardPage';
import { CatalogPage } from './pages/catalogo/CatalogPage';
import { ProductDetailPage } from './pages/catalogo/ProductDetailPage';
import { MesasPage } from './pages/mesas/MesasPage';
import { AbrirSesionPage } from './pages/sesiones/AbrirSesionPage';
import { SesionPage } from './pages/sesiones/SesionPage';
import { InventoryPage } from './pages/inventario/InventoryPage';
import { ComprasPage } from './pages/inventario/ComprasPage';
import { PublicRoute } from './components/auth/PublicRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Pending approval */}
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/admin/usuarios"
                element={
                  <AdminRoute>
                    <UserManagementPage />
                  </AdminRoute>
                }
              />
              <Route path="/mesas" element={<MesasPage />} />
              <Route path="/mesas/nueva" element={<MesasPage />} />
              <Route path="/mesas/:id/abrir" element={<AbrirSesionPage />} />
              <Route path="/mesas/:id/sesion" element={<SesionPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/catalogo/:id" element={<ProductDetailPage />} />
              <Route path="/inventario" element={<InventoryPage />} />
              <Route
                path="/inventario/compras"
                element={
                  <AdminRoute>
                    <ComprasPage />
                  </AdminRoute>
                }
              />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

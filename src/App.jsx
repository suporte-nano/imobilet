import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Properties from '@/pages/Properties';
import PropertyDetails from '@/pages/PropertyDetails';
import Buyers from '@/pages/Buyers';
import BrokersPage from '@/pages/BrokersPage';
import AddBrokerPage from '@/pages/AddBrokerPage';
import EditBrokerPage from '@/pages/EditBrokerPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Painel from '@/pages/Painel';
import AddProperty from '@/pages/AddProperty';
import EditProperty from '@/pages/EditProperty';
import AddBuyer from '@/pages/AddBuyer';
import EditBuyer from '@/pages/EditBuyer';
import Backup from '@/pages/Backup';
import Financial from '@/pages/Financial';
import PayableAccounts from '@/pages/PayableAccounts';
import ReceivableAccounts from '@/pages/ReceivableAccounts';
import SalesContractDetails from '@/pages/SalesContractDetails';
import AddSalesContract from '@/pages/AddSalesContract';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoading, validateSession } = useAuth();
  
  useEffect(() => {
    if (!isLoading && currentUser) {
      validateSession();
    }
  }, [isLoading, currentUser, validateSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
          <p className="text-emerald-800 font-medium">Verificando acesso...</p>
        </div>
      </div>
    );
  }
  
  return currentUser ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
      </div>
    );
  }
  
  return currentUser ? <Navigate to="/painel" replace /> : children;
};

function AppRoutes() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/painel" replace />} />
          <Route path="/imoveis" element={<Properties />} />
          <Route path="/imoveis/:id" element={<PropertyDetails />} />
          
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/cadastro" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          
          <Route path="/painel" element={<ProtectedRoute><Painel /></ProtectedRoute>} /> 
          <Route path="/adicionar-imovel" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
          <Route path="/editar-imovel/:id" element={<ProtectedRoute><EditProperty /></ProtectedRoute>} />
          <Route path="/compradores" element={<ProtectedRoute><Buyers /></ProtectedRoute>} />
          <Route path="/adicionar-comprador" element={<ProtectedRoute><AddBuyer /></ProtectedRoute>} />
          <Route path="/editar-comprador/:id" element={<ProtectedRoute><EditBuyer /></ProtectedRoute>} />
          <Route path="/corretores" element={<ProtectedRoute><BrokersPage /></ProtectedRoute>} />
          <Route path="/corretores/novo" element={<ProtectedRoute><AddBrokerPage /></ProtectedRoute>} />
          <Route path="/corretores/:id/editar" element={<ProtectedRoute><EditBrokerPage /></ProtectedRoute>} />
          
          <Route path="/financeiro" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
          <Route path="/financeiro/a-pagar" element={<ProtectedRoute><PayableAccounts /></ProtectedRoute>} />
          <Route path="/financeiro/a-receber" element={<ProtectedRoute><ReceivableAccounts /></ProtectedRoute>} />
          <Route path="/financeiro/a-receber/novo" element={<ProtectedRoute><AddSalesContract /></ProtectedRoute>} />
          <Route path="/financeiro/a-receber/contratos/:id" element={<ProtectedRoute><SalesContractDetails /></ProtectedRoute>} />
          
          <Route path="/backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
          <Route path="/dashboard" element={<Navigate to="/painel" replace />} /> 
        </Routes>
      </ErrorBoundary>
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

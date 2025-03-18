import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  useMediaQuery
} from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Componentes e páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientRegistration from './pages/PatientRegistration';
import PatientsList from './pages/PatientsList';
import PatientDetails from './pages/PatientDetails';
import UserManagement from './pages/UserManagement';
import PatientTracking from './pages/PatientTracking';
import PatientReports from './pages/PatientReports';
import MealReports from './pages/MealReports';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';

// Tipos de autenticação
import { UserRole } from './types/auth';

// Componente de proteção de rotas baseado no papel do usuário
const ProtectedRoute = ({ 
  element, 
  allowedRoles, 
  redirectPath = "/login" 
}: { 
  element: React.ReactNode; 
  allowedRoles: UserRole[]; 
  redirectPath?: string;
}) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // Verificar se o usuário tem um dos papéis permitidos
  if (!allowedRoles.includes(user.role)) {
    // Se for um usuário de cadastro, direcionar para a tela de cadastro
    if (user.role === UserRole.REGISTER) {
      return <Navigate to="/patients/register" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{element}</>;
};

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(true); // Tema escuro por padrão
  
  // Criar tema baseado na preferência do usuário
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#3f51b5',
          },
          secondary: {
            main: '#f50057',
          },
        },
      }),
    [darkMode],
  );
  
  // Função para alternar o tema
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Rotas protegidas dentro do layout comum */}
            <Route path="/" element={<Layout toggleTheme={toggleTheme} isDarkMode={darkMode} />}>
              {/* Rota padrão redireciona para dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard - Admin e Cliente */}
              <Route path="dashboard" element={
                <ProtectedRoute 
                  element={<Dashboard />} 
                  allowedRoles={[UserRole.ADMIN, UserRole.CLIENT]} 
                />
              } />
              
              {/* Cadastro de Pacientes - Todos usuários autenticados */}
              <Route path="patients/register" element={
                <ProtectedRoute 
                  element={<PatientRegistration />} 
                  allowedRoles={[UserRole.ADMIN, UserRole.CLIENT, UserRole.REGISTER]} 
                />
              } />
              
              {/* Pacientes em Atendimento - Todos usuários autenticados */}
              <Route path="patients/tracking" element={
                <ProtectedRoute 
                  element={<PatientTracking />} 
                  allowedRoles={[UserRole.ADMIN, UserRole.CLIENT, UserRole.REGISTER]} 
                />
              } />
              
              {/* Listagem de Pacientes - Admin e Cliente */}
              <Route path="patients" element={
                <ProtectedRoute 
                  element={<PatientsList />} 
                  allowedRoles={[UserRole.ADMIN, UserRole.CLIENT]} 
                />
              } />
              
              {/* Detalhes do Paciente - Admin e Cliente */}
              <Route path="patients/:id" element={
                <ProtectedRoute 
                  element={<PatientDetails />} 
                  allowedRoles={[UserRole.ADMIN, UserRole.CLIENT]} 
                />
              } />
              
              {/* Relatórios de Pacientes - Admin e Cliente */}
              <Route path="reports" element={
                <ProtectedRoute 
                  element={<PatientReports />} 
                  allowedRoles={[UserRole.ADMIN, UserRole.CLIENT]} 
                />
              } />
              
              {/* Relatórios de Refeições - Admin e Cliente */}
              <Route path="reports/meals" element={
                <ProtectedRoute 
                  element={<MealReports />} 
                  allowedRoles={[UserRole.ADMIN, UserRole.CLIENT]} 
                />
              } />
              
              {/* Gerenciamento de Usuários - Somente Admin */}
              <Route path="users" element={
                <ProtectedRoute 
                  element={<UserManagement />} 
                  allowedRoles={[UserRole.ADMIN]} 
                />
              } />
              
              {/* Rota para página não encontrada */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

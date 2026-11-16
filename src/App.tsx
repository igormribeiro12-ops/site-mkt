import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProjectProvider } from './context/ProjectContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { PresentationPage } from './pages/PresentationPage';
import { StepPage } from './pages/StepPage';

/** Rotas da aplicação. O roteador (Hash ou Memory) é fornecido por quem renderiza. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AppShell />}>
        <Route path="/etapa/:stepId" element={<StepPage />} />
        <Route path="/painel" element={<DashboardPage />} />
      </Route>
      <Route path="/apresentacao" element={<PresentationPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <ToastProvider>
      <ProjectProvider>
        <AppRoutes />
      </ProjectProvider>
    </ToastProvider>
  );
}

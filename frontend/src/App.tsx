import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import LeadsListPage from '@/pages/leads/LeadsListPage';
import LeadDetailPage from '@/pages/leads/LeadDetailPage';
import ApplicantsListPage from '@/pages/applicants/ApplicantsListPage';
import ApplicantDetailPage from '@/pages/applicants/ApplicantDetailPage';
import FinancePage from '@/pages/finance/FinancePage';
import VendorsListPage from '@/pages/vendors/VendorsListPage';
import VendorDetailPage from '@/pages/vendors/VendorDetailPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import CustomerUploadPage from '@/pages/upload/CustomerUploadPage';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/upload/:token" element={<CustomerUploadPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsListPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/applicants" element={<ApplicantsListPage />} />
        <Route path="/applicants/:id" element={<ApplicantDetailPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/vendors" element={<VendorsListPage />} />
        <Route path="/vendors/:id" element={<VendorDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

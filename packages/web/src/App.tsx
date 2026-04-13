import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './lib/theme';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/dashboard/Dashboard';
import FloorPlan from './pages/floor-plan/FloorPlan';
import UnitList from './pages/units/UnitList';
import PartnerList from './pages/partners/PartnerList';
import ContractList from './pages/contracts/ContractList';
import ContractCreate from './pages/contracts/ContractCreate';
import ContractRenew from './pages/contracts/ContractRenew';
import BillingPage from './pages/billing/BillingPage';
import ReceiptPage from './pages/receipts/ReceiptPage';
import RevenueReport from './pages/reports/RevenueReport';
import AreaReport from './pages/reports/AreaReport';
import ImportExport from './pages/import-export/ImportExport';
import DataCleansing from './pages/data-cleansing/DataCleansing';
import TemplatePage from './pages/templates/TemplatePage';
import SettingsPage from './pages/settings/SettingsPage';
import TenantPortal from './pages/portal/TenantPortal';
import ProfilePage from './pages/profile/ProfilePage';
import MasterDataPage from './pages/master-data/MasterDataPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Public — หน้า Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — ต้อง login ก่อนเข้า */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="/floor-plan" element={<FloorPlan />} />
              <Route path="/units" element={<UnitList />} />
              <Route path="/partners" element={<PartnerList />} />
              <Route path="/contracts" element={<ContractList />} />
              <Route path="/contracts/create" element={<ContractCreate />} />
              <Route path="/contracts/renew" element={<ContractRenew />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/receipts" element={<ReceiptPage />} />
              <Route path="/reports/revenue" element={<RevenueReport />} />
              <Route path="/reports/area" element={<AreaReport />} />
              <Route path="/import-export" element={<ImportExport />} />
              <Route path="/data-cleansing" element={<DataCleansing />} />
              <Route path="/master-data" element={<MasterDataPage />} />
              <Route path="/templates" element={<TemplatePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/portal" element={<TenantPortal />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

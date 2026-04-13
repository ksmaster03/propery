import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './lib/theme';
import AppShell from './components/layout/AppShell';
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
            <Route element={<AppShell />}>
              {/* Phase 1 — Dashboard */}
              <Route index element={<Dashboard />} />

              {/* Phase 2 — พื้นที่ + ผู้เช่า */}
              <Route path="/floor-plan" element={<FloorPlan />} />
              <Route path="/units" element={<UnitList />} />
              <Route path="/partners" element={<PartnerList />} />

              {/* Phase 3 — สัญญาเช่า */}
              <Route path="/contracts" element={<ContractList />} />
              <Route path="/contracts/create" element={<ContractCreate />} />
              <Route path="/contracts/renew" element={<ContractRenew />} />

              {/* Phase 4 — การเงิน */}
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/receipts" element={<ReceiptPage />} />

              {/* Phase 5 — รายงาน + ข้อมูล */}
              <Route path="/reports/revenue" element={<RevenueReport />} />
              <Route path="/reports/area" element={<AreaReport />} />
              <Route path="/import-export" element={<ImportExport />} />
              <Route path="/data-cleansing" element={<DataCleansing />} />

              {/* Phase 6 — ระบบ */}
              <Route path="/templates" element={<TemplatePage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Tenant Portal */}
              <Route path="/portal" element={<TenantPortal />} />

              {/* Profile */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

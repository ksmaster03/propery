import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './lib/theme';
import ProtectedRoute from './components/ProtectedRoute';

// Login โหลดทันที (entry point)
import LoginPage from './pages/auth/LoginPage';

// === Lazy load pages เพื่อลด initial bundle ===
// AppShell + Dashboard lazy — ถ้าผู้ใช้ยังไม่ login จะไม่โหลด layout chunks
const AppShell = lazy(() => import('./components/layout/AppShell'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const FloorPlan = lazy(() => import('./pages/floor-plan/FloorPlan'));
const UnitList = lazy(() => import('./pages/units/UnitList'));
const PartnerList = lazy(() => import('./pages/partners/PartnerList'));
const ContractList = lazy(() => import('./pages/contracts/ContractList'));
const ContractCreate = lazy(() => import('./pages/contracts/ContractCreate'));
const ContractRenew = lazy(() => import('./pages/contracts/ContractRenew'));
const BillingPage = lazy(() => import('./pages/billing/BillingPage'));
const ReceiptPage = lazy(() => import('./pages/receipts/ReceiptPage'));
const RevenueReport = lazy(() => import('./pages/reports/RevenueReport'));
const AreaReport = lazy(() => import('./pages/reports/AreaReport'));
const ImportExport = lazy(() => import('./pages/import-export/ImportExport'));
const DataCleansing = lazy(() => import('./pages/data-cleansing/DataCleansing'));
const TemplatePage = lazy(() => import('./pages/templates/TemplatePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const TenantPortal = lazy(() => import('./pages/portal/TenantPortal'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const MasterDataPage = lazy(() => import('./pages/master-data/MasterDataPage'));
const UserManagement = lazy(() => import('./pages/users/UserManagement'));
const AuditPage = lazy(() => import('./pages/audit/AuditPage'));
const KbPage = lazy(() => import('./pages/kb/KbPage'));
const UnitFloorplanPage = lazy(() => import('./pages/units-floorplan/UnitFloorplanPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

// Loading fallback
function PageLoading() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <CircularProgress />
    </Box>
  );
}

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
                  <Suspense fallback={<PageLoading />}>
                    <AppShell />
                  </Suspense>
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<PageLoading />}><Dashboard /></Suspense>} />
              <Route path="/floor-plan" element={<Suspense fallback={<PageLoading />}><FloorPlan /></Suspense>} />
              <Route path="/units" element={<Suspense fallback={<PageLoading />}><UnitList /></Suspense>} />
              <Route path="/partners" element={<Suspense fallback={<PageLoading />}><PartnerList /></Suspense>} />
              <Route path="/contracts" element={<Suspense fallback={<PageLoading />}><ContractList /></Suspense>} />
              <Route path="/contracts/create" element={<Suspense fallback={<PageLoading />}><ContractCreate /></Suspense>} />
              <Route path="/contracts/renew" element={<Suspense fallback={<PageLoading />}><ContractRenew /></Suspense>} />
              <Route path="/billing" element={<Suspense fallback={<PageLoading />}><BillingPage /></Suspense>} />
              <Route path="/receipts" element={<Suspense fallback={<PageLoading />}><ReceiptPage /></Suspense>} />
              <Route path="/reports/revenue" element={<Suspense fallback={<PageLoading />}><RevenueReport /></Suspense>} />
              <Route path="/reports/area" element={<Suspense fallback={<PageLoading />}><AreaReport /></Suspense>} />
              <Route path="/import-export" element={<Suspense fallback={<PageLoading />}><ImportExport /></Suspense>} />
              <Route path="/data-cleansing" element={<Suspense fallback={<PageLoading />}><DataCleansing /></Suspense>} />
              <Route path="/master-data" element={<Suspense fallback={<PageLoading />}><MasterDataPage /></Suspense>} />
              <Route path="/users" element={<Suspense fallback={<PageLoading />}><UserManagement /></Suspense>} />
              <Route path="/audit" element={<Suspense fallback={<PageLoading />}><AuditPage /></Suspense>} />
              <Route path="/templates" element={<Suspense fallback={<PageLoading />}><TemplatePage /></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<PageLoading />}><SettingsPage /></Suspense>} />
              <Route path="/portal" element={<Suspense fallback={<PageLoading />}><TenantPortal /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<PageLoading />}><ProfilePage /></Suspense>} />
              <Route path="/kb" element={<Suspense fallback={<PageLoading />}><KbPage /></Suspense>} />
              <Route path="/units-floorplan" element={<Suspense fallback={<PageLoading />}><UnitFloorplanPage /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

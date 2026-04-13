import { useQuery } from '@tanstack/react-query';
import api from './client';

// === React Query hooks เรียก API ทั้งหมด ===

// Dashboard KPI
export interface DashboardKpi {
  totalUnits: number;
  leasedUnits: number;
  vacantUnits: number;
  reservedUnits: number;
  totalAreaSqm: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export function useDashboardKpi(airportId?: number) {
  return useQuery({
    queryKey: ['dashboard', 'kpi', airportId],
    queryFn: async (): Promise<DashboardKpi> => {
      const { data } = await api.get('/dashboard/kpi', {
        params: airportId ? { airportId } : undefined,
      });
      return data.data;
    },
  });
}

// Dashboard — สัญญาใกล้หมดอายุ
export interface ExpiringContract {
  contractNo: string;
  partnerName: string;
  shopName: string;
  unitCode: string;
  unitName: string;
  airport: string;
  endDate: string;
  daysLeft: number;
  urgency: 'urgent' | 'warning' | 'normal';
}

export function useExpiringContracts(days = 90) {
  return useQuery({
    queryKey: ['dashboard', 'expiring', days],
    queryFn: async (): Promise<ExpiringContract[]> => {
      const { data } = await api.get('/dashboard/expiring-contracts', {
        params: { days },
      });
      return data.data;
    },
  });
}

// Dashboard — กราฟรายรับรายเดือน
export interface RevenueChartPoint {
  month: string;
  monthIndex: number;
  actual: number;
  forecast: number;
}

export function useRevenueChart(year?: number) {
  return useQuery({
    queryKey: ['dashboard', 'revenue-chart', year],
    queryFn: async (): Promise<RevenueChartPoint[]> => {
      const { data } = await api.get('/dashboard/revenue-chart', {
        params: year ? { year } : undefined,
      });
      return data.data;
    },
  });
}

// === Units ===
export interface Unit {
  id: number;
  unitCode: string;
  unitNameTh: string | null;
  areaSqm: number;
  status: 'VACANT' | 'LEASED' | 'RESERVED' | 'MAINTENANCE';
  purpose: string | null;
  zoneCode?: string;
  zoneNameTh?: string;
  airportCode: string;
  airportNameTh: string;
  currentTenant?: string | null;
  currentShop?: string | null;
  currentContractNo?: string | null;
}

export function useUnits(params?: { airportId?: number; status?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['units', 'list', params],
    queryFn: async (): Promise<{ data: Unit[]; total: number }> => {
      const { data } = await api.get('/units', { params });
      return { data: data.data, total: data.total };
    },
  });
}

// === Partners ===
export interface Partner {
  id: number;
  partnerCode: string;
  partnerType: 'INDIVIDUAL' | 'JURISTIC';
  nameTh: string;
  nameEn?: string | null;
  shopNameTh?: string | null;
  taxId: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  contractCount: number;
}

export function usePartners(params?: { search?: string; type?: string; page?: number }) {
  return useQuery({
    queryKey: ['partners', 'list', params],
    queryFn: async (): Promise<{ data: Partner[]; total: number }> => {
      const { data } = await api.get('/partners', { params });
      return { data: data.data, total: data.total };
    },
  });
}

// === Contracts ===
export interface Contract {
  id: number;
  contractNo: string;
  contractType: 'FIXED_RENT' | 'REVENUE_SHARING' | 'CONSIGNMENT' | 'REAL_ESTATE';
  contractStatus: string;
  airportCode: string;
  unitCode: string;
  areaSqm: number;
  partnerName: string;
  shopName: string | null;
  startDate: string;
  endDate: string;
  durationMonths: number | null;
  daysLeft: number;
  monthlyRent: number | null;
  currentStepNo: number;
}

export function useContracts(params?: { airportId?: number; status?: string; type?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['contracts', 'list', params],
    queryFn: async (): Promise<{ data: Contract[]; total: number }> => {
      const { data } = await api.get('/contracts', { params });
      return { data: data.data, total: data.total };
    },
  });
}

// === Bills ===
export interface Bill {
  id: number;
  billNo: string;
  contractNo: string;
  unitCode: string;
  partnerName: string;
  shopName: string | null;
  billingMonth: string;
  dueDate: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'CANCELLED';
  rentAmount: number;
  totalAmount: number;
  paidAmount: number | null;
  lateFeeAmount: number | null;
  overdueDays: number | null;
}

export function useBills(params?: { status?: string; contractId?: number; page?: number }) {
  return useQuery({
    queryKey: ['bills', 'list', params],
    queryFn: async (): Promise<{ data: Bill[]; total: number }> => {
      const { data } = await api.get('/bills', { params });
      return { data: data.data, total: data.total };
    },
  });
}
